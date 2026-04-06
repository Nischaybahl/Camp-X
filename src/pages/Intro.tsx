import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useVelocity, AnimatePresence } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { Copy, Check, X } from 'lucide-react';

// ── Effect hooks & components ─────────────────────────────────────────────────
import { useParticleTrail } from '../hooks/useParticleTrail';
import { useTilt } from '../hooks/useTilt';
import { useScrollReveal } from '../hooks/useScrollReveal';
import FloatingOrbs from '../components/FloatingOrbs';

export default function Intro() {
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const [isLoggedIn] = useState(() => !!localStorage.getItem('campx_current_user'));

    // Contact Modal State
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [copiedEmail, setCopiedEmail] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState(false);

    // ── Effect 1: Cursor Particle Trail ────────────────────────────────────────
    useParticleTrail();

    // ── Effect 2: 3D Tilt on hero ──────────────────────────────────────────────
    const { ref: tiltRef1, onMouseMove: onMM1, onMouseLeave: onML1, onMouseEnter: onME1 } = useTilt<HTMLDivElement>({ maxDeg: 8, perspective: 1000, resetDuration: 600 });
    const { ref: tiltRef2, onMouseMove: onMM2, onMouseLeave: onML2, onMouseEnter: onME2 } = useTilt<HTMLDivElement>({ maxDeg: 12, perspective: 900 });
    const { ref: tiltRef3, onMouseMove: onMM3, onMouseLeave: onML3, onMouseEnter: onME3 } = useTilt<HTMLDivElement>({ maxDeg: 12, perspective: 900 });
    const { ref: tiltRef4, onMouseMove: onMM4, onMouseLeave: onML4, onMouseEnter: onME4 } = useTilt<HTMLDivElement>({ maxDeg: 12, perspective: 900 });

    // ── Effect 3: Scroll-triggered reveal (for deep sections if needed) ────────
    useScrollReveal({ threshold: 0.15, duration: '0.8s', translateY: '40px', staggerMs: 150 });

    // ── Scroll progress tracking ───────────────────────────────────────────────
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start']
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 5,
        damping: 10,
        restDelta: 0.001
    });

    // Anti-gravity parallax + Zoom
    const scrollVelocity = useVelocity(scrollYProgress);
    const yOffset = useTransform(scrollVelocity, [-1, 0, 1], [15, 0, -15]);
    const videoScale = useTransform(smoothProgress, [0, 1], [1, 1.15]); // Subtle zoom in on scroll

    // Text overlay fade timings
    const section1Opacity = useTransform(smoothProgress, [0, 0.05, 0.2, 0.25], [1, 1, 1, 0]);
    const section1Y = useTransform(smoothProgress, [0, 0.25], [0, -40]);

    const section2Opacity = useTransform(smoothProgress, [0.25, 0.3, 0.5, 0.55], [0, 1, 1, 0]);
    const section2Y = useTransform(smoothProgress, [0.25, 0.3, 0.5, 0.55], [40, 0, 0, -40]);

    const section3Opacity = useTransform(smoothProgress, [0.55, 0.6, 0.8, 0.85], [0, 1, 1, 0]);
    const section3Y = useTransform(smoothProgress, [0.55, 0.6, 0.8, 0.85], [40, 0, 0, -40]);

    const section4Opacity = useTransform(smoothProgress, [0.85, 0.9, 0.98, 1], [0, 1, 1, 0]);
    const section4Y = useTransform(smoothProgress, [0.85, 0.9, 0.98, 1], [40, 0, 0, -40]);

    const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

    // Handle ESC to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsContactOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const copyToClipboard = (text: string, type: 'email' | 'phone') => {
        navigator.clipboard.writeText(text);
        if (type === 'email') {
            setCopiedEmail(true);
            setTimeout(() => setCopiedEmail(false), 2000);
        } else {
            setCopiedPhone(true);
            setTimeout(() => setCopiedPhone(false), 2000);
        }
    };

    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoDuration, setVideoDuration] = useState(0);

    // Get the duration of the video once it loads
    useEffect(() => {
        const handleLoaded = () => {
            if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
                setVideoDuration(videoRef.current.duration);
            }
        };

        const v = videoRef.current;
        if (v) {
            v.addEventListener('loadedmetadata', handleLoaded);
            if (v.readyState >= 1) setVideoDuration(v.duration);
        }
        return () => {
            if (v) v.removeEventListener('loadedmetadata', handleLoaded);
        };
    }, []);

    // Sync video time to our smooth scroll progress
    useEffect(() => {
        if (videoDuration > 0) {
            return smoothProgress.onChange((val) => {
                if (videoRef.current) {
                    requestAnimationFrame(() => {
                        if (videoRef.current) {
                            videoRef.current.currentTime = val * videoDuration;
                        }
                    });
                }
            });
        }
    }, [smoothProgress, videoDuration]);

    if (isLoggedIn) {
        return <Navigate to="/home" replace />;
    }

    const GlassCardStyle = {
        padding: '2.5rem 3.5rem',
        borderRadius: '24px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        pointerEvents: 'auto' as const,
        transformStyle: 'preserve-3d' as const,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
    };

    return (
        <>
            {/* ── Effect 5: Floating Background Orbs (behind everything) ──────── */}
            <FloatingOrbs />

            {/* Top Right Buttons (Hidden when modal open) */}
            <AnimatePresence>
                {!isLoggedIn && !isContactOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{ position: 'fixed', top: '2rem', right: '2.5rem', zIndex: 1000, display: 'flex', gap: '1rem', pointerEvents: 'auto' }}
                    >
                        <button
                            onClick={() => navigate('/login')}
                            style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', borderRadius: '3rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => navigate('/signup')}
                            style={{ padding: '0.6rem 1.4rem', fontSize: '0.9rem', borderRadius: '3rem', background: 'linear-gradient(135deg, var(--accent), #88cc00)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(204,255,0,0.3)' }}
                        >
                            Sign Up
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Contact Details Modal */}
            <AnimatePresence>
                {isContactOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsContactOpen(false)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                            pointerEvents: 'auto'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                            style={{
                                background: 'rgba(20, 20, 20, 0.8)',
                                border: '1px solid rgba(255,255,255,0.15)',
                                borderRadius: '24px',
                                padding: '3rem',
                                width: '90%',
                                maxWidth: '450px',
                                position: 'relative',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                            }}
                        >
                            <button
                                onClick={() => setIsContactOpen(false)}
                                style={{
                                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
                                    cursor: 'pointer', padding: '0.5rem', display: 'flex'
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
                            >
                                <X size={24} />
                            </button>

                            <h3 style={{ fontSize: '2rem', fontFamily: "'Instrument Serif', serif", color: '#fff', marginBottom: '0.5rem', fontWeight: 'normal' }}>Get in Touch</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', sans-serif", marginBottom: '2rem', fontSize: '0.95rem' }}>
                                Have questions or want to collaborate? I'd love to hear from you.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Email Field */}
                                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Email</span>
                                        <a href="mailto:nischay.bahl.11681@gmail.com" style={{ color: '#fff', textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem' }}>
                                            nischay.bahl.11681@gmail.com
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard('nischay.bahl.11681@gmail.com', 'email')}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.6rem', borderRadius: '8px', color: '#fff', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        {copiedEmail ? <Check size={18} color="var(--accent)" /> : <Copy size={18} />}
                                    </button>
                                </div>

                                {/* Phone Field */}
                                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Phone</span>
                                        <a href="tel:9111033550" style={{ color: '#fff', textDecoration: 'none', fontFamily: "'Inter', sans-serif", fontSize: '0.95rem' }}>
                                            +91 91110 33550
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard('9111033550', 'phone')}
                                        style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '0.6rem', borderRadius: '8px', color: '#fff', cursor: 'pointer', transition: '0.2s' }}
                                    >
                                        {copiedPhone ? <Check size={18} color="var(--accent)" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Video Background ─────────────────────────────────────────────── */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#000', overflow: 'hidden' }}>
                <motion.div style={{ y: yOffset, scale: videoScale, width: '100%', height: '100%' }}>
                    {/* Dark Overlay for premium readability */}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 }}></div>
                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            opacity: 1,
                            display: 'block',
                        }}
                    >
                        <source src="/intro-bg.mp4" type="video/mp4" />
                    </video>
                </motion.div>
            </div>

            {/* ── Scroll Container ─────────────────────────────────────────────── */}
            <div ref={containerRef} style={{ height: '1200vh', position: 'relative', zIndex: 1 }}>

                <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', pointerEvents: 'none' }}>

                    {/* Text Overlays */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                        {/* ── Section 1: Main Hero with CTAs ────────────────────────────── */}
                        <motion.div style={{ opacity: section1Opacity, y: section1Y, textAlign: 'center', padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                                ref={tiltRef1}
                                onMouseMove={onMM1}
                                onMouseLeave={onML1}
                                onMouseEnter={onME1}
                                style={{ ...GlassCardStyle, padding: '3rem 4rem', maxWidth: '800px' }}
                            >
                                <h1 style={{ fontSize: 'clamp(3.5rem, 6vw, 6rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1.5rem', lineHeight: '1.05' }}>
                                    Turn Your Campus Life Into a Smarter Experience
                                </h1>
                                <p style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.25rem)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", lineHeight: '1.6', marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
                                    Your all-in-one platform for notes, attendance, complaints, and academic growth — built for students who want more.
                                </p>

                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', pointerEvents: 'auto' }}>
                                    <motion.button
                                        onClick={() => navigate('/login')}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: '0.8rem 2rem',
                                            background: 'linear-gradient(135deg, var(--accent), #88cc00)',
                                            color: '#000',
                                            borderRadius: '3rem',
                                            fontSize: '1.05rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            border: 'none',
                                            boxShadow: '0 8px 25px rgba(204,255,0,0.25)',
                                        }}
                                    >
                                        Get Started 🚀
                                    </motion.button>

                                    <motion.button
                                        onClick={() => setIsContactOpen(true)}
                                        whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{
                                            padding: '0.8rem 2rem',
                                            background: 'rgba(255,255,255,0.05)',
                                            backdropFilter: 'blur(10px)',
                                            color: '#fff',
                                            borderRadius: '3rem',
                                            fontSize: '1.05rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        Contact Me
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>

                        {/* ── Section 2: Left Glass Card ───────────────────────────────── */}
                        <motion.div
                            style={{ opacity: section2Opacity, y: section2Y, textAlign: 'left', padding: '0 2rem', maxWidth: '650px', marginLeft: 'max(5%, 4rem)', width: '100%', position: 'absolute', left: 0 }}
                        >
                            <div
                                ref={tiltRef2}
                                onMouseMove={onMM2}
                                onMouseLeave={onML2}
                                onMouseEnter={onME2}
                                style={GlassCardStyle}
                            >
                                <h2 style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1rem', lineHeight: '1.1' }}>
                                    Welcome to CampX
                                </h2>
                                <p style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.3rem)', color: 'rgba(255,255,255,0.85)', fontFamily: "'Inter', sans-serif", marginBottom: '1rem' }}>
                                    Where students connect, learn, and grow smarter every day.
                                </p>
                                <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", letterSpacing: '0.5px' }}>
                                    Built to simplify your academic journey.
                                </p>
                            </div>
                        </motion.div>

                        {/* ── Section 3: Middle Section (Right Aligned) ───────────────── */}
                        <motion.div
                            style={{ opacity: section3Opacity, y: section3Y, textAlign: 'right', padding: '0 2rem', maxWidth: '650px', marginRight: 'max(5%, 4rem)', width: '100%', position: 'absolute', right: 0 }}
                        >
                            <div
                                ref={tiltRef3}
                                onMouseMove={onMM3}
                                onMouseLeave={onML3}
                                onMouseEnter={onME3}
                                style={{ ...GlassCardStyle, textAlign: 'left' }} // Keep text left-aligned inside the right-aligned card
                            >
                                <h2 style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4.5rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1rem', lineHeight: '1.1' }}>
                                    Built for Simplicity.<br />Designed for Impact.
                                </h2>
                                <p style={{ fontSize: 'clamp(1rem, 1.3vw, 1.15rem)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", lineHeight: '1.6' }}>
                                    From organized notes to real-time updates, every feature is crafted to enhance your productivity and reduce academic stress.
                                </p>
                            </div>
                        </motion.div>

                        {/* ── Section 4: Right Section (Center Bottom) ────────────────── */}
                        <motion.div
                            style={{ opacity: section4Opacity, y: section4Y, textAlign: 'center', padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}
                        >
                            <div
                                ref={tiltRef4}
                                onMouseMove={onMM4}
                                onMouseLeave={onML4}
                                onMouseEnter={onME4}
                                style={{ ...GlassCardStyle, maxWidth: '700px' }}
                            >
                                <h2 style={{ fontSize: 'clamp(3rem, 5vw, 5rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                                    Your Smart Academic Companion
                                </h2>
                                <p style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.25rem)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", marginBottom: '2.5rem' }}>
                                    Empowering students with tools that make learning efficient and effortless.
                                </p>

                                <motion.button
                                    onClick={() => navigate('/login')}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: '1rem 3rem',
                                        background: '#fff',
                                        color: '#000',
                                        borderRadius: '3rem',
                                        fontSize: '1.1rem',
                                        fontWeight: '600',
                                        pointerEvents: 'auto',
                                        cursor: 'pointer',
                                        border: 'none',
                                        boxShadow: '0 10px 30px rgba(255,255,255,0.2)',
                                    }}
                                >
                                    Experience CampX ➔
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Scroll Indicator (Hidden when modal open) */}
                    <AnimatePresence>
                        {!isContactOpen && (
                            <motion.div
                                style={{ opacity: scrollIndicatorOpacity }}
                                exit={{ opacity: 0 }}
                                className="scroll-indicator-wrapper"
                            >
                                <div style={{ position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontFamily: "'Inter', sans-serif", letterSpacing: '2px', textTransform: 'uppercase' }}>
                                        Scroll
                                    </p>
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        style={{ width: '22px', height: '36px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '20px', display: 'flex', justifyContent: 'center', padding: '6px 0' }}
                                    >
                                        <div style={{ width: '4px', height: '6px', background: 'rgba(255,255,255,0.6)', borderRadius: '4px' }} />
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </>
    );
}
