import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Apps Script Web App API — Single Sheet Edition
//
// Set VITE_APPS_SCRIPT_URL in your .env:
//   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
//
// Sheet: "Student"  (exact header row — no extra columns)
// Columns:
//   id | username | email | mobile | aadhar_number | monthly_fee |
//   subscription_start | subscription_end | current_month_paid |
//   month | year | amount | status
//
// One row = one student for one month.
// Unique row identity = id + month + year  (handled by searchMulti/updateMulti)
// ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

if (!API_URL) {
    console.warn('[API] VITE_APPS_SCRIPT_URL is not set in .env');
}

// ─── HTTP helpers ────────────────────────────────────────────────────────────

const appsGet = async (params) => {
    const qs = new URLSearchParams(params).toString();
    const res = await axios.get(`${API_URL}?${qs}`);
    if (!res.data?.success) throw new Error(res.data?.error || 'Apps Script returned failure');
    return res.data;
};

const appsPost = async (queryParams, body) => {
    const qs = new URLSearchParams(queryParams).toString();
    const res = await axios.post(`${API_URL}?${qs}`, body);
    if (!res.data?.success) throw new Error(res.data?.error || 'Apps Script returned failure');
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────

export const sheetDbApi = {

    // ═══════════════════════════════════════════════════════════
    // GET STUDENTS
    // Reads all rows, deduplicates by `id`.
    // Each student = the first row found for their id
    // (subsequent rows are their payment history for other months).
    // ═══════════════════════════════════════════════════════════
    getStudents: async () => {
        try {
            const result = await appsGet({ action: 'getAll' });
            const seen = new Set();
            const students = [];

            for (const row of (result.data || [])) {
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
                        subscription_start: row.subscription_start,
                        subscription_end: row.subscription_end,
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
            console.error('getStudents Error:', err.message);
            return { success: false, message: err.message, students: [] };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // GET PAYMENTS
    // Every row = one payment record.
    // ═══════════════════════════════════════════════════════════
    getPayments: async () => {
        try {
            const result = await appsGet({ action: 'getAll' });
            const payments = (result.data || [])
                .filter(row => row.month !== '' && row.year !== '')
                .map(row => ({
                    id: `${row.id}-${row.month}-${row.year}`,
                    student_id: String(row.id),
                    month: String(row.month),
                    year: String(row.year),
                    amount: row.amount || row.monthly_fee || '0',
                    status: row.status || 'Unpaid'
                }));
            return { success: true, payments };
        } catch (err) {
            console.error('getPayments Error:', err.message);
            return { success: true, payments: [] };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CREATE STUDENT
    // Inserts one row: student profile + current month's payment.
    // ═══════════════════════════════════════════════════════════
    createStudent: async (_token, data) => {
        try {
            const id = data.id || `STU-${Date.now()}`;
            const now = new Date();
            const month = String(now.getMonth());   // 0-indexed
            const year = String(now.getFullYear());
            const isFree = data.is_free || parseFloat(data.monthly_fee) === 0;
            const isPaid = !isFree && !!data.paid_this_month;

            const row = {
                id,
                username: data.username || '',
                email: data.email || '',
                mobile: data.mobile || '',
                aadhar_number: data.aadhar_number || '',
                monthly_fee: isFree ? '0' : String(data.monthly_fee),
                subscription_start: data.subscription_start || '',
                subscription_end: data.subscription_end || '',
                current_month_paid: isPaid ? 'TRUE' : 'FALSE',
                month,
                year,
                amount: isFree ? '0' : String(data.monthly_fee),
                status: isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid')
            };

            console.log('[createStudent] Inserting:', row);
            await appsPost({ action: 'insert' }, { row });
            return { success: true, student: { ...row } };
        } catch (err) {
            console.error('createStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UPDATE STUDENT PROFILE
    // Updates all rows that share the same id (all months).
    // Only updates profile fields — not payment-specific columns.
    // ═══════════════════════════════════════════════════════════
    updateProfile: async (id, updates) => {
        try {
            const fmt = { ...updates };
            // Convert booleans to strings
            if (typeof fmt.is_free === 'boolean') fmt.is_free = fmt.is_free ? 'TRUE' : 'FALSE';
            if (typeof fmt.current_month_paid === 'boolean') fmt.current_month_paid = fmt.current_month_paid ? 'TRUE' : 'FALSE';
            // Do NOT overwrite payment-specific columns via profile update
            delete fmt.month; delete fmt.year; delete fmt.status; delete fmt.amount;

            await appsPost({ action: 'update' }, { col: 'id', val: String(id), updates: fmt });
            return { success: true };
        } catch (err) {
            console.error('updateProfile Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // DELETE STUDENT
    // Deletes all rows for this student (all months).
    // ═══════════════════════════════════════════════════════════
    deleteStudent: async (_token, id) => {
        try {
            await appsPost({ action: 'deleteMulti' }, { id: String(id) });
            return { success: true };
        } catch (err) {
            console.error('deleteStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RECORD PAYMENT
    // Upserts payment status for a specific student + month + year.
    //   - Row exists  → updateMulti (patches status/amount only)
    //   - Row missing → insert a new row for that month
    // ═══════════════════════════════════════════════════════════
    recordPayment: async (studentId, month, year, amount, isPaid) => {
        const isFree = parseFloat(amount) === 0;
        const status = isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid');
        const monthStr = String(month);
        const yearStr = String(year);

        console.log(`[recordPayment] id:${studentId} ${monthStr}/${yearStr} → ${status}`);

        try {
            // 1. Check if a row already exists for this student+month+year
            const searchResult = await appsGet({
                action: 'searchMulti',
                id: String(studentId),
                month: monthStr,
                year: yearStr
            });
            const existing = searchResult.data || [];

            if (existing.length > 0) {
                // ── UPDATE existing row ─────────────────────────────
                await appsPost({ action: 'updateMulti' }, {
                    id: String(studentId),
                    month: monthStr,
                    year: yearStr,
                    updates: {
                        amount: String(amount),
                        status,
                        current_month_paid: isPaid ? 'TRUE' : 'FALSE'
                    }
                });
                console.log('[recordPayment] Updated existing row');
            } else {
                // ── INSERT new row for this month ───────────────────
                // Fetch the student's base profile to fill all columns
                const profileResult = await appsGet({ action: 'search', col: 'id', val: String(studentId) });
                const profile = (profileResult.data || [])[0] || {};

                const newRow = {
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
                    status
                };
                await appsPost({ action: 'insert' }, { row: newRow });
                console.log('[recordPayment] Inserted new row for month', monthStr, yearStr);
            }
            return { success: true };
        } catch (err) {
            console.error('[recordPayment] FAILED:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // AUTH & STUBS
    // ═══════════════════════════════════════════════════════════
    login: async () => ({ success: false, message: 'Student login disabled' }),
    logout: async () => ({ success: true }),
    getResources: async () => ({ success: true, resources: [] }),
    createResource: async () => ({ success: false, message: 'Not implemented' }),
    deleteResource: async () => ({ success: false, message: 'Not implemented' }),
    getProgress: async () => ({ success: true, progress: [] }),
    updateProgress: async () => ({ success: false, message: 'Not implemented' }),
    syncPaymentRecords: async () => ({ success: true }), // no-op
};

export default sheetDbApi;
