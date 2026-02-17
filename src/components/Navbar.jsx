import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const Navbar = ({ darkMode, toggleDarkMode }) => {
    const { user, logout, isAdmin } = useAuth();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <nav className="sticky top-0 z-[100] glass-premium border-b border-white/10 dark:border-white/5 transition-all duration-500">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex justify-between items-center h-20 md:h-24">
                    {/* Logo Section */}
                    <Link to={isAdmin() ? '/admin' : '/student'} className="flex items-center gap-2 md:gap-4">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-slate-900 border-2 border-amber-400 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-lg md:text-2xl shadow-xl transition-all">
                            🏛️
                        </div>
                        <div className="flex flex-col">
                            <span className="text-3xl font-black tracking-tighter text-slate-900 font-display leading-tight"> Dnyan<span className="text-amber-500">Peeth</span> </span>

                            <span className="text-[8px] md:text-[10px] font-bold text-amber-600 uppercase tracking-[0.3em] leading-none">
                                Imperial Library
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Actions */}
                    <div className="flex items-center gap-3 md:gap-8">
                        {/* Status for Admin/Student */}
                        <div className="hidden xs:flex items-center gap-3 px-3 md:px-4 py-2 bg-slate-100/50 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/10">
                            <span className="relative flex h-2 w-2">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAdmin() ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full h-2 w-2 ${isAdmin() ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                            </span>
                            <span className="text-[8px] md:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[80px] md:max-w-none">
                                {isAdmin() ? 'Mangesh Khedekar' : 'Scholar'}
                            </span>
                        </div>

                        <div className="hidden md:block h-10 w-[1px] bg-slate-200 dark:bg-white/10"></div>

                        <div className="flex items-center gap-5">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-black text-slate-900 dark:text-white mb-0.5 tracking-tight">
                                    {user?.username || 'Legacy User'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest opacity-70">
                                    {user?.email}
                                </span>
                            </div>

                            <div className="relative group">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-emerald-400 to-amber-600 p-[2px] cursor-pointer shadow-xl transition-all hover:scale-105">
                                    <div className="w-full h-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-sm font-black text-slate-900 dark:text-white">
                                        {user?.username?.[0]?.toUpperCase() || 'S'}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="group p-1 md:p-2 text-slate-400 hover:text-red-500 transition-all"
                                title="Exit Library"
                            >
                                <svg className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-1.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
