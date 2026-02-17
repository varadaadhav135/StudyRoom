import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ResourceCard from '../components/ResourceCard';
import Modal from '../components/Modal';
import SubscriptionCard from '../components/SubscriptionCard';
import StudentProfileForm from '../components/StudentProfileForm';

const StudentDashboard = () => {
    const { user, profile, subscription, getDaysUntilExpiry } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState([]);
    const [progress, setProgress] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [previewResource, setPreviewResource] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [activeTab, setActiveTab] = useState('resources');

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        localStorage.setItem('darkMode', newDarkMode);
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resourcesRes, progressRes] = await Promise.all([
                api.getResources(),
                api.getProgress()
            ]);

            if (resourcesRes.success) {
                setResources(resourcesRes.resources || []);
            }

            if (progressRes.success) {
                setProgress(progressRes.progress || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Error loading dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getResourceStatus = (resourceId) => {
        const resourceProgress = progress.find(p => p.resource_id === resourceId);
        return resourceProgress?.status || 'Pending';
    };

    const handleUpdateProgress = async (resourceId, status) => {
        try {
            const response = await api.updateProgress(null, resourceId, status);

            if (response.success) {
                if (status !== 'Viewed') {
                    toast.success(`Resource marked as ${status}!`);
                }
                fetchData();
            } else {
                toast.error(response.message || 'Failed to update progress');
            }
        } catch (error) {
            console.error('Error updating progress:', error);
            toast.error('Error updating progress');
        }
    };

    const handlePreview = (resource) => {
        setPreviewResource(resource);
        const currentStatus = getResourceStatus(resource.id);
        if (currentStatus === 'Pending') {
            handleUpdateProgress(resource.id, 'Viewed');
        }
    };

    const stats = {
        total: resources.length,
        completed: progress.filter(p => p.status === 'Completed').length,
        viewed: progress.filter(p => p.status === 'Viewed').length,
        pending: resources.length - progress.filter(p => p.status === 'Completed' || p.status === 'Viewed').length
    };

    const completionPercentage = stats.total > 0
        ? Math.round((stats.completed / stats.total) * 100)
        : 0;

    const categories = ['All', ...new Set(resources.map(r => r.category).filter(Boolean))];

    const filteredResources = resources.filter(resource => {
        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            resource.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const daysRemaining = getDaysUntilExpiry();
    const showExpiryWarning = daysRemaining !== null && daysRemaining <= 7 && daysRemaining >= 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            <div className="max-w-7xl mx-auto px-6 py-16">
                {/* Header with Subscription Warning */}
                <header className="mb-16 reveal active">
                    {showExpiryWarning && (
                        <div className="mb-10 p-6 glass-premium border-l-8 border-amber-500 rounded-[2rem] shadow-gold-premium animate-fade-in-up">
                            <div className="flex items-center gap-5">
                                <span className="text-4xl">⚠️</span>
                                <div>
                                    <p className="font-black text-amber-900 dark:text-amber-200 text-lg uppercase tracking-tight">
                                        Subscription Expiring Soon
                                    </p>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                                        Your scholarly access will expire in <span className="text-amber-600 font-bold">{daysRemaining} days</span>. Please contact administration for renewal.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-100 dark:border-emerald-800">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                Academic Link: Active
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white font-display tracking-tightest leading-tight">
                                Scholarly <span className="text-gold-royal">Archives</span>
                            </h1>
                            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">
                                Welcome back, <span className="text-slate-900 dark:text-white font-black underline decoration-amber-400 decoration-4 underline-offset-4">{profile?.username || 'Learner'}</span>. Your intellectual journey continues with royal precision.
                            </p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <LoadingSpinner message="Curating your resources..." />
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200 dark:border-white/5 mb-12 space-x-12 reveal">
                            {['resources', 'subscription', 'profile'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-5 text-lg font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gold-royal rounded-t-full shadow-gold-premium"></div>}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'resources' ? (
                            <>
                                {/* Stats Overview */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16 reveal">
                                    <div className="lg:col-span-2 glass-premium p-10 rounded-[3rem] relative overflow-hidden group shadow-lg border border-white/10">
                                        <div className="absolute top-[-20%] right-[-10%] p-8 text-[15rem] opacity-[0.03] text-gold-royal group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000 font-display">Arch</div>
                                        <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
                                            <div className="relative group/circle">
                                                <div className="absolute inset-0 bg-gold-royal/10 blur-3xl rounded-full scale-150 opacity-0 group-hover/circle:opacity-100 transition-opacity"></div>
                                                <svg className="w-52 h-52 transform -rotate-90 relative z-10">
                                                    <circle cx="104" cy="104" r="94" stroke="currentColor" strokeWidth="16" fill="none" className="text-slate-100 dark:text-white/5" />
                                                    <circle cx="104" cy="104" r="94" stroke="url(#goldGradient)" strokeWidth="16" fill="none" strokeDasharray={`${2 * Math.PI * 94}`} strokeDashoffset={`${2 * Math.PI * 94 * (1 - completionPercentage / 100)}`} className="transition-all duration-[1.5s] ease-out" strokeLinecap="round" />
                                                    <defs>
                                                        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                            <stop offset="0%" stopColor="#bf953f" />
                                                            <stop offset="50%" stopColor="#fcf6ba" />
                                                            <stop offset="100%" stopColor="#aa771c" />
                                                        </linearGradient>
                                                    </defs>
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-6xl font-black text-slate-900 dark:text-white font-display tracking-tightest">{completionPercentage}%</span>
                                                    <span className="text-[10px] uppercase tracking-[0.3em] text-amber-600 font-black">Mastered</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 space-y-8 text-center md:text-left">
                                                <div>
                                                    <h3 className="text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">Academic Progress</h3>
                                                    <p className="text-xl text-slate-500 dark:text-slate-400 mt-2 font-medium">You've successfully conquered <span className="text-amber-600 font-black">{stats.completed}</span> of your <span className="text-slate-950 dark:text-white font-black">{stats.total}</span> manuscripts.</p>
                                                </div>
                                                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                                                    <div className="px-6 py-3 glass-premium border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                                                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{stats.completed} Completed</span>
                                                    </div>
                                                    <div className="px-6 py-3 glass-premium border border-amber-500/20 rounded-2xl flex items-center gap-3">
                                                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"></span>
                                                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">{stats.viewed} In Review</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="glass-premium bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden group border-white/10 shadow-xl reveal">
                                            <div className="absolute -top-4 -right-4 p-8 text-8xl opacity-10 group-hover:rotate-12 transition-transform">📚</div>
                                            <p className="text-white/50 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Library Assets</p>
                                            <h4 className="text-6xl font-black font-display tracking-tightest text-gold-royal">{stats.total}</h4>
                                        </div>
                                        <div className="glass-premium bg-emerald-600 text-white p-8 rounded-[2.5rem] relative overflow-hidden group border-white/10 shadow-xl reveal">
                                            <div className="absolute -top-4 -right-4 p-8 text-8xl opacity-10 group-hover:-rotate-12 transition-transform">🏆</div>
                                            <p className="text-emerald-100/50 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Academic Rank</p>
                                            <h4 className="text-5xl font-black font-display tracking-tightest">Level 4</h4>
                                        </div>
                                    </div>
                                </div>

                                {/* Search and Filters */}
                                <div className="flex flex-col md:flex-row gap-6 mb-16 reveal">
                                    <div className="flex-1 relative group">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-slate-900 dark:text-white text-lg focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all outline-none shadow-sm"
                                            placeholder="Search the archives for manuscripts..."
                                        />
                                        <svg className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <div className="relative md:w-80">
                                        <select
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[1.5rem] py-5 px-8 text-slate-900 dark:text-white text-lg appearance-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all outline-none shadow-sm cursor-pointer font-bold tracking-tight"
                                        >
                                            {categories.map(category => (
                                                <option key={category} value={category} className="dark:bg-slate-900">
                                                    {category === 'All' ? 'All Disciplines' : category}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Resource Grid */}
                                <section>
                                    <div className="flex items-center justify-between mb-10 reveal">
                                        <h2 className="text-4xl font-black text-slate-900 dark:text-white font-display tracking-tightest uppercase">
                                            Educational <span className="text-gold-royal">Assets</span>
                                            <span className="text-[10px] ml-4 font-black bg-slate-100 dark:bg-white/10 px-3 py-1 rounded-lg text-slate-500 dark:text-white/50 tracking-widest align-middle">
                                                {filteredResources.length} TITLES
                                            </span>
                                        </h2>
                                    </div>

                                    {filteredResources.length === 0 ? (
                                        <div className="card text-center py-20 glass-card">
                                            <div className="text-6xl mb-4 opacity-20">🍃</div>
                                            <p className="text-slate-500 text-lg font-medium">No manuscripts found matching your criteria.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                            {filteredResources.map((resource) => (
                                                <ResourceCard
                                                    key={resource.id}
                                                    resource={resource}
                                                    status={getResourceStatus(resource.id)}
                                                    onUpdateProgress={handleUpdateProgress}
                                                    isAdmin={false}
                                                    onPreview={handlePreview}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </>
                        ) : activeTab === 'subscription' ? (
                            <div className="max-w-2xl mx-auto">
                                <SubscriptionCard subscription={subscription} />
                            </div>
                        ) : (
                            <div className="max-w-4xl mx-auto glass-premium p-12 rounded-[3.5rem] border border-white/5 shadow-gold-premium relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 text-[10rem] opacity-[0.02] font-display pointer-events-none">Profile</div>
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white font-display mb-10 tracking-tightest">
                                    Imperial <span className="text-gold-royal">Profile</span>
                                </h2>
                                <StudentProfileForm onComplete={() => toast.success('Profile saved successfully!')} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Premium Preview Modal */}
            <Modal
                isOpen={!!previewResource}
                onClose={() => setPreviewResource(null)}
                title={previewResource?.title || 'Resource Manuscript'}
            >
                {previewResource && (
                    <div className="space-y-10">
                        <div className="relative p-8 rounded-[2rem] bg-slate-900/5 dark:bg-white/5 border border-white/5">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-gold-royal rounded-full"></div>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">
                                "{previewResource.description}"
                            </p>
                        </div>
                        <div className="w-full aspect-video rounded-[2.5rem] overflow-hidden glass-premium shadow-2xl border border-white/10 group">
                            {previewResource.url.endsWith('.pdf') ? (
                                <iframe src={`${previewResource.url}#toolbar=0`} className="w-full h-full" title="Digital Manuscript" />
                            ) : previewResource.url.includes('youtube.com') || previewResource.url.includes('youtu.be') ? (
                                <iframe src={previewResource.url.replace('watch?v=', 'embed/').replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full" title="Cinematic Lecture" allowFullScreen />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full p-16 text-center space-y-8 bg-slate-900">
                                    <div className="w-32 h-32 bg-white/5 rounded-[2rem] flex items-center justify-center text-7xl shadow-inner group-hover:scale-110 transition-transform">📖</div>
                                    <div className="space-y-4">
                                        <p className="text-xl text-white font-black font-display tracking-tight">External Archive Required</p>
                                        <p className="text-slate-400 font-medium max-w-xs mx-auto">This asset requires external processing for full visualization.</p>
                                    </div>
                                    <a href={previewResource.url} target="_blank" rel="noopener noreferrer" className="btn-premium btn-gold px-10 py-5 text-xs font-black uppercase tracking-[0.3em]">
                                        Extract Manuscript ↗
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StudentDashboard;
