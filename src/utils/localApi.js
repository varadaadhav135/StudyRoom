/**
 * Local JSON Storage Adapter
 * Replaces Supabase with a browser-based local storage system.
 *
 * Data Structure:
 * {
 *   users: [{ id, email, password, role, username, created_at }],
 *   resources: [{ id, title, description, url, category, uploaded_by, created_at }],
 *   subscriptions: [{ id, student_id, start_date, end_date, amount, status, currency }],
 *   payments: [{ id, student_id, amount, payment_date, method }],
 *   student_progress: [{ id, student_id, resource_id, status, notes, updated_at }]
 * }
 */

const STORAGE_KEY = 'imperial_library_data';
const SESSION_KEY = 'imperial_library_session';

// Helper to generate UUIDs
const uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Initial Seed Data
const INITIAL_DATA = {
    users: [
        {
            id: 'admin-user-id',
            email: 'admin@dynanpeeth.com',
            password: 'admin', // In a real app, hash this!
            role: 'Admin',
            username: 'Librarian Supreme',
            created_at: new Date().toISOString()
        }
    ],
    resources: [
        {
            id: uuidv4(),
            title: 'Foundations of Alchemy',
            description: 'Introduction to the basic principles of transmutation.',
            url: 'https://example.com/alchemy-101',
            category: 'Alchemy',
            uploaded_by: 'Admin',
            created_at: new Date().toISOString()
        },
        {
            id: uuidv4(),
            title: 'Advanced Star Charting',
            description: 'Mapping the celestial bodies for navigation and prophecy.',
            url: 'https://example.com/star-charting',
            category: 'Astronomy',
            uploaded_by: 'Admin',
            created_at: new Date().toISOString()
        }
    ],
    subscriptions: [],
    payments: [],
    student_progress: []
};

// --- DATA ACCESS HELPERS ---

const loadData = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        return INITIAL_DATA;
    }
    return JSON.parse(data);
};

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- API IMPLEMENTATION ---

export const localApi = {
    // ========================================================================
    // AUTHENTICATION
    // ========================================================================

    login: async (email, password) => {
        const data = loadData();
        const user = data.users.find(u => u.email === email && u.password === password);

        if (user) {
            const session = {
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role
                },
                access_token: 'dummy-local-token-' + Date.now()
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return { success: true, data: { user: session.user, session } };
        }
        return { success: false, error: 'Invalid credentials' };
    },

    signup: async (email, password, username, role = 'Student') => {
        const data = loadData();
        if (data.users.find(u => u.email === email)) {
            return { success: false, error: 'User already exists' };
        }

        const newUser = {
            id: uuidv4(),
            email,
            password,
            username,
            role,
            created_at: new Date().toISOString()
        };

        data.users.push(newUser);

        // Auto-create subscription for students
        if (role === 'Student') {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);

            data.subscriptions.push({
                id: uuidv4(),
                student_id: newUser.id,
                start_date: new Date().toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                amount: 0,
                status: 'active',
                currency: 'INR'
            });
        }

        saveData(data);

        // Auto-login after signup
        const session = {
            user: { id: newUser.id, email: newUser.email, role: newUser.role },
            access_token: 'dummy-local-token-' + Date.now()
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));

        return { success: true, data: { user: session.user, session } };
    },

    logout: async () => {
        localStorage.removeItem(SESSION_KEY);
        return { success: true };
    },

    getSession: async () => {
        const session = localStorage.getItem(SESSION_KEY);
        return { data: { session: session ? JSON.parse(session) : null } };
    },

    getUser: async () => {
        const sessionStr = localStorage.getItem(SESSION_KEY);
        if (!sessionStr) return { data: { user: null } };
        const session = JSON.parse(sessionStr);
        return { data: { user: session.user } };
    },

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================

    getProfile: async (userId) => {
        const data = loadData();
        const user = data.users.find(u => u.id === userId);
        if (user) {
            return { success: true, profile: user };
        }
        return { success: false, message: 'User not found' };
    },

    updateProfile: async (userId, profileData) => {
        const data = loadData();
        const userIndex = data.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...profileData };
            saveData(data);
            return { success: true, message: 'Profile updated' };
        }
        return { success: false, message: 'User not found' };
    },

    // ========================================================================
    // STUDENT MANAGEMENT
    // ========================================================================

    getStudents: async (token) => {
        const data = loadData();
        const students = data.users
            .filter(u => u.role === 'Student')
            .map(u => {
                const sub = data.subscriptions.find(s => s.student_id === u.id);
                return {
                    ...u,
                    subscriptions: sub ? [sub] : []
                };
            })
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return { success: true, students };
    },

    createStudent: async (token, studentData) => {
        // Reuse signup logic but don't log them in
        const { username, email, password } = studentData;
        const data = loadData();

        if (data.users.find(u => u.email === email)) {
            return { success: false, message: 'Email already exists' };
        }

        const newUser = {
            id: uuidv4(),
            email,
            password,
            username,
            role: 'Student',
            created_at: new Date().toISOString()
        };

        data.users.push(newUser);

        // Subscription
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        data.subscriptions.push({
            id: uuidv4(),
            student_id: newUser.id,
            start_date: new Date().toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            amount: 0,
            status: 'active',
            currency: 'INR'
        });

        saveData(data);
        return {
            success: true,
            message: 'Student created successfully',
            credentials: { email, password },
            student: newUser
        };
    },

    deleteStudent: async (token, userId) => {
        const data = loadData();
        data.users = data.users.filter(u => u.id !== userId);
        data.subscriptions = data.subscriptions.filter(s => s.student_id !== userId);
        data.payments = data.payments.filter(p => p.student_id !== userId);
        data.student_progress = data.student_progress.filter(p => p.student_id !== userId);
        saveData(data);
        return { success: true, message: 'Student deleted' };
    },

    // ========================================================================
    // RESOURCE MANAGEMENT
    // ========================================================================

    getResources: async (token) => {
        const data = loadData();
        return { success: true, resources: data.resources };
    },

    createResource: async (token, resourceData) => {
        const data = loadData();
        const newResource = {
            id: uuidv4(),
            ...resourceData,
            uploaded_by: 'Admin', // Simplified
            created_at: new Date().toISOString()
        };
        data.resources.unshift(newResource);
        saveData(data);
        return { success: true, message: 'Resource created' };
    },

    deleteResource: async (token, resourceId) => {
        const data = loadData();
        data.resources = data.resources.filter(r => r.id !== resourceId);
        data.student_progress = data.student_progress.filter(p => p.resource_id !== resourceId); // Clean up progress
        saveData(data);
        return { success: true, message: 'Resource deleted' };
    },

    // ========================================================================
    // SUBSCRIPTION & PAYMENTS
    // ========================================================================

    updateSubscription: async (token, studentId, subData) => {
        const data = loadData();
        const subIndex = data.subscriptions.findIndex(s => s.student_id === studentId);

        const status = new Date(subData.end_date) > new Date() ? 'active' : 'expired';

        if (subIndex !== -1) {
            data.subscriptions[subIndex] = {
                ...data.subscriptions[subIndex],
                ...subData,
                status // Update status based on dates
            };
        } else {
            data.subscriptions.push({
                id: uuidv4(),
                student_id: studentId,
                ...subData,
                status
            });
        }
        saveData(data);
        return { success: true, message: 'Subscription updated' };
    },

    getRevenue: async (token) => {
        const data = loadData();
        // Calculate based on payments array when we have payments
        // For now using subscriptions amount if needed, but schema uses payments table
        // Let's assume we populate payments when subscription is updated with amount > 0
        const total = data.payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const activeSubs = data.subscriptions.filter(s => s.status === 'active').length;

        return {
            success: true,
            revenue: {
                total,
                activeSubscriptions: activeSubs,
                paymentsCount: data.payments.length
            }
        };
    }
};
