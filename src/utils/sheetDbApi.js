import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Apps Script Web App API
//
// Set VITE_APPS_SCRIPT_URL in your .env to the deployed Web App URL:
//   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
//
// Sheet: "Student"
// Columns: row_key | id | username | email | mobile | aadhar_number |
//          monthly_fee | subscription_start | subscription_end |
//          current_month_paid | month | year | amount | status | created_at
//
// row_key = "{id}-{month}-{year}"  (unique per student per month)
// ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

if (!API_URL) {
    console.warn('[API] VITE_APPS_SCRIPT_URL is not set. Set it in .env after deploying your Apps Script.');
}

// ─── low-level helpers ───────────────────────────────────────────────────────

// Apps Script Web Apps require GET for reads, POST for writes.
// To avoid CORS preflight issues with POST, all writes are sent as POST
// with JSON body. The script reads e.postData.contents.

const get = async (params) => {
    const qs = new URLSearchParams({ ...params }).toString();
    const res = await axios.get(`${API_URL}?${qs}`);
    return res.data;
};

const post = async (params, body) => {
    const qs = new URLSearchParams({ ...params }).toString();
    const res = await axios.post(`${API_URL}?${qs}`, body);
    return res.data;
};

// ─── composite row key ───────────────────────────────────────────────────────
const rowKey = (studentId, month, year) => `${studentId}-${month}-${year}`;

export const sheetDbApi = {

    // ═══════════════════════════════════════════════════════════
    // GET STUDENTS
    // Fetches all rows, deduplicates by `id` to get student list.
    // ═══════════════════════════════════════════════════════════
    getStudents: async () => {
        try {
            const result = await get({ action: 'getAll' });
            if (!result.success) throw new Error(result.error);

            const seen = new Set();
            const students = [];
            for (const row of result.data || []) {
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
            console.error('getStudents Error:', err.message);
            return { success: false, message: err.message, students: [] };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // GET PAYMENTS
    // Returns every row as a payment record.
    // ═══════════════════════════════════════════════════════════
    getPayments: async () => {
        try {
            const result = await get({ action: 'getAll' });
            if (!result.success) throw new Error(result.error);

            const payments = (result.data || [])
                .filter(row => row.month !== '' && row.year !== '')
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
    // CREATE STUDENT
    // Inserts one row for the current month.
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

            console.log('[createStudent] Inserting row:', row);
            const result = await post({ action: 'insert' }, { row });
            if (!result.success) throw new Error(result.error);
            return { success: true, student: { ...row, id } };
        } catch (err) {
            console.error('createStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UPDATE STUDENT PROFILE
    // Updates profile columns across all rows for this student.
    // ═══════════════════════════════════════════════════════════
    updateProfile: async (id, updates) => {
        try {
            const fmt = { ...updates };
            if (typeof fmt.is_free === 'boolean') fmt.is_free = fmt.is_free ? 'TRUE' : 'FALSE';
            if (typeof fmt.current_month_paid === 'boolean') fmt.current_month_paid = fmt.current_month_paid ? 'TRUE' : 'FALSE';
            // Remove payment-row-specific fields from profile updates
            delete fmt.month; delete fmt.year; delete fmt.status;
            delete fmt.amount; delete fmt.row_key;

            const result = await post({ action: 'update', col: 'id', val: String(id) }, { updates: fmt });
            if (!result.success) throw new Error(result.error);
            return { success: true };
        } catch (err) {
            console.error('updateProfile Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // DELETE STUDENT
    // Removes all rows for this student id.
    // ═══════════════════════════════════════════════════════════
    deleteStudent: async (_token, id) => {
        try {
            const result = await post({ action: 'delete', col: 'id', val: String(id) }, {});
            if (!result.success) throw new Error(result.error);
            return { success: true };
        } catch (err) {
            console.error('deleteStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RECORD PAYMENT
    // Upserts the payment status for a student + month + year.
    //   - Row exists (by row_key) → update status/amount
    //   - Row missing              → insert new row for that month
    // ═══════════════════════════════════════════════════════════
    recordPayment: async (studentId, month, year, amount, isPaid) => {
        const rk = rowKey(studentId, month, year);
        const isFree = parseFloat(amount) === 0;
        const status = isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid');
        const paymentDate = isPaid ? new Date().toISOString() : '';

        console.log(`[recordPayment] rk:${rk} status:${status}`);

        try {
            // Check if row already exists for this student-month-year
            const searchResult = await get({ action: 'search', col: 'row_key', val: rk });
            const existing = searchResult.success ? (searchResult.data || []) : [];

            if (existing.length > 0) {
                // ── UPDATE existing row ──────────────────────────────
                const result = await post(
                    { action: 'update', col: 'row_key', val: rk },
                    { updates: { amount: String(amount), status, current_month_paid: isPaid ? 'TRUE' : 'FALSE', payment_date: paymentDate } }
                );
                if (!result.success) throw new Error(result.error);
                console.log(`[recordPayment] UPDATED row_key:${rk}`);
            } else {
                // ── INSERT new row for this month ────────────────────
                const profileResult = await get({ action: 'search', col: 'id', val: String(studentId) });
                const profile = (profileResult.data || [])[0] || {};

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
                    month: String(month),
                    year: String(year),
                    amount: String(amount),
                    status,
                    payment_date: paymentDate,
                    created_at: profile.created_at || ''
                };
                const result = await post({ action: 'insert' }, { row: newRow });
                if (!result.success) throw new Error(result.error);
                console.log(`[recordPayment] INSERTED row_key:${rk}`);
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
    syncPaymentRecords: async () => ({ success: true }), // no longer needed
};

export default sheetDbApi;
