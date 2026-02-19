import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [loadMap, setLoadMap] = useState(false);

    const slides = [
        { url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=60&fm=webp', title: 'The Grand Hall' },
        { url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=60&fm=webp', title: 'Silent Archives' },
        { url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=60&fm=webp', title: 'Scholarly Retreat' },
        { url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1200&q=60&fm=webp', title: 'Imperial Study' },
        { url: 'https://images.unsplash.com/photo-1491841251912-401a20612de7?auto=format&fit=crop&w=1200&q=60&fm=webp', title: 'Daily Archives' }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        // Lazy load Google Maps when location section comes into view
        const mapSection = document.getElementById('location-section');
        if (mapSection) {
            const mapObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !loadMap) {
                            setLoadMap(true);
                            mapObserver.disconnect();
                        }
                    });
                },
                { threshold: 0.1 }
            );
            mapObserver.observe(mapSection);
        }

        return () => {
            clearInterval(timer);
            observer.disconnect();
        };
    }, []);

    const features = [
        {
            title: 'Pure Drinking Water',
            desc: 'Fresh, clean drinking water available throughout the day for all scholars.',
            image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=50&fm=webp',
            span: 'bento-span-2 bento-row-2',
            icon: '💧'
        },
        {
            title: 'Air Conditioning',
            desc: 'Centralized AC keeps the hall cool and comfortable all year round.',
            image: 'https://images.unsplash.com/photo-1518306727298-4c17e1bf6942?auto=format&fit=crop&w=600&q=50&fm=webp',
            span: '',
            icon: '❄️'
        },
        {
            title: 'High-Speed WiFi',
            desc: 'Ultra-fast fiber internet connectivity for research and learning.',
            image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=50&fm=webp',
            span: '',
            icon: '📶'
        },
        {
            title: 'Comfortable Seating',
            desc: 'Ergonomic chairs designed for long study sessions without fatigue.',
            image: 'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=600&q=50&fm=webp',
            span: 'bento-span-2',
            icon: '🪑'
        },
        {
            title: 'Deep Focus Silence',
            desc: 'A strictly silent environment crafted for undistracted, deep work.',
            image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=50&fm=webp',
            span: '',
            icon: '🤫'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-100">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 px-8 py-5 flex justify-between items-center bg-white/60 backdrop-blur-xl border-b border-white/20">
                <div className="flex items-center gap-4 transition-transform hover:scale-105 cursor-pointer">
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
                {/* Admin login button removed per request. Access via /admin directly. */}
            </nav>

            {/* Hero & Slider Section */}
            <header className="relative pt-32 pb-32 overflow-hidden bg-slate-50">
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-amber-100/40 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[600px] h-[600px] bg-emerald-100/40 rounded-full blur-[120px]"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-24">
                    <div className="flex-1 space-y-10 animate-fade-in-up">
                        <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/80 backdrop-blur border border-amber-200/50 rounded-full text-amber-800 font-bold text-xs uppercase tracking-widest shadow-sm">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            Est. 2024 • Premier Scholars Hub
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black leading-[0.9] text-slate-900 font-display tracking-tightest">
                            The Art of <br />
                            <span className="text-gold-royal">Wisdom.</span>
                        </h1>
                        <p className="text-2xl text-slate-500 max-w-xl leading-relaxed font-medium">
                            Step into a sanctuary where tradition meets modern excellence. Your pursuit of knowledge deserves a royal setting.
                        </p>
                        <div className="flex flex-wrap gap-8 pt-6">
                            <a
                                href="#features"
                                className="btn-premium btn-gold text-lg px-12 py-6 rounded-[2.5rem]"
                            >
                                Explore Our Library
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-2xl relative">
                        <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl shadow-amber-200 relative group border-4 border-white">
                            {slides.map((slide, index) => (
                                <div
                                    key={index}
                                    className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                                >
                                    <img
                                        src={slide.url}
                                        alt={slide.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                                    <div className="absolute bottom-10 left-10 text-white">
                                        <h3 className="text-3xl font-black font-display">{slide.title}</h3>
                                        <p className="text-amber-400 font-bold uppercase tracking-widest text-[10px]">Royal Collection</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Slider Nav */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 transition-all rounded-full ${index === currentSlide ? 'w-10 bg-amber-500' : 'w-2 bg-slate-300'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Imperial Features Section */}
            <section id="features" className="py-40 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-24 reveal">
                        <span className="text-[12px] font-bold text-amber-500 uppercase tracking-[0.5em] block mb-4">Elite Standards</span>
                        <h2 className="text-6xl md:text-7xl font-black text-slate-900 font-display tracking-tightest">
                            Imperial <span className="text-gold-royal">Features</span>
                        </h2>
                        <div className="w-32 h-2.5 bg-gold-royal mx-auto mt-8 rounded-full shadow-gold-premium"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 reveal">
                        {features.map((feature, idx) => (
                            <div
                                key={idx}
                                className={`group relative h-80 rounded-[2.5rem] overflow-hidden shadow-lg hover:shadow-gold-premium transition-all duration-700 ${feature.span === 'bento-span-2 bento-row-2' ? 'lg:col-span-2' : ''} ${feature.span === 'bento-span-2' ? 'lg:col-span-2' : ''}`}
                            >
                                {/* Background Image */}
                                <img
                                    src={feature.image}
                                    alt={feature.title}
                                    loading="lazy"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />

                                {/* Refined Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                                {/* Content */}
                                <div className="relative z-10 h-full flex flex-col justify-end p-10 space-y-3">
                                    <h3 className="text-2xl font-black text-white font-display uppercase tracking-tight leading-none group-hover:text-gold-royal transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-300 font-medium text-base leading-relaxed max-w-sm">
                                        {feature.desc}
                                    </p>

                                    <div className="pt-4 flex items-center gap-3 text-gold-royal font-black uppercase tracking-[0.2em] text-[10px] transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <span className="w-8 h-[2px] bg-gold-royal"></span>
                                        <span>Examine Feature</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Video Introduction Section */}
            <section className="py-40 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
                    <div className="space-y-6 reveal">
                        <span className="text-[12px] font-bold text-emerald-500 uppercase tracking-[0.5em] block">Imperial Chronicles</span>
                        <h2 className="text-6xl md:text-7xl font-black text-slate-900 font-display tracking-tightest">
                            Witness the <span className="text-slate-400">Ambience</span>
                        </h2>
                        <div className="w-24 h-2 bg-emerald-500 mx-auto rounded-full"></div>
                        <p className="text-2xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
                            Take a virtual tour of our imperial facilities.
                            <span className="block mt-4 text-sm text-slate-400 italic">Process: Host your cinematic reel on YouTube/Vimeo and embed the ID below.</span>
                        </p>
                    </div>

                    <div className="relative aspect-video rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border-[12px] border-slate-50 group cursor-pointer reveal active">
                        {/*
                         * VIDEO EMBED INSTRUCTIONS:
                         * Option A – YouTube/Vimeo (recommended, free CDN):
                         *   Replace this entire block with:
                         *   <iframe
                         *     src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1&mute=1&loop=1&controls=0&playlist=YOUR_VIDEO_ID"
                         *     className="w-full h-full object-cover"
                         *     allow="autoplay; fullscreen"
                         *     frameBorder="0"
                         *   />
                         *
                         * Option B – Self-hosted MP4 (host in /public folder):
                         *   Recommended: 720p, H.264, ≤10 MB, ~1-2 Mbps
                         *   Keep video length 30-60s for fast loading.
                         */}
                        <video
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            poster="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=50&fm=webp"
                        >
                            {/* Add your video source here, e.g.: */}
                            {/* <source src="/library-tour.mp4" type="video/mp4" /> */}
                            {/* Fallback image while no video is set */}
                            <img
                                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=50&fm=webp"
                                alt="Library Ambience"
                                className="w-full h-full object-cover"
                            />
                        </video>
                        {/* Play overlay — hides once video is playing */}
                        <div className="absolute inset-0 bg-slate-950/10 group-hover:bg-slate-950/30 transition-all flex items-center justify-center pointer-events-none">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/40 shadow-2xl group-hover:scale-110 transition-transform">
                                <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[24px] border-l-white border-b-[12px] border-b-transparent ml-2"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Imperial Visitation Section (Location) */}
            <section id="location-section" className="py-40 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-stretch gap-16">
                        <div className="flex-1 space-y-12 reveal">
                            <div className="space-y-6">
                                <span className="text-[12px] font-bold text-amber-500 uppercase tracking-[0.5em] block">Imperial Visitation</span>
                                <h2 className="text-6xl font-black text-slate-900 font-display tracking-tightest leading-[0.9]">
                                    Our Global <br />
                                    <span className="text-gold-royal">Sanctuary.</span>
                                </h2>
                                <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-md">
                                    Located in the heart of the scholarly district, our library provides a quiet refuge for dedicated learners.
                                </p>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-gold-premium flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        📍
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Physical Address</h4>
                                        <p className="text-slate-500 font-medium italic">Khedekar Complex , Gajanan Nagar ,<br />Chikhli, Maharashtra 443201</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-6 group">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-gold-premium flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                        📞
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">Scholarly Inquiries</h4>
                                        <p className="text-slate-500 font-medium italic">+91 000 000 0000</p>
                                    </div>
                                </div>
                            </div>

                            <a
                                href="https://www.google.com/maps/place/Dnyanpeeth+abhyasika/@20.3389687,76.2626183,17z/data=!3m1!4b1!4m6!3m5!1s0x3bda1100184d94f5:0x5234a9d1ab209752!8m2!3d20.3389687!4d76.2626183!16s%2Fg%2F11y3y0_b8r"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-premium btn-gold text-lg px-12 py-6 rounded-[2rem] inline-block text-center"
                            >
                                Schedule a Tour
                            </a>
                        </div>

                        <div className="w-full lg:flex-[1.5] relative reveal">
                            <div className="h-[420px] sm:h-[480px] lg:h-full lg:min-h-[500px] rounded-[2rem] lg:rounded-[4rem] overflow-hidden shadow-2xl border-4 lg:border-8 border-white group">
                                {loadMap ? (
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3741.0641425153417!2d76.2626183!3d20.338968700000002!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bda1100184d94f5%3A0x5234a9d1ab209752!2sDnyanpeeth%20abhyasika!5e0!3m2!1sen!2sin!4v1770967083868!5m2!1sen!2sin"
                                        width="100%"
                                        height="100%"
                                        className="w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                                        style={{ border: 0, display: 'block' }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Library Location Map"
                                    ></iframe>
                                ) : (
                                    <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                                        <div className="text-center space-y-4">
                                            <div className="text-6xl">🗺️</div>
                                            <p className="text-slate-600 font-medium">Loading interactive map...</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-40 bg-slate-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(191,149,63,0.1)_0%,transparent_70%)]"></div>
                <div className="max-w-7xl mx-auto px-6 text-center relative z-10 space-y-14 reveal">
                    <h2 className="text-6xl md:text-8xl font-black text-white font-display tracking-tightest leading-tight">
                        Elevate your study <br /> to <span className="text-gold-royal">Imperial Standards.</span>
                    </h2>
                    <p className="text-slate-400 text-2xl max-w-2xl mx-auto font-medium leading-relaxed">
                        Join the society of high-performing students who choose excellence over ordinary.
                    </p>
                    <a
                        href="#location-section"
                        className="btn-premium btn-gold text-xl px-16 py-8 rounded-[3rem] inline-block"
                    >
                        Visit Our Library
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-50 py-12 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-center gap-5 transition-transform hover:scale-105 cursor-pointer">
                        <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-2xl">
                            🏛️
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-2xl text-slate-900 font-display tracking-tighter leading-tight">DnyanPeeth.</span>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mt-1">Imperial Library Society</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">&copy; 2024 Study Library. All Rights Reserved.</p>
                        <p className="text-slate-900 font-black text-sm tracking-tight">Mangesh Sureshrao Khedekar</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;