import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, useVelocity } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';

const TOTAL_FRAMES = 68;
const FRAME_PATH = '/ffffff-ezgif-745afa2c5a99e1cc-gif-jpg';

export default function Intro() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const navigate = useNavigate();

    const [isLoggedIn] = useState(() => !!localStorage.getItem('campx_current_user'));

    // Scroll progress tracking
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ['start start', 'end start']
    });

    // Smooth spring animation for buttery scroll
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 5,
        damping: 10,
        restDelta: 0.001
    });

    // Anti-gravity effect based on scroll velocity
    const scrollVelocity = useVelocity(scrollYProgress);
    const yOffset = useTransform(
        scrollVelocity,
        [-1, 0, 1],
        [15, 0, -15] // Floats up when scrolling down
    );

    // Map scroll to frame index (bi-directional)
    const frameIndex = useTransform(
        smoothProgress,
        [0, 1],
        [0, TOTAL_FRAMES - 1]
    );

    // Preload all frames
    useEffect(() => {
        const loadImages = async () => {
            const imagePromises = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
                return new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image();
                    // Maps i=0 -> frame_00_delay-0.1s.jpg, i=67 -> frame_67_delay-0.1s.jpg
                    const frameNumber = String(i).padStart(2, '0');
                    img.src = `${FRAME_PATH}/frame_${frameNumber}_delay-0.1s.jpg`;
                    
                    img.onload = () => {
                        setLoadProgress((prev) => prev + (100 / TOTAL_FRAMES));
                        resolve(img);
                    };
                    img.onerror = reject;
                });
            });

            const loadedImages = await Promise.all(imagePromises);
            setImages(loadedImages);
            setImagesLoaded(true);
        };
        loadImages();
    }, []);

    // Canvas rendering
    useEffect(() => {
        if (!imagesLoaded || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderFrame = () => {
            const currentFrame = Math.round(frameIndex.get());
            const img = images[Math.max(0, Math.min(currentFrame, TOTAL_FRAMES - 1))];

            if (img) {
                // Responsive canvas sizing
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;

                // Calculate scaling (cover fit)
                const scale = Math.max(
                    canvas.width / img.width,
                    canvas.height / img.height
                );

                const x = (canvas.width - img.width * scale) / 2;
                const y = (canvas.height - img.height * scale) / 2;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
            }
        };

        const unsubscribe = frameIndex.on('change', renderFrame);
        renderFrame(); // Initial render

        // Handle window resize
        const handleResize = () => renderFrame();
        window.addEventListener('resize', handleResize);

        return () => {
            unsubscribe();
            window.removeEventListener('resize', handleResize);
        };
    }, [imagesLoaded, images, frameIndex]);

    // Text overlay animations
    const section1Opacity = useTransform(smoothProgress, [0, 0.05, 0.2, 0.25], [1, 1, 1, 0]);
    const section2Opacity = useTransform(smoothProgress, [0.3, 0.35, 0.5, 0.55], [0, 1, 1, 0]);
    const section3Opacity = useTransform(smoothProgress, [0.6, 0.65, 0.8, 0.85], [0, 1, 1, 0]);
    const section4Opacity = useTransform(smoothProgress, [0.9, 0.92, 0.98, 1], [0, 1, 1, 0]);
    const scrollIndicatorOpacity = useTransform(smoothProgress, [0, 0.1], [1, 0]);

    if (isLoggedIn) {
        return <Navigate to="/home" replace />;
    }

    if (!imagesLoaded) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[9999]">
                <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--primary)]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${loadProgress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
                <p className="text-white/70 text-lg font-['Inter']" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>
                    Loading Experience... {Math.round(loadProgress)}%
                </p>
            </div>
        );
    }

    return (
        <>
            {/* Top Right Buttons */}
            {!isLoggedIn && (
                <div style={{ position: 'fixed', top: '2rem', right: '2.5rem', zIndex: 1000, display: 'flex', gap: '1rem', pointerEvents: 'auto' }}>
                    <button 
                        onClick={() => navigate('/login')}
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '2rem', background: '#fff', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    >
                        Sign In
                    </button>
                    <button 
                        onClick={() => navigate('/signup')}
                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', borderRadius: '2rem', background: 'linear-gradient(135deg, var(--accent), #88cc00)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    >
                        Sign Up
                    </button>
                </div>
            )}

            {/* Fixed Background Canvas playing the GIF frames */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, background: '#000', overflow: 'hidden' }}>
                <motion.div style={{ y: yOffset, width: '100%', height: '100%', opacity: 0.6 }}>
                    <canvas
                        ref={canvasRef}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </motion.div>
            </div>

            {/* Scroll Container */}
            <div ref={containerRef} style={{ height: '1200vh', position: 'relative', zIndex: 1 }}>

                <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', pointerEvents: 'none' }}>
                    
                    {/* Text Overlays */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                        style={{ opacity: section1Opacity, textAlign: 'center', padding: '0 1rem' }}
                    >
                        <h1 style={{ fontSize: 'clamp(4rem, 8vw, 8rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1rem', lineHeight: '1' }}>
                            Welcome to CampX
                        </h1>
                        <p style={{ fontSize: 'clamp(1.2rem, 2vw, 1.5rem)', color: 'rgba(255,255,255,0.8)', fontFamily: "'Inter', sans-serif" }}>
                            Where education defies gravity
                        </p>
                    </motion.div>

                    <motion.div
                        style={{ opacity: section2Opacity, textAlign: 'left', padding: '0 2rem', maxWidth: '800px', marginLeft: 'max(5%, 4rem)', width: '100%' }}
                    >
                        <h2 style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1rem', lineHeight: '1.1' }}>
                            Crafted to Perfection
                        </h2>
                        <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", maxWidth: '400px' }}>
                            From seamless interfaces to groundbreaking innovations, excellence permeates every interaction.
                        </p>
                    </motion.div>

                    <motion.div
                        style={{ opacity: section3Opacity, textAlign: 'right', padding: '0 2rem', maxWidth: '800px', marginRight: 'max(5%, 4rem)', marginLeft: 'auto', width: '100%' }}
                    >
                        <h2 style={{ fontSize: 'clamp(3rem, 6vw, 6rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '1rem', lineHeight: '1.1' }}>
                            Anti-Gravity Platform
                        </h2>
                        <p style={{ fontSize: 'clamp(1rem, 1.5vw, 1.2rem)', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', sans-serif", marginLeft: 'auto', maxWidth: '400px' }}>
                            Defying traditional limitations, elevating your academic journey endlessly forward.
                        </p>
                    </motion.div>

                    <motion.div
                        style={{ opacity: section4Opacity, textAlign: 'center', padding: '0 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    >
                        <h2 style={{ fontSize: 'clamp(4rem, 8vw, 7rem)', fontFamily: "'Instrument Serif', serif", fontWeight: 'normal', color: '#fff', marginBottom: '2rem', lineHeight: '1.1' }}>
                            Discover Your Future
                        </h2>
                        <motion.button
                            onClick={() => navigate('/login')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '1rem 3rem',
                                background: 'linear-gradient(135deg, var(--accent), #88cc00)',
                                color: '#000',
                                borderRadius: '3rem',
                                fontSize: '1.2rem',
                                fontWeight: '600',
                                pointerEvents: 'auto',
                                cursor: 'pointer',
                                border: 'none',
                                boxShadow: '0 10px 30px rgba(204,255,0,0.3)',
                                transition: 'shadow 0.3s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 15px 40px rgba(204,255,0,0.5)'}
                            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 10px 30px rgba(204,255,0,0.3)'}
                        >
                            Enter CampX ➔
                        </motion.button>
                        
                        <p style={{marginTop: '1.5rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', pointerEvents: 'auto', cursor: 'pointer', textDecoration: 'underline'}} onClick={() => navigate('/home')}>
                            Explore Public Campus
                        </p>
                    </motion.div>
                </div>

                {/* Scroll Indicator */}
                <motion.div
                    style={{ opacity: scrollIndicatorOpacity, position: 'absolute', bottom: '3rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}
                >
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontFamily: "'Inter', sans-serif", letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Scroll to Explore
                    </p>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        style={{ width: '24px', height: '40px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '20px', display: 'flex', justifyContent: 'center', padding: '6px 0' }}
                    >
                        <div style={{ width: '4px', height: '8px', background: 'rgba(255,255,255,0.6)', borderRadius: '4px' }} />
                    </motion.div>
                </motion.div>
            </div>
        </div>
        </>
    );
}
