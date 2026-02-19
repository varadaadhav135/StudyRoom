import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Apps Script Web App API
//
// Set VITE_APPS_SCRIPT_URL in your .env:
//   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
//
// Sheet: "Student" — exact columns (no extras):
//   id | username | email | mobile | aadhar_number | monthly_fee |
//   subscription_start | subscription_end | current_month_paid |
//   month | year | amount | status
//
// One row = one student for one month.
// Unique row = id + month + year  (no row_key column needed)
//
// ⚠️  Apps Script POST redirects drop the body.
//     All data is encoded in the URL as ?payload=JSON so GET works for everything.
// ─────────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

if (!API_URL) {
    console.warn('[API] VITE_APPS_SCRIPT_URL is not set in .env');
}

// ─── Low-level caller ────────────────────────────────────────────────────────
// Everything is sent as a GET request with action + payload in the URL.
// No POST needed — avoids the Apps Script redirect/body-drop issue.
const call = async (action, payload = {}) => {
    const qs = new URLSearchParams({
        action,
        payload: JSON.stringify(payload)
    }).toString();
    const res = await axios.get(`${API_URL}?${qs}`);
    if (!res.data?.success) throw new Error(res.data?.error || `Action "${action}" failed`);
    return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────

export const sheetDbApi = {

    // ═══════════════════════════════════════════════════════════
    // GET STUDENTS
    // All rows → deduplicated by `id` → one student object each.
    // ═══════════════════════════════════════════════════════════
    getStudents: async () => {
        try {
            const result = await call('getAll');
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
    // Every row becomes a payment record.
    // ═══════════════════════════════════════════════════════════
    getPayments: async () => {
        try {
            const result = await call('getAll');
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
    // Inserts one row for the current month.
    // ═══════════════════════════════════════════════════════════
    createStudent: async (_token, data) => {
        try {
            const id = data.id || `STU-${Date.now()}`;
            const now = new Date();
            const month = String(now.getMonth());
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
            await call('insert', { row });
            return { success: true, student: { ...row } };
        } catch (err) {
            console.error('createStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UPDATE STUDENT PROFILE
    // Updates all rows for a given id (profile fields only).
    // ═══════════════════════════════════════════════════════════
    updateProfile: async (id, updates) => {
        try {
            const fmt = { ...updates };
            if (typeof fmt.is_free === 'boolean') fmt.is_free = fmt.is_free ? 'TRUE' : 'FALSE';
            if (typeof fmt.current_month_paid === 'boolean') fmt.current_month_paid = fmt.current_month_paid ? 'TRUE' : 'FALSE';
            // Do NOT overwrite payment columns via profile update
            delete fmt.month; delete fmt.year; delete fmt.status; delete fmt.amount;

            await call('update', { col: 'id', val: String(id), updates: fmt });
            return { success: true };
        } catch (err) {
            console.error('updateProfile Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // DELETE STUDENT — removes all rows for this id
    // ═══════════════════════════════════════════════════════════
    deleteStudent: async (_token, id) => {
        try {
            await call('deleteMulti', { id: String(id) });
            return { success: true };
        } catch (err) {
            console.error('deleteStudent Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RECORD PAYMENT
    // Upserts payment status for a student + month + year.
    //   - Row exists (id + month + year match) → updateMulti
    //   - Row missing → insert new row fetching profile from sheet
    // ═══════════════════════════════════════════════════════════
    recordPayment: async (studentId, month, year, amount, isPaid) => {
        const isFree = parseFloat(amount) === 0;
        const status = isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid');
        const monthStr = String(month);
        const yearStr = String(year);

        console.log(`[recordPayment] id:${studentId} ${monthStr}/${yearStr} → ${status}`);

        try {
            // 1. Check if a row already exists for this student-month-year
            const searchResult = await call('searchMulti', {
                id: String(studentId), month: monthStr, year: yearStr
            });
            const existing = searchResult.data || [];

            if (existing.length > 0) {
                // ── UPDATE ───────────────────────────────────────────
                await call('updateMulti', {
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
                // ── INSERT ───────────────────────────────────────────
                const profileResult = await call('search', { col: 'id', val: String(studentId) });
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
                await call('insert', { row: newRow });
                console.log('[recordPayment] Inserted new row for', monthStr, yearStr);
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
    syncPaymentRecords: async () => ({ success: true })  // no-op
};

export default sheetDbApi;
