import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-slate-950/90 backdrop-blur-xl animate-fade-in"
            onClick={handleBackdropClick}
        >
            <div
                ref={modalRef}
                className="glass-premium rounded-2xl md:rounded-[3.5rem] shadow-gold-premium w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all animate-scale-in border border-white/10 overflow-hidden relative"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 md:p-10 border-b border-slate-100 bg-slate-50/50 relative z-10">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white border border-amber-200 rounded-xl md:rounded-3xl flex items-center justify-center text-xl md:text-3xl shadow-sm transition-all hover:rotate-6">
                            🏛️
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] md:tracking-[0.4em] leading-none mb-1 md:mb-2">DnyanPeeth Administration</span>
                            <h3 className="text-xl md:text-3xl font-black text-slate-900 font-display tracking-tightest">
                                {title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all rounded-xl md:rounded-2xl border border-slate-100 group active:scale-90"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar relative z-10 bg-white">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default Modal;
