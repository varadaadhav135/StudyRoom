const SubscriptionCard = ({ subscription, isAdmin = false, onUpdate }) => {
    if (!subscription) {
        return (
            <div className="glass-premium p-12 rounded-[3.5rem] border-2 border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-center animate-pulse">
                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-4xl mb-6">
                    📅
                </div>
                <p className="text-xl font-black text-slate-900 dark:text-white font-display tracking-tightest uppercase mb-2">
                    No Active Manuscript
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                    Please contact the Imperial Librarian for scholarly access.
                </p>
            </div>
        );
    }

    const { start_date, end_date, amount, currency, status } = subscription;
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    // Status badge configuration
    const statusConfig = {
        active: {
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            text: 'text-emerald-600',
            icon: '✓',
            label: 'Academic Active'
        },
        expiring_soon: {
            bg: 'bg-amber-500/10 border-amber-500/20',
            text: 'text-amber-600',
            icon: '⚠️',
            label: 'Ending Soon'
        },
        expired: {
            bg: 'bg-red-500/10 border-red-500/20',
            text: 'text-red-500',
            icon: '✕',
            label: 'Access Terminated'
        }
    };

    const currentStatus = statusConfig[status] || statusConfig.expired;

    return (
        <div className="glass-premium p-10 rounded-[3.5rem] relative overflow-hidden border border-white/10 shadow-gold-premium reveal">
            {/* Background Decor */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-500/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[80px]"></div>

            {/* Status Badge */}
            <div className={`inline-flex items-center gap-3 px-6 py-2.5 ${currentStatus.bg} ${currentStatus.text} rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 border relative z-10 backdrop-blur-md shadow-sm`}>
                <span className="text-sm">{currentStatus.icon}</span>
                {currentStatus.label}
            </div>

            {/* Subscription Details */}
            <div className="space-y-10 relative z-10">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-10">
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                            Inception
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tightest">
                            {startDate.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Expiration
                        </p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tightest">
                            {endDate.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Days Remaining Card */}
                {status !== 'expired' && (
                    <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl border border-white/10 group hover:scale-[1.02] transition-transform duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-black mb-1">
                                    Imperial Access Left
                                </p>
                                <p className="text-5xl font-black font-display text-gold-royal tracking-tightest leading-none mt-3">
                                    {daysRemaining} <span className="text-sm font-bold uppercase tracking-widest text-white/30 ml-2">Days</span>
                                </p>
                            </div>
                            <div className="w-20 h-20 bg-white/5 rounded-[1.5rem] flex items-center justify-center text-4xl group-hover:rotate-12 transition-transform">
                                ⌛
                            </div>
                        </div>
                    </div>
                )}

                {/* Amount */}
                <div className="pt-6 flex items-center justify-between border-t border-white/5">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400 font-black mb-3">
                            Imperial Tribute
                        </p>
                        <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500 font-display tracking-tighter">
                            <span className="text-sm font-bold mr-1 opacity-50 uppercase">{currency}</span>
                            {parseFloat(amount).toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className="text-4xl opacity-10 font-display font-black text-gold-royal">PAID</div>
                </div>

                {/* Admin Actions */}
                {isAdmin && onUpdate && (
                    <button
                        onClick={onUpdate}
                        className="w-full btn-premium btn-gold py-5 text-xs font-black uppercase tracking-[0.3em] shadow-gold-premium"
                    >
                        Update Imperial Order
                    </button>
                )}
            </div>

            {/* Decorative element */}
            <div className="absolute top-10 right-10 text-[12rem] opacity-[0.03] font-display font-black text-amber-500 select-none pointer-events-none">
                📜
            </div>
        </div>
    );
};

export default SubscriptionCard;
