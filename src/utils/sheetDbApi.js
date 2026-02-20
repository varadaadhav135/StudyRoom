import axios from 'axios';

// ─────────────────────────────────────────────────────────────
// Custom Node.js API (Vercel Serverless Functions)
// 
// Endpoints:
//   GET  /api/get-students
//   POST /api/add-student
//   PUT  /api/update-student
//   DELETE /api/delete-student
//   POST /api/record-payment
// ─────────────────────────────────────────────────────────────

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
if (isLocal) {
    console.log('[API] Running locally. Ensure `npm run dev` uses `vercel dev`.');
}

export const sheetDbApi = {

    // ═══════════════════════════════════════════════════════════
    // GET STUDENTS
    // ═══════════════════════════════════════════════════════════
    getStudents: async () => {
        try {
            const res = await axios.get('/api/get-students');
            const rows = res.data.data || [];

            // Deduplicate by ID to show unique students list
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
    // ═══════════════════════════════════════════════════════════
    getPayments: async () => {
        try {
            const res = await axios.get('/api/get-students'); // Re-use get-students as it returns all rows
            const rows = res.data.data || [];

            const payments = rows
                .filter(row => row.month && row.year)
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
            return { success: true, payments: [] };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // CREATE STUDENT
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

            await axios.post('/api/add-student', { row });
            return { success: true, student: { ...row } };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // UPDATE PROFILE
    // ═══════════════════════════════════════════════════════════
    updateProfile: async (id, updates) => {
        try {
            const fmt = { ...updates };
            if (typeof fmt.is_free === 'boolean') fmt.is_free = fmt.is_free ? 'TRUE' : 'FALSE';
            if (typeof fmt.current_month_paid === 'boolean') fmt.current_month_paid = fmt.current_month_paid ? 'TRUE' : 'FALSE';

            delete fmt.month; delete fmt.year; delete fmt.status; delete fmt.amount;

            await axios.put('/api/update-student', { id: String(id), updates: fmt });
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // DELETE STUDENT
    // ═══════════════════════════════════════════════════════════
    deleteStudent: async (_token, id) => {
        try {
            // axios.delete supports body via 'data' config
            await axios.delete('/api/delete-student', { data: { id: String(id) } });
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // RECORD PAYMENT
    // ═══════════════════════════════════════════════════════════
    recordPayment: async (studentId, month, year, amount, isPaid) => {
        try {
            const isFree = parseFloat(amount) === 0;
            const status = isFree ? 'Free' : (isPaid ? 'Paid' : 'Unpaid');

            await axios.post('/api/record-payment', {
                studentId: String(studentId),
                month: String(month),
                year: String(year),
                amount: String(amount),
                status,
                current_month_paid: isPaid ? 'TRUE' : 'FALSE'
            });
            return { success: true };
        } catch (err) {
            console.error('[recordPayment] Error:', err.message);
            return { success: false, message: err.message };
        }
    },

    // ═══════════════════════════════════════════════════════════
    // STUBS
    // ═══════════════════════════════════════════════════════════
    login: async () => ({ success: false, message: 'Student login disabled' }),
    logout: async () => ({ success: true }),
    getResources: async () => ({ success: true, resources: [] }),
    createResource: async () => ({ success: false, message: 'Not implemented' }),
    deleteResource: async () => ({ success: false, message: 'Not implemented' }),
    getProgress: async () => ({ success: true, progress: [] }),
    updateProgress: async () => ({ success: false, message: 'Not implemented' }),
    syncPaymentRecords: async () => ({ success: true })
};

export default sheetDbApi;
