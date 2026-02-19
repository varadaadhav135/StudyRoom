import axios from 'axios';

const SHEETDB_API_URL = import.meta.env.VITE_SHEETDB_API_URL || 'https://sheetdb.io/api/v1/tjpqhngurtnvq';

const STUDENT_SHEET = 'Student';

// ─────────────────────────────────────────────────────────────
// Single-Sheet Schema (one sheet only: "Student")
//
// row_key          → unique per student-month: "{id}-{month}-{year}"  e.g. "369-1-2026"
// id               → student desk number (e.g. "369")
// username         → full name
// email            →
// mobile           →
// aadhar_number    →
// monthly_fee      → fee amount (0 = free student)
// subscription_start →
// subscription_end →
// current_month_paid → TRUE / FALSE (legacy-compat, mirrors status)
// month            → 0-indexed (January = 0)
// year             → 4-digit year
// amount           → fee charged for this row's month
// status           → "Paid" | "Unpaid" | "Free"
//
// IMPORTANT: SheetDB PATCH uses /id/{row_key} to update a unique row.
// ─────────────────────────────────────────────────────────────

const rowKey = (studentId, month, year) => `${studentId}-${month}-${year}`;

// SheetDB returns 404 when search has 0 results — convert to []
const safeSearch = async (params) => {
    try {
        const qs = Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        const res = await axios.get(`${SHEETDB_API_URL}/search?${qs}&sheet=${STUDENT_SHEET}`);
        return Array.isArray(res.data) ? res.data : [];
    } catch (err) {
        if (err.response?.status === 404) return [];
        throw err;
    }
};

// SheetDB body formats:
//   POST  → send row directly (plain object)
//   PATCH → must wrap in { data: {...} }
const sheetPost = (url, row) => axios.post(url, row);
const sheetPatch = (url, updates) => axios.patch(url, { data: updates });

export const sheetDbApi = {

    // ═══════════════════════════════════════════════════════════
    // STUDENTS — fetch all rows, deduplicate by id to get
    //            the canonical student profile (latest row wins)
    // ═══════════════════════════════════════════════════════════
    getStudents: async () => {
        try {
            const res = await axios.get(`${SHEETDB_API_URL}?sheet=${STUDENT_SHEET}`);
            const rows = res.data || [];

            // De-duplicate: one student object per unique `id`
            // Use the first occurrence (rows are in insert order, so the base profile)
            const seen = new Set();
            const students = [];
            for (const row of rows) {
                if (!seen.has(row.id)) {
                    seen.add(row.id);
                    students.push({
                        id: row.id,
                        username: row.username,
                        email: row.email,
                        mobile: row.mobile,
                        aadhar_number: row.aadhar_number,
                        monthly_fee: row.monthly_fee,
                        is_free: parseFloat(row.monthly_fee) === 0,
                        current_month_paid: row.current_month_paid === 'TRUE',
                        created_at: row.created_at,
                        subscriptions: [{
                            start_date: row.subscription_start,
                            end_date: row.subscription_end,
                            amount: row.monthly_fee,
                            status: row.status === 'Paid' ? 'active' : 'pending'
                        }]
                    });
                }
            }
            return { success: true, students };
        } catch (err) {
            console.error('getStudents Error:', err);
            return { success: false, message: err.message, students: [] };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // PAYMENTS — return every row as a payment record.
    //            student_id is just the `id` column.
    // ═══════════════════════════════════════════════════════════
    getPayments: async () => {
        try {
            const res = await axios.get(`${SHEETDB_API_URL}?sheet=${STUDENT_SHEET}`);
            const rows = res.data || [];
            const payments = rows
                .filter(row => row.month !== '' && row.year !== '')   // skip rows without month info
                .map(row => ({
                    id: row.row_key || rowKey(row.id, row.month, row.year),
                    student_id: String(row.id),
                    month: String(row.month),
                    year: String(row.year),
                    amount: row.amount || row.monthly_fee || '0',
                    status: row.status || 'Unpaid',
                    payment_date: row.payment_date || ''
                }));
            return { success: true, payments };
        } catch (err) {
            console.error('getPayments Error:', err.message);
            return { success: true, payments: [] };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CREATE STUDENT — inserts one row for the current month
    // ═══════════════════════════════════════════════════════════
    createStudent: async (_token, data) => {
        try {
            const id = data.id || `STU-${Date.now()}`;
            const now = new Date();
            const month = String(now.getMonth());
            const year = String(now.getFullYear());
            const rk = rowKey(id, month, year);
            const isFree = data.is_free || parseFloat(data.monthly_fee) === 0;
            const isPaid = !isFree && data.paid_this_month;

            const row = {
                row_key: rk,
                id,
                username: data.username,
                email: data.email,
                mobile: data.mobile,
                aadhar_number: data.aadhar_number,
                monthly_fee: isFree ? '0' : String(data.monthly_fee),
                subscription_start: data.subscription_start,
                subscription_end: data.subscription_end,
                current_month_paid: isPaid ? 'TRUE' : 'FALSE',
                month,
                year,
                amount: isFree ? '0' : String(data.monthly_fee),
                status: isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid'),
                created_at: now.toISOString()
            };

            console.log('[createStudent] Posting row:', row);
            await sheetPost(`${SHEETDB_API_URL}?sheet=${STUDENT_SHEET}`, row);
            return { success: true, student: { ...row, id } };
        } catch (err) {
            console.error('createStudent Error:', err.response?.data || err.message);
            return { success: false, message: err.response?.data?.error || err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UPDATE STUDENT PROFILE — updates profile fields across ALL
    // rows for this student (all months share the same base data)
    // ═══════════════════════════════════════════════════════════
    updateProfile: async (id, updates) => {
        try {
            const fmt = { ...updates };
            if (typeof fmt.is_free === 'boolean') fmt.is_free = fmt.is_free ? 'TRUE' : 'FALSE';
            if (typeof fmt.current_month_paid === 'boolean') fmt.current_month_paid = fmt.current_month_paid ? 'TRUE' : 'FALSE';

            // Remove payment-specific fields from profile updates (those go through recordPayment)
            delete fmt.month;
            delete fmt.year;
            delete fmt.status;
            delete fmt.amount;
            delete fmt.row_key;

            // SheetDB PATCH by column value: update all rows where id = studentId
            await sheetPatch(
                `${SHEETDB_API_URL}/id/${id}?sheet=${STUDENT_SHEET}`,
                fmt
            );
            return { success: true };
        } catch (err) {
            console.error('updateProfile Error:', err.response?.data || err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // DELETE STUDENT — removes ALL rows for this student id
    // ═══════════════════════════════════════════════════════════
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
    // RECORD PAYMENT — upsert the payment status for a specific
    //                  student + month + year.
    //   - If the row exists (by row_key): PATCH status/amount
    //   - If not: POST a new row (happens when switching months)
    // ═══════════════════════════════════════════════════════════
    recordPayment: async (studentId, month, year, amount, isPaid) => {
        const rk = rowKey(studentId, month, year);
        const monthStr = String(month);
        const yearStr = String(year);
        const isFree = parseFloat(amount) === 0;
        const status = isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid');
        const paymentDate = isPaid ? new Date().toISOString() : '';

        console.log(`[recordPayment] rk:${rk} status:${status} amount:${amount}`);

        try {
            // Check if row exists for this student+month+year
            const existing = await safeSearch({ row_key: rk });
            console.log(`[recordPayment] existing rows:`, existing.length);

            if (existing.length > 0) {
                // ── UPDATE existing row ──────────────────────────────
                console.log(`[recordPayment] PATCHing row_key:${rk}`);
                await sheetPatch(
                    `${SHEETDB_API_URL}/id/${rk}?sheet=${STUDENT_SHEET}`,
                    {
                        amount: String(amount),
                        status,
                        current_month_paid: isPaid ? 'TRUE' : 'FALSE',
                        payment_date: paymentDate
                    }
                );
                console.log(`[recordPayment] PATCH success`);
            } else {
                // ── CREATE new row for this month ────────────────────
                // First fetch the student's profile data to fill in all columns
                const studentRows = await safeSearch({ id: String(studentId) });
                const profile = studentRows[0] || {};

                const newRow = {
                    row_key: rk,
                    id: String(studentId),
                    username: profile.username || '',
                    email: profile.email || '',
                    mobile: profile.mobile || '',
                    aadhar_number: profile.aadhar_number || '',
                    monthly_fee: profile.monthly_fee || String(amount),
                    subscription_start: profile.subscription_start || '',
                    subscription_end: profile.subscription_end || '',
                    current_month_paid: isPaid ? 'TRUE' : 'FALSE',
                    month: monthStr,
                    year: yearStr,
                    amount: String(amount),
                    status,
                    payment_date: paymentDate
                };

                console.log(`[recordPayment] POSTing new row:`, newRow);
                await sheetPost(`${SHEETDB_API_URL}?sheet=${STUDENT_SHEET}`, newRow);
                console.log(`[recordPayment] POST success`);
            }
            return { success: true };
        } catch (err) {
            console.error('[recordPayment] FAILED:', err.response?.status, err.response?.data || err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // AUTH
    // ═══════════════════════════════════════════════════════════
    login: async () => ({ success: false, message: 'Student login disabled' }),
    logout: async () => ({ success: true }),

    // Stubs
    getResources: async () => ({ success: true, resources: [] }),
    createResource: async () => ({ success: false, message: 'Resources sheet not set up' }),
    deleteResource: async () => ({ success: false, message: 'Resources sheet not set up' }),
    getProgress: async () => ({ success: true, progress: [] }),
    updateProgress: async () => ({ success: false, message: 'Progress sheet not set up' }),

    // No longer needed — kept as no-op so old calls don't crash
    syncPaymentRecords: async () => ({ success: true }),
};

export default sheetDbApi;
