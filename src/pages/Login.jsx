import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated, isAdmin, isStudent } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated()) {
            if (isAdmin()) {
                navigate('/admin');
            } else if (isStudent()) {
                navigate('/student');
            }
        }
    }, [isAuthenticated, isAdmin, isStudent, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.email || !formData.password) {
            toast.error('Please enter both email and password');
            return;
        }

        setLoading(true);

        try {
            const { success, error } = await login(formData.email, formData.password);

            if (success) {
                toast.success('Login successful!');
                // Navigation will be handled by the useEffect above or we can force it here
                // slightly delayed to let state update
            } else {
                toast.error(error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-100 relative overflow-x-hidden">
            {/* Navigation (Aligned with Landing Page Header) */}
            <nav className="fixed top-0 w-full z-50 px-8 py-5 flex justify-between items-center bg-white/60 backdrop-blur-xl border-b border-white/20">
                <div onClick={() => navigate('/')} className="flex items-center gap-4 transition-transform hover:scale-105 cursor-pointer">
                    <div className="w-14 h-14 bg-slate-900 border-2 border-amber-400 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl ring-4 ring-amber-400/10">
                        🏛️
                    </div>
                    <div className="flex flex-col">
                        <span className="text-3xl font-black tracking-tighter text-slate-900 font-display leading-tight">
                            Dnyan<span className="text-amber-500">Peeth</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 uppercase tracking-[0.3em]">Imperial Library</span>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="btn-premium bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                    Return Home
                </button>
            </nav>

            <div className="flex-1 flex items-center justify-center px-4 pt-44 pb-20 relative">
                {/* Background Accents (Aligned with Hero) */}
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[120px]"></div>

                <div className="relative w-full max-w-md animate-fade-in-up">

                    <div className="glass-premium p-12 rounded-[3.5rem] border border-white shadow-gold-premium relative bg-white/80">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-900 border-4 border-white rounded-[2rem] flex items-center justify-center shadow-2xl transition-transform hover:scale-110">
                            <span className="text-4xl">🏛️</span>
                        </div>

                        <div className="text-center mt-12 mb-12">
                            <h1 className="text-4xl font-black text-slate-900 font-display tracking-tightest mb-3 uppercase">
                                Archive <span className="text-gold-royal">Access</span>
                            </h1>
                            <p className="text-slate-400 text-[10px] font-black tracking-[0.5em] uppercase">
                                Identify yourself to the librarian
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                                    Scholarly Email
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="input-premium bg-slate-50"
                                    placeholder="name@academy.edu"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">
                                    Secret Key
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input-premium bg-slate-50"
                                    placeholder="••••••••"
                                    disabled={loading}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-premium btn-gold py-5 text-xs font-black uppercase tracking-[0.3em] group shadow-gold-premium mt-4"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                        <span>Verifying Credentials...</span>
                                    </div>
                                ) : (
                                    <span className="flex items-center justify-center gap-3">
                                        Grant Academic Access
                                        <span className="group-hover:translate-x-2 transition-transform text-lg">→</span>
                                    </span>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-10 border-t border-slate-100 text-center">
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.5em]">
                                Imperial Society Of Education
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;