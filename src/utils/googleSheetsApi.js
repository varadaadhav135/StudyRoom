/**
 * Google Sheets API Adapter
 * Connects to Google Apps Script Web App for data persistence.
 */

// ------------------------------------------------------------------
// 🔴 REPLACE THIS WITH YOUR GOOGLE APPS SCRIPT WEB APP URL
// ------------------------------------------------------------------
const GOOGLE_SCRIPT_URL = 'INSERT_YOUR_WEB_APP_URL_HERE';
// Example: 'https://script.google.com/macros/s/AKfycbx.../exec'
// ------------------------------------------------------------------

const callScript = async (action, payload = {}, id = null) => {
    if (GOOGLE_SCRIPT_URL.includes('INSERT_YOUR')) {
        console.error('⚠️ Google Script URL not set in googleSheetsApi.js');
        return { success: false, message: 'API URL not configured' };
    }

    try {
        // GET requests for fetching data
        if (action.startsWith('get')) {
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=${action}`);
            const data = await response.json();
            return data;
        }

        // POST requests for modifying data
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // 'no-cors' is often needed for GAS, but it limits response reading.
            // Standard Fetch with CORS enabled in GAS is preferred if "Anyone" access is set.
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, payload, id })
        });

        // Note: With 'no-cors', we can't read the response. 
        // We assume success if no network error occurred.
        // For 'cors' mode (if configured in GAS), we can return response.json().

        // Try parsing JSON if headers allow, otherwise return blind success
        try {
            return await response.json();
        } catch (e) {
            return { success: true, message: 'Request sent (blind execution)' };
        }

    } catch (error) {
        console.error('Google Sheet API Error:', error);
        return { success: false, error: error.message };
    }
};

export const googleSheetsApi = {
    // ========================================================================
    // AUTHENTICATION (Simulated)
    // ========================================================================

    login: async (email, password) => {
        // Apps Script doesn't handle secure auth easily. 
        // We fetching users to verify locally or trusting a server check.
        // For simplicity, we'll fetch the users list and check.
        const res = await callScript('getUsers'); // You need to implement 'getUsers' in GAS if not present
        if (res.users) {
            const user = res.users.find(u => u.email === email && u.password === password);
            if (user) {
                return {
                    success: true,
                    data: {
                        user,
                        session: { user, access_token: 'gs-token' }
                    }
                };
            }
        }
        return { success: false, error: 'Invalid credentials' };
    },

    signup: async (email, password, username, role = 'Student') => {
        // NOT IMPLEMENTED in the simplified GAS script yet. 
        // You would need to add 'createUser' action in GAS.
        return { success: false, error: 'Signup not supported in Sheets yet' };
    },

    logout: async () => {
        return { success: true };
    },

    getSession: async () => {
        // No real session persistence in this simple adapter
        return { data: { session: null } };
    },

    getUser: async () => {
        return { data: { user: null } };
    },

    getProfile: async (userId) => {
        // Not optimal to fetch all, but GAS limitations apply
        return { success: true, profile: { id: userId, role: 'Admin' } }; // Mock for now
    },

    updateProfile: async (userId, updates) => {
        return { success: true };
    },

    // ========================================================================
    // STUDENT MANAGEMENT
    // ========================================================================

    getStudents: async () => {
        return await callScript('getStudents');
    },

    createStudent: async (token, studentData) => {
        return await callScript('createStudent', studentData);
    },

    deleteStudent: async (token, id) => {
        return await callScript('deleteStudent', {}, id);
    },

    // ========================================================================
    // RESOURCE MANAGEMENT
    // ========================================================================

    getResources: async () => {
        return await callScript('getResources');
    },

    createResource: async (token, resourceData) => {
        return await callScript('createResource', resourceData);
    },

    deleteResource: async (token, id) => {
        // Implement 'deleteResource' in GAS
        return { success: true };
    },

    // ========================================================================
    // SUBSCRIPTION & PAYMENTS
    // ========================================================================

    updateSubscription: async (token, studentId, subData) => {
        // Implement 'updateSubscription' in GAS
        return { success: true };
    },

    getRevenue: async () => {
        return { success: true, revenue: { total: 0, activeSubscriptions: 0 } };
    }
};
