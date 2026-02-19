import axios from 'axios';

const SHEETDB_API_URL = import.meta.env.VITE_SHEETDB_API_URL || 'https://sheetdb.io/api/v1/tjpqhngurtnvq';

const STUDENT_SHEET = 'Student';
const PAYMENT_SHEET = 'Payment';

// ─────────────────────────────────────────────────────────────
// Sheet Governance
//
// Student sheet columns:
//   id | username | email | mobile | aadhar_number | monthly_fee
//   is_free | subscription_start | subscription_end
//   current_month_paid | created_at
//
// Payment sheet columns:
//   id | month | year | amount | status | payment_date
//
//   id = composite key: "{studentId}-{month}-{year}"
//        e.g. "369-1-2026" → student 369, February 2026
// ─────────────────────────────────────────────────────────────

const paymentRowId = (studentId, month, year) => `${studentId}-${month}-${year}`;

// Parse student_id back out of the composite id for dashboard use
const parsePayId = (id = '') => {
    const parts = String(id).split('-');
    const year = parts.pop();
    const month = parts.pop();
    const student_id = parts.join('-');
    return { student_id, month, year };
};

// SheetDB returns 404 when search has 0 results — convert to []
const safeSearch = async (sheet, params) => {
    try {
        const qs = Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        const res = await axios.get(`${SHEETDB_API_URL}/search?${qs}&sheet=${sheet}`);
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        if (err.response?.status === 404) return [];
        throw err;
    }
};

// ─────────────────────────────────────────────────────────────
// SheetDB body formats:
//   POST  → send row directly (SheetDB accepts plain object)
//   PATCH → must wrap in { data: {...} } for updates to apply
// ─────────────────────────────────────────────────────────────
const sheetPost = (url, row) => axios.post(url, row);               // direct object
const sheetPatch = (url, updates) => axios.patch(url, { data: updates }); // must be wrapped

export const sheetDbApi = {

    // ═══════════════════════════════════════════════════════════
    // STUDENT MANAGEMENT  →  "Student" sheet
    // ═══════════════════════════════════════════════════════════

    getStudents: async () => {
        try {
            const res = await axios.get(`${SHEETDB_API_URL}?sheet=${STUDENT_SHEET}`);
            const students = (res.data || []).map(row => ({
                id: row.id,
                username: row.username,
                email: row.email,
                mobile: row.mobile,
                aadhar_number: row.aadhar_number,
                monthly_fee: row.monthly_fee,
                is_free: row.is_free === 'TRUE' || parseFloat(row.monthly_fee) === 0,
                current_month_paid: row.current_month_paid === 'TRUE',
                created_at: row.created_at,
                subscriptions: [{
                    start_date: row.subscription_start,
                    end_date: row.subscription_end,
                    amount: row.monthly_fee,
                    status: row.current_month_paid === 'TRUE' ? 'active' : 'pending'
                }]
            }));
            return { success: true, students };
        } catch (err) {
            console.error('getStudents Error:', err);
            return { success: false, message: err.message, students: [] };
        }
    },

    createStudent: async (_token, data) => {
        try {
            const id = data.id || `STU-${Date.now()}`;
            const row = {
                id,
                username: data.username,
                email: data.email,
                mobile: data.mobile,
                aadhar_number: data.aadhar_number,
                monthly_fee: data.is_free ? 0 : data.monthly_fee,
                is_free: data.is_free ? 'TRUE' : 'FALSE',
                subscription_start: data.subscription_start,
                subscription_end: data.subscription_end,
                current_month_paid: data.paid_this_month ? 'TRUE' : 'FALSE',
                created_at: new Date().toISOString()
            };
            await sheetPost(`${SHEETDB_API_URL}?sheet=${STUDENT_SHEET}`, row);
            return { success: true, student: { ...row, id } };
        } catch (err) {
            console.error('createStudent Error:', err.response?.data || err.message);
            return { success: false, message: err.response?.data?.error || err.message };
        }
    },

    updateProfile: async (id, updates) => {
        try {
            const fmt = { ...updates };
            if (typeof fmt.is_free === 'boolean') fmt.is_free = fmt.is_free ? 'TRUE' : 'FALSE';
            if (typeof fmt.current_month_paid === 'boolean') fmt.current_month_paid = fmt.current_month_paid ? 'TRUE' : 'FALSE';
            await sheetPatch(`${SHEETDB_API_URL}/id/${id}?sheet=${STUDENT_SHEET}`, fmt);
            return { success: true };
        } catch (err) {
            console.error('updateProfile Error:', err.response?.data || err.message);
            return { success: false, message: err.message };
        }
    },

    deleteStudent: async (_token, id) => {
        try {
            await axios.delete(`${SHEETDB_API_URL}/id/${id}?sheet=${STUDENT_SHEET}`);
            return { success: true };
        } catch (err) {
            console.error('deleteStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // PAYMENT MANAGEMENT  →  "Payment" sheet
    //
    // id format: "{studentId}-{month}-{year}"  e.g. "369-1-2026"
    // One row per student per month.
    // ═══════════════════════════════════════════════════════════

    getPayments: async () => {
        try {
            const res = await axios.get(`${SHEETDB_API_URL}?sheet=${PAYMENT_SHEET}`);
            const payments = (res.data || []).map(row => ({
                ...row,
                ...parsePayId(row.id) // injects { student_id, month, year }
            }));
            return { success: true, payments };
        } catch (err) {
            console.error('getPayments Error:', err.message);
            return { success: true, payments: [] };
        }
    },

    // Called on: student registration + every status toggle in the dashboard
    recordPayment: async (studentId, month, year, amount, isPaid) => {
        const pid = paymentRowId(studentId, month, year);
        const monthStr = String(month);
        const yearStr = String(year);
        const paymentDate = isPaid ? new Date().toISOString() : '';

        console.log(`[Payment] recordPayment called → id:${pid} status:${isPaid ? 'Paid' : 'Unpaid'} amount:${amount}`);

        try {
            // Check if a row already exists for this student+month+year
            const existing = await safeSearch(PAYMENT_SHEET, { id: pid });
            console.log(`[Payment] existing rows found:`, existing.length);

            if (existing.length > 0) {
                // ── UPDATE existing row ─────────────────────────────────
                console.log(`[Payment] PATCHING row id:${pid}`);
                await sheetPatch(
                    `${SHEETDB_API_URL}/id/${pid}?sheet=${PAYMENT_SHEET}`,
                    {
                        amount: String(amount),
                        status: isPaid ? 'Paid' : 'Unpaid',
                        payment_date: paymentDate
                    }
                );
                console.log(`[Payment] PATCH success`);
            } else {
                // ── CREATE new row ──────────────────────────────────────
                console.log(`[Payment] POSTing new row id:${pid}`);
                await sheetPost(
                    `${SHEETDB_API_URL}?sheet=${PAYMENT_SHEET}`,
                    {
                        id: pid,
                        month: monthStr,
                        year: yearStr,
                        amount: String(amount),
                        status: isPaid ? 'Paid' : 'Unpaid',
                        payment_date: paymentDate
                    }
                );
                console.log(`[Payment] POST success`);
            }
            return { success: true };
        } catch (err) {
            console.error('[Payment] recordPayment FAILED:', err.response?.status, err.response?.data || err.message);
            return { success: false, message: err.message };
        }
    },

    // Auto-create "Unpaid" rows for students with no Payment entry for the month.
    // Called on dashboard load so every paid student appears in the Payment sheet.
    syncPaymentRecords: async (students, month, year) => {
        try {
            const allPaymentsRes = await axios.get(`${SHEETDB_API_URL}?sheet=${PAYMENT_SHEET}`).catch(() => ({ data: [] }));
            const existing = new Set((allPaymentsRes.data || []).map(p => String(p.id)));

            const toCreate = students.filter(s =>
                parseFloat(s.monthly_fee) > 0 &&
                !existing.has(paymentRowId(s.id, month, year))
            );

            for (const s of toCreate) {
                const pid = paymentRowId(s.id, month, year);
                await sheetPost(`${SHEETDB_API_URL}?sheet=${PAYMENT_SHEET}`, {
                    id: pid,
                    month: String(month),
                    year: String(year),
                    amount: String(s.monthly_fee),
                    status: 'Unpaid',
                    payment_date: ''
                });
            }
            return { success: true };
        } catch (err) {
            console.error('syncPaymentRecords Error:', err.message);
            return { success: false };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // AUTH  (Admin login via AuthContext — not SheetDB)
    // ═══════════════════════════════════════════════════════════
    login: async () => ({ success: false, message: 'Student login disabled' }),
    logout: async () => ({ success: true }),

    // Stubs for unused sheets
    getResources: async () => ({ success: true, resources: [] }),
    createResource: async () => ({ success: false, message: 'Resources sheet not set up' }),
    deleteResource: async () => ({ success: false, message: 'Resources sheet not set up' }),
    getProgress: async () => ({ success: true, progress: [] }),
    updateProgress: async () => ({ success: false, message: 'Progress sheet not set up' }),
};

export default sheetDbApi;
