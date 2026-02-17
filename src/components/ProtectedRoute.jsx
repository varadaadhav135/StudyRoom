import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, studentOnly = false }) => {
    const { isAuthenticated, isAdmin, isStudent, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center gradient-calm">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    if (adminOnly && !isAdmin()) {
        return <Navigate to="/student" replace />;
    }

    if (studentOnly && !isStudent()) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;
