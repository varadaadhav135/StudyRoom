import axios from 'axios';

// Get API URL from env or use a placeholder that the user needs to update
const SHEETDB_API_URL = import.meta.env.VITE_SHEETDB_API_URL || 'https://sheetdb.io/api/v1/tjpqhngurtnvq';

export const sheetDbApi = {
    // ========================================================================
    // STUDENT MANAGEMENT
    // ========================================================================

    getStudents: async () => {
        try {
            const response = await axios.get(SHEETDB_API_URL);
            // SheetDB returns an array of objects
            // We need to map them to match the expected structure
            // Supabase returns { success: true, students: [...] }
            // And each student has subscriptions array for the dashboard to display dates

            const students = response.data.map((row, index) => {
                // Synthesize subscription object from flat sheet data
                const subscription = {
                    start_date: row.subscription_start,
                    end_date: row.subscription_end,
                    amount: row.monthly_fee,
                    status: row.current_month_paid === 'TRUE' || row.current_month_paid === true ? 'active' : 'pending'
                };

                return {
                    id: row.id,
                    username: row.username,
                    email: row.email,
                    mobile: row.mobile,
                    aadhar_number: row.aadhar_number,
                    monthly_fee: row.monthly_fee,
                    current_month_paid: row.current_month_paid === 'TRUE' || row.current_month_paid === true,
                    subscriptions: [subscription] // Mock array to match Supabase structure
                };
            });

            return { success: true, students };
        } catch (error) {
            console.error('SheetDB Fetch Error:', error);
            return { success: false, message: error.message, students: [] };
        }
    },

    createStudent: async (token, studentData) => {
        try {
            // Generate a random ID if not provided (SheetDB doesn't auto-increment like SQL)
            const id = studentData.id || `STU-${Math.floor(Math.random() * 10000)}`;

            const newStudent = {
                id,
                username: studentData.username,
                email: studentData.email,
                mobile: studentData.mobile,
                aadhar_number: studentData.aadhar_number,
                monthly_fee: studentData.monthly_fee,
                subscription_start: studentData.subscription_start,
                subscription_end: studentData.subscription_end,
                current_month_paid: studentData.current_month_paid ? 'TRUE' : 'FALSE'
            };

            await axios.post(SHEETDB_API_URL, newStudent);

            return { success: true, message: 'Student created successfully', student: newStudent };
        } catch (error) {
            console.error('SheetDB Create Error:', error);
            if (error.response) {
                console.error('Error Response Data:', error.response.data);
                console.error('Error Status:', error.response.status);
            }
            return { success: false, message: error.response?.data?.error || error.message };
        }
    },

    deleteStudent: async (token, id) => {
        try {
            // SheetDB delete syntax: API_URL/id/{id}
            await axios.delete(`${SHEETDB_API_URL}/id/${id}`);
            return { success: true, message: 'Student deleted successfully' };
        } catch (error) {
            console.error('SheetDB Delete Error:', error);
            return { success: false, message: error.message };
        }
    },

    updateProfile: async (id, updates) => {
        try {
            // Convert boolean to string for SheetDB if needed
            const formattedUpdates = { ...updates };
            if (typeof updates.current_month_paid === 'boolean') {
                formattedUpdates.current_month_paid = updates.current_month_paid ? 'TRUE' : 'FALSE';
            }

            // SheetDB update syntax: API_URL/id/{id}
            await axios.patch(`${SHEETDB_API_URL}/id/${id}`, formattedUpdates);
            return { success: true, message: 'Profile updated successfully' };
        } catch (error) {
            console.error('SheetDB Update Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ========================================================================
    // RESOURCE MANAGEMENT (New Tabs)
    // ========================================================================

    getResources: async () => {
        try {
            const response = await axios.get(`${SHEETDB_API_URL}?sheet=Resources`);
            return { success: true, resources: response.data };
        } catch (error) {
            console.error('SheetDB Get Resources Error:', error);
            // Return empty array if sheet/tab doesn't exist yet to prevent crash
            return { success: true, resources: [] };
        }
    },

    createResource: async (token, resourceData) => {
        try {
            const id = resourceData.id || `RES-${Math.floor(Math.random() * 10000)}`;
            const newResource = {
                id,
                ...resourceData,
                uploaded_by: 'Admin',
                created_at: new Date().toISOString()
            };

            await axios.post(`${SHEETDB_API_URL}?sheet=Resources`, newResource);
            return { success: true, message: 'Resource created', resource: newResource };
        } catch (error) {
            console.error('SheetDB Create Resource Error:', error);
            return { success: false, message: error.message };
        }
    },

    deleteResource: async (token, id) => {
        try {
            // Delete from Resources tab
            await axios.delete(`${SHEETDB_API_URL}/id/${id}?sheet=Resources`);
            return { success: true, message: 'Resource deleted' };
        } catch (error) {
            console.error('SheetDB Delete Resource Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ========================================================================
    // STUDENT PROGRESS (New Tabs)
    // ========================================================================

    getProgress: async () => {
        try {
            const response = await axios.get(`${SHEETDB_API_URL}?sheet=Progress`);
            return { success: true, progress: response.data };
        } catch (error) {
            console.error('SheetDB Get Progress Error:', error);
            return { success: true, progress: [] };
        }
    },

    updateProgress: async (token, resourceId, status) => {
        try {
            // We need the student ID. In a real app, we extract it from token or context.
            // For now, let's assume we are tracking it by a simple search or passing it.
            // Since this function signature in StudentDashboard is (null, resourceId, status),
            // and we lack the student ID in args, we might need to rely on localStorage user or similar.
            // However, `sheetDbApi` is stateless.
            // Let's check `localApi` behavior: it used `loadData` which had all data.
            // Here, we need to know WHO IS LOGGED IN.
            // Ideally, we pass studentId.
            // For now, let's mock it or fetch current user if possible, but simplest is to ask user to pass it.
            // But we can't change the call site easily without refactoring Dashboard.
            // Wait, StudentDashboard.jsx line 77: `api.updateProgress(null, resourceId, status)`
            // It assumes the API knows the user (like via token or session).
            // `localApi` was using localStorage session.

            // Allow obtaining student ID from localStorage for now as a bridge
            const storedUser = localStorage.getItem('user') || localStorage.getItem('imperial_library_session');
            let studentId = 'unknown';
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    // Adapt to different storage shapes
                    studentId = parsed.id || parsed.user?.id || 'unknown';
                } catch (e) { }
            }

            // 1. Check if progress entry exists
            const searchUrl = `${SHEETDB_API_URL}/search?student_id=${studentId}&resource_id=${resourceId}&sheet=Progress`;
            const searchRes = await axios.get(searchUrl);

            if (searchRes.data && searchRes.data.length > 0) {
                // 2a. Update existing
                // We need the ID of the progress row, not resource ID
                const progressRowId = searchRes.data[0].id;
                await axios.patch(`${SHEETDB_API_URL}/id/${progressRowId}?sheet=Progress`, {
                    status,
                    updated_at: new Date().toISOString()
                });
            } else {
                // 2b. Create new
                const newProgress = {
                    id: `PROG-${Math.floor(Math.random() * 100000)}`,
                    student_id: studentId,
                    resource_id: resourceId,
                    status,
                    updated_at: new Date().toISOString()
                };
                await axios.post(`${SHEETDB_API_URL}?sheet=Progress`, newProgress);
            }

            return { success: true, message: 'Progress updated' };
        } catch (error) {
            console.error('SheetDB Progress Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ========================================================================
    // PAYMENT HISTORY (New "Payments" Tab)
    // ========================================================================

    getPayments: async () => {
        try {
            const response = await axios.get(`${SHEETDB_API_URL}?sheet=Payments`);
            return { success: true, payments: response.data };
        } catch (error) {
            console.error('SheetDB Get Payments Error:', error);
            return { success: true, payments: [] };
        }
    },

    recordPayment: async (studentId, month, year, amount, status) => {
        try {
            // 1. Check if payment exists for this month/year
            const monthStr = String(month);
            const yearStr = String(year);
            const searchUrl = `${SHEETDB_API_URL}/search?student_id=${studentId}&month=${monthStr}&year=${yearStr}&sheet=Payments`;
            const searchRes = await axios.get(searchUrl);

            if (searchRes.data && searchRes.data.length > 0) {
                // Update existing
                const paymentId = searchRes.data[0].id;
                await axios.patch(`${SHEETDB_API_URL}/id/${paymentId}?sheet=Payments`, {
                    amount,
                    status: status ? 'Paid' : 'Unpaid',
                    payment_date: new Date().toISOString()
                });
            } else {
                // Create new
                const newPayment = {
                    id: `PAY-${Math.floor(Math.random() * 100000)}`,
                    student_id: studentId,
                    month: monthStr,
                    year: yearStr,
                    amount,
                    status: status ? 'Paid' : 'Unpaid',
                    payment_date: new Date().toISOString()
                };
                await axios.post(`${SHEETDB_API_URL}?sheet=Payments`, newPayment);
            }
            return { success: true, message: 'Payment recorded' };
        } catch (error) {
            console.error('SheetDB Payment Error:', error);
            return { success: false, message: error.message };
        }
    },

    // ========================================================================
    // AUTHENTICATION (Mocked/Not used for Admin)
    // ========================================================================
    login: async (email, password) => {
        // Admin login is handled by AuthContext using .env
        // This would be for student login if we re-enabled it
        return { success: false, message: 'Student login disabled' };
    },

    logout: async () => {
        return { success: true };
    }
};

export default sheetDbApi;
