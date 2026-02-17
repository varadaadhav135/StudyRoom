import React from 'react';

const ResourceCard = ({
    resource,
    status = 'Pending',
    onUpdateProgress,
    isAdmin = false,
    onEdit,
    onDelete,
    onPreview
}) => {
    const statusColors = {
        'Pending': 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
        'Viewed': 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
        'Completed': 'bg-gold-royal text-slate-900 font-black shadow-gold-premium'
    };

    const statusIcons = {
        'Pending': '📜',
        'Viewed': '📖',
        'Completed': '👑'
    };

    const handleOpenResource = () => {
        if (!resource.url) return;
        if (onPreview) {
            onPreview(resource);
        } else {
            window.open(resource.url, '_blank', 'noopener,noreferrer');
        }

        if (status === 'Pending' && onUpdateProgress) {
            onUpdateProgress(resource.id, 'Viewed');
        }
    };

    return (
        <div className="glass-premium p-8 rounded-[2.5rem] border border-white/10 transition-all duration-700 hover:shadow-gold-premium group relative overflow-hidden flex flex-col h-[400px] bg-white/5 reveal">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-amber-400/10 transition-all duration-700 group-hover:scale-150"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mb-12 blur-2xl group-hover:bg-emerald-400/10 transition-all duration-700"></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
                <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${statusColors[status]} flex items-center gap-2.5 backdrop-blur-md`}>
                    <span className="text-sm leading-none">{statusIcons[status]}</span>
                    {status}
                </span>
                {!isAdmin && status !== 'Completed' && (
                    <button
                        onClick={() => onUpdateProgress && onUpdateProgress(resource.id, 'Completed')}
                        className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-white/10 transition-all border border-white/10 group-hover:scale-110 active:scale-90"
                        title="Mark Complete"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="flex-1 cursor-pointer relative z-10" onClick={handleOpenResource}>
                <div className="mb-4">
                    {resource.category && (
                        <div className="inline-flex items-center px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] mb-3">
                            {resource.category}
                        </div>
                    )}
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 font-display leading-[1.1] tracking-tight group-hover:text-amber-500 transition-colors duration-500">
                        {resource.title}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed font-medium">
                        {resource.description}
                    </p>
                </div>
            </div>

            <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-xs shadow-lg border border-white/10">🏛️</div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Level</span>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest">{resource.accessLevel || 'Classified'}</span>
                    </div>
                </div>

                {isAdmin ? (
                    <div className="flex gap-2">
                        <button onClick={() => onDelete && onDelete(resource.id)} className="p-3 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-14v4m-4-4V4a1 1 0 011-1h2a1 1 0 011 1v2" />
                            </svg>
                        </button>
                    </div>
                ) : (
                    <button onClick={handleOpenResource} className="px-6 py-2.5 rounded-xl bg-slate-900/5 dark:bg-white/5 hover:bg-gold-royal hover:text-slate-900 text-amber-500 dark:text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 transition-all duration-500 shadow-sm">
                        Access <span className="text-lg leading-none">→</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ResourceCard;
