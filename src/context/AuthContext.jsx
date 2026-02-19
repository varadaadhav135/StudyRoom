import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    // Predefined admin credentials
    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'admin@dynanpeth.com';
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    // 90 days in ms — safety cap for forgotten sessions
    const SESSION_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

    useEffect(() => {
        // Check for existing session in localStorage
        const storedSession = localStorage.getItem('admin_session');
        const storedUser = localStorage.getItem('admin_user');

        if (storedSession && storedUser) {
            try {
                const parsedSession = JSON.parse(storedSession);
                const parsedUser = JSON.parse(storedUser);

                // Safety cap: clear sessions older than 90 days
                const sessionAge = Date.now() - (parsedSession.created_at || 0);
                if (sessionAge > SESSION_MAX_AGE_MS) {
                    localStorage.removeItem('admin_session');
                    localStorage.removeItem('admin_user');
                } else {
                    // (e) No expiry — session persists until manual logout
                    setSession(parsedSession);
                    setUser(parsedUser);
                    setProfile({ role: 'Admin', username: 'Administrator', email: parsedUser.email });
                }
            } catch (error) {
                console.error('Error parsing stored session:', error);
                localStorage.removeItem('admin_session');
                localStorage.removeItem('admin_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            // Validate admin credentials
            if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                const adminUser = {
                    id: 'admin-001',
                    email: ADMIN_EMAIL,
                    role: 'Admin'
                };

                const adminSession = {
                    user: adminUser,
                    access_token: 'admin-token',
                    created_at: Date.now() // (e) Track age for 90-day cap, no hard expiry
                };

                // Store in localStorage — persists until manual logout
                localStorage.setItem('admin_session', JSON.stringify(adminSession));
                localStorage.setItem('admin_user', JSON.stringify(adminUser));

                setSession(adminSession);
                setUser(adminUser);
                setProfile({ role: 'Admin', username: 'Administrator', email: ADMIN_EMAIL });

                return { success: true, data: { user: adminUser, session: adminSession } };
            }

            return { success: false, error: 'Invalid admin credentials' };
        } catch (error) {
            console.error('Login error:', error.message);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            localStorage.removeItem('admin_session');
            localStorage.removeItem('admin_user');
            setSession(null);
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error('Logout error:', error.message);
        }
    };

    const isAuthenticated = () => {
        return !!session && !!user;
    };

    const isAdmin = () => {
        return profile?.role === 'Admin' || user?.role === 'Admin';
    };

    const value = {
        user,
        profile,
        session,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        loading
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;