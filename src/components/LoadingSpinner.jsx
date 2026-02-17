import React from 'react';

const LoadingSpinner = ({ size = 'md', message = '' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-2',
        md: 'w-12 h-12 border-3',
        lg: 'w-20 h-20 border-4'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-6 p-8">
            <div className="relative">
                {/* Decorative outer ring */}
                <div className={`${sizeClasses[size].split(' ')[0]} ${sizeClasses[size].split(' ')[1]} rounded-full border-gold-royal/20 absolute inset-0 animate-ping`}></div>
                {/* Main spinner */}
                <div className={`${sizeClasses[size]} border-gold-royal border-t-transparent rounded-full animate-spin shadow-gold-premium`}></div>
            </div>
            {message && (
                <p className="text-gold-royal font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">
                    {message}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
