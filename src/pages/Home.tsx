import { ChevronLeft, ChevronRight, Phone, Mail, Send, CheckCircle2, MessageSquare, Headphones, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

// Import card images
import campusComplaintImg from '../assets/cards/campus_complaint.png';
import lostFoundImg from '../assets/cards/lost_found.png';
import digitalNotesImg from '../assets/cards/digital_notes.png';
import attendanceImg from '../assets/cards/attendance.png';
import pyqImg from '../assets/cards/pyq.png';
import academiaImg from '../assets/cards/academia.png';
import updatesImg from '../assets/cards/updates.png';
import lightningImg from '../assets/cards/lightning.png';

// 3D Card Component
function Card3D({ image, title, desc, link, index, totalCards, isLoggedIn }: {
    image: string;
    title: string;
    desc: string;
    link: string | null;
    index: number;
    totalCards: number;
    isLoggedIn: boolean;
}) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleCardClick = () => {
        if (!link) return;
        if (!isLoggedIn) {
            navigate('/login');
        } else {
            navigate(link);
        }
    };

    // Calculate the default 3D rotation based on position
    const center = (totalCards - 1) / 2;
    const offset = index - center;
    const defaultRotateY = offset * 12; // Tilt outer cards away
    const defaultTranslateZ = -Math.abs(offset) * 30; // Push outer cards back
    const defaultScale = 1 - Math.abs(offset) * 0.04;

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const tiltX = ((y - centerY) / centerY) * -15;
        const tiltY = ((x - centerX) / centerX) * 15;
        setTilt({ x: tiltX, y: tiltY });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setTilt({ x: 0, y: 0 });
        setIsHovered(false);
    }, []);

    const handleMouseEnter = useCallback(() => {
        setIsHovered(true);
    }, []);

    const cardContent = (
        <div
            ref={cardRef}
            className="card-3d-wrapper"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                perspective: '1200px',
                width: '280px',
                flexShrink: 0,
            }}
        >
            <div
                className="card-3d"
                style={{
                    transform: isHovered
                        ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.08) translateZ(40px)`
                        : `rotateY(${defaultRotateY}deg) translateZ(${defaultTranslateZ}px) scale(${defaultScale})`,
                    transition: isHovered
                        ? 'transform 0.1s ease-out, box-shadow 0.3s ease'
                        : 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.6s ease',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    position: 'relative',
                    height: '420px',
                    cursor: link ? 'pointer' : 'default',
                    boxShadow: isHovered
                        ? '0 30px 60px rgba(0,0,0,0.5), 0 0 40px rgba(204,255,0,0.15), inset 0 0 0 1px rgba(255,255,255,0.15)'
                        : '0 15px 35px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.06)',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform',
                }}
            >
                {/* Background Image */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transition: 'transform 0.4s ease',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                }} />

                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: isHovered
                        ? 'linear-gradient(180deg, rgba(0,0,0,0) 20%, rgba(0,0,0,0.85) 75%, rgba(0,0,0,0.95) 100%)'
                        : 'linear-gradient(180deg, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.92) 100%)',
                    transition: 'background 0.4s ease',
                }} />

                {/* Shine effect on hover */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: isHovered
                        ? `radial-gradient(circle at ${50 + tilt.y * 2}% ${50 + tilt.x * 2}%, rgba(255,255,255,0.12) 0%, transparent 60%)`
                        : 'none',
                    pointerEvents: 'none',
                    transition: 'opacity 0.3s ease',
                }} />

                {/* Content */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '2rem',
                    transform: 'translateZ(30px)',
                    transformStyle: 'preserve-3d',
                }}>
                    <h3 style={{
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        color: '#fff',
                        marginBottom: '0.6rem',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        letterSpacing: '-0.3px',
                    }}>
                        {title}
                    </h3>
                    <p style={{
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: '0.9rem',
                        lineHeight: '1.5',
                        textShadow: '0 1px 5px rgba(0,0,0,0.5)',
                        margin: 0,
                    }}>
                        {desc}
                    </p>
                </div>

                {/* Border glow on hover */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px',
                    border: isHovered
                        ? '1.5px solid rgba(204,255,0,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                    transition: 'border 0.3s ease',
                    pointerEvents: 'none',
                }} />
            </div>
        </div>
    );

    if (link) {
        return (
            <div onClick={handleCardClick} style={{ color: 'inherit' }}>
                {cardContent}
            </div>
        );
    }
    return cardContent;
}

export default function Home() {
    const textRef = useRef<HTMLParagraphElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);
    const [cardsVisible, setCardsVisible] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
    const [carouselScrollProgress, setCarouselScrollProgress] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const [isLoggedIn] = useState(() => !!localStorage.getItem('campx_current_user'));

    useEffect(() => {
        const handleScroll = () => {
            if (!textRef.current) return;
            const rect = textRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const start = windowHeight * 0.85;
            const end = windowHeight * 0.4;

            const currentObjTop = rect.top;

            if (currentObjTop > start) {
                setScrollProgress(0);
            } else if (currentObjTop < end) {
                setScrollProgress(1);
            } else {
                const progress = (start - currentObjTop) / (start - end);
                setScrollProgress(progress);
            }

            // Check if carousel is in view
            if (carouselRef.current) {
                const carouselRect = carouselRef.current.getBoundingClientRect();
                if (carouselRect.top < windowHeight * 0.85) {
                    setCardsVisible(true);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Carousel scroll tracking
    const updateCarouselScroll = useCallback(() => {
        if (!carouselRef.current) return;
        const el = carouselRef.current;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
            setCarouselScrollProgress(el.scrollLeft / maxScroll);
            setCanScrollLeft(el.scrollLeft > 10);
            setCanScrollRight(el.scrollLeft < maxScroll - 10);
        } else {
            setCarouselScrollProgress(0);
            setCanScrollLeft(false);
            setCanScrollRight(false);
        }
    }, []);

    useEffect(() => {
        const el = carouselRef.current;
        if (!el) return;
        el.addEventListener('scroll', updateCarouselScroll);
        updateCarouselScroll();
        return () => el.removeEventListener('scroll', updateCarouselScroll);
    }, [updateCarouselScroll]);

    // Drag-to-scroll handlers
    const handleDragStart = useCallback((e: React.MouseEvent) => {
        if (!carouselRef.current) return;
        setIsDragging(true);
        setDragStart({ x: e.pageX, scrollLeft: carouselRef.current.scrollLeft });
        carouselRef.current.style.cursor = 'grabbing';
    }, []);

    const handleDragMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging || !carouselRef.current) return;
        e.preventDefault();
        const walk = (e.pageX - dragStart.x) * 1.5;
        carouselRef.current.scrollLeft = dragStart.scrollLeft - walk;
    }, [isDragging, dragStart]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        if (carouselRef.current) {
            carouselRef.current.style.cursor = 'grab';
        }
    }, []);

    const scrollCarousel = useCallback((direction: 'left' | 'right') => {
        if (!carouselRef.current) return;
        const scrollAmount = 320;
        carouselRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }, []);

    const headerText = "Why Choose CampX?";
    const paragraphText = "We have reimagined the digital college experience from the ground up. By centralizing scattered resources and utilizing a lightning-fast modern architecture, CampX eliminates administrative bottlenecks. Manage your attendance, download critical learning materials, and stay instantly updated on university announcements—all through one seamlessly unified, highly aesthetic interface. Experience what it means to be part of a truly connected campus.";

    const headerWords = headerText.split(" ");
    const paragraphWords = paragraphText.split(" ");
    const totalWords = headerWords.length + paragraphWords.length;

    const features = [
        { image: campusComplaintImg, title: "Campus Complaint", desc: "File and track issues directly with the college administration.", link: "/campus-complaint" },
        { image: lostFoundImg, title: "Lost & Found", desc: "A community board to report lost items or return found ones.", link: "/lost-and-found" },
        { image: digitalNotesImg, title: "Digital Notes", desc: "Access class materials, lecture slides, and study guides instantly.", link: "/notes" },
        { image: attendanceImg, title: "Attendance Tracking", desc: "Monitor your presence visually and stay above the required threshold.", link: "/attendance" },
        { image: pyqImg, title: "PYQ Archives", desc: "Filter and download past exam papers to boost your preparation.", link: "/pyq" },
        { image: academiaImg, title: "Academia Central", desc: "Student hub for sharing stationery, notes, and collaborating on projects.", link: "/academia-central" },
        { image: updatesImg, title: "College Updates", desc: "Real-time announcements and easy access to examination timetables.", link: "/college-updates" },
        { image: lightningImg, title: "Lightning Fast", desc: "Experience seamless, zero-delay navigation across the entire platform.", link: null }
    ];

    return (
        <div style={{ zIndex: 3, position: 'relative' }}>
            {/* Main Hero Content - Takes varying viewport height */}
            <main className="main-content" style={{ minHeight: '80vh', justifyContent: 'center', pointerEvents: 'auto', paddingBottom: '4rem', paddingTop: '10rem' }}>

                <h1 className="main-title fade-in-up delay-2">
                    Turn your ambition into a <br />stunning future
                </h1>

                <p className="main-desc fade-in-up delay-3">
                    CampX stands out with its potential to promote groundbreaking innovation. In many parts of the world, millions of people lack access to limitless educational opportunities—until now.
                </p>

                <div className="action-buttons fade-in-up delay-4" style={{ minHeight: '52px' }}>
                    {/* Apply Now button removed to restrict public access per request */}
                </div>
            </main>

            {/* Pros & Features Section */}
            <section style={{
                background: 'rgba(0, 0, 0, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--glass-border)',
                padding: '10rem 2rem 6rem 2rem',
                position: 'relative',
                zIndex: 10,
                color: 'white',
                minHeight: '100vh'
            }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    {/* Scroll-illuminated text */}
                    <div ref={textRef} style={{ marginBottom: '8rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '1000px', margin: '0 auto 8rem auto' }}>
                        <h2 className="main-title" style={{ fontFamily: "'Instrument Serif', serif", fontSize: '4.5rem', marginBottom: '1.5rem', textShadow: 'none', fontWeight: 'normal', textAlign: 'left' }}>
                            {headerWords.map((word, i) => {
                                const threshold = i / totalWords;
                                const isHighlighted = scrollProgress > threshold;
                                return (
                                    <span key={i} style={{
                                        color: isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                        transition: 'color 0.4s ease',
                                        marginRight: '1rem',
                                        display: 'inline-block'
                                    }}>
                                        {word}
                                    </span>
                                );
                            })}
                        </h2>
                        <p style={{
                            fontFamily: "'Instrument Serif', serif",
                            fontSize: 'clamp(2rem, 4vw, 3rem)',
                            lineHeight: '1.4',
                            textAlign: 'left',
                            fontWeight: '100',
                            margin: 0
                        }}>
                            {paragraphWords.map((word, i) => {
                                const threshold = (headerWords.length + i) / totalWords;
                                const isHighlighted = scrollProgress > threshold;
                                return (
                                    <span key={i} style={{
                                        color: isHighlighted ? '#ffffff' : 'rgba(255,255,255,0.15)',
                                        transition: 'color 0.4s ease',
                                        marginRight: '0.4rem',
                                        display: 'inline-block'
                                    }}>
                                        {word}
                                    </span>
                                );
                            })}
                        </p>
                    </div>

                    {/* 3D Cards Section Title */}
                    <div style={{ marginBottom: '4rem' }}>
                        <h2 style={{
                            fontFamily: "'Instrument Serif', serif",
                            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                            fontWeight: 'normal',
                            color: '#fff',
                            letterSpacing: '-1px',
                            lineHeight: '1.2',
                        }}>
                            Selected and popular<br />
                            features on the platform<br />
                            <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>right now</span>
                        </h2>
                    </div>

                    {/* 3D Card Carousel */}
                    <div style={{ position: 'relative' }}>
                        {/* Left Arrow */}
                        {canScrollLeft && (
                            <button
                                onClick={() => scrollCarousel('left')}
                                style={{
                                    position: 'absolute',
                                    left: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 20,
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'rgba(204,255,0,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(204,255,0,0.3)',
                                    color: '#ccff00',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,255,0,0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(204,255,0,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                        )}

                        {/* Right Arrow */}
                        {canScrollRight && (
                            <button
                                onClick={() => scrollCarousel('right')}
                                style={{
                                    position: 'absolute',
                                    right: '-20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    zIndex: 20,
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'rgba(204,255,0,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(204,255,0,0.3)',
                                    color: '#ccff00',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,255,0,0.3)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(204,255,0,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                            >
                                <ChevronRight size={24} />
                            </button>
                        )}

                        <div
                            ref={carouselRef}
                            className="cards-3d-carousel"
                            onMouseDown={handleDragStart}
                            onMouseMove={handleDragMove}
                            onMouseUp={handleDragEnd}
                            onMouseLeave={handleDragEnd}
                            style={{
                                display: 'flex',
                                gap: '1.5rem',
                                alignItems: 'center',
                                padding: '4rem 2rem',
                                perspective: '1200px',
                                perspectiveOrigin: '50% 50%',
                                overflowX: 'auto',
                                overflowY: 'visible',
                                scrollbarWidth: 'none',
                                flexWrap: 'nowrap',
                                minHeight: '520px',
                                cursor: 'grab',
                                userSelect: isDragging ? 'none' : 'auto',
                            }}
                        >
                            {features.map((f, i) => (
                                <div
                                    key={i}
                                    style={{
                                        opacity: cardsVisible ? 1 : 0,
                                        transform: cardsVisible ? 'translateY(0)' : 'translateY(80px)',
                                        transition: `opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.1}s, transform 0.8s cubic-bezier(0.23, 1, 0.32, 1) ${i * 0.1}s`,
                                        pointerEvents: isDragging ? 'none' : 'auto',
                                    }}
                                >
                                    <Card3D
                                        image={f.image}
                                        title={f.title}
                                        desc={f.desc}
                                        link={f.link}
                                        index={i}
                                        totalCards={features.length}
                                        isLoggedIn={isLoggedIn}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Scroll Progress Bar */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem',
                            marginTop: '2rem',
                        }}>
                            <div style={{
                                width: '200px',
                                height: '3px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    width: `${Math.max(20, carouselScrollProgress * 100)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #ccff00, #88cc00)',
                                    borderRadius: '2px',
                                    transition: 'width 0.15s ease-out',
                                    boxShadow: '0 0 8px rgba(204,255,0,0.4)',
                                }} />
                            </div>
                            <span style={{
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '0.8rem',
                                fontFamily: "'Inter', sans-serif",
                                letterSpacing: '1px',
                            }}>
                                DRAG OR SCROLL →
                            </span>
                        </div>
                    </div>

                    {/* CRED-style Bottom Section */}
                    <div style={{ marginTop: '15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', textAlign: 'left', paddingBottom: '4rem', flexWrap: 'wrap', gap: '3rem' }}>
                        <div>
                            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(4rem, 7vw, 6rem)', lineHeight: '1.1', margin: '0', color: '#fff', fontWeight: 'normal', letterSpacing: '-1px' }}>
                                upgrade your life.<br />bit by bit.
                            </h2>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', border: '1px solid rgba(255,255,255,0.2)', padding: '1rem 1.5rem', borderRadius: '4px', background: 'rgba(0,0,0,0.5)' }}>
                            <div style={{ width: '60px', height: '60px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', width: '100%', height: '100%' }}>
                                    {Array.from({ length: 25 }).map((_, i) => (
                                        <div key={i} style={{ background: [0, 2, 4, 10, 12, 14, 20, 22, 24, 1, 7, 8, 11, 16, 17, 19].includes(i) ? '#000' : 'transparent' }}></div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ color: '#fff', fontSize: '1.1rem', fontFamily: "'Inter', sans-serif", lineHeight: '1.4' }}>
                                download<br /><strong>CampX</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ====== SUPPORT / CONTACT SECTION ====== */}
            <SupportSection />

            {/* Footer */}
            <footer className="footer-logos" style={{
                zIndex: 10,
                pointerEvents: 'auto',
                background: 'rgba(0,0,0,0.95)',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '3rem 2rem',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.4rem', fontWeight: '500', letterSpacing: '0.5px' }}>
                        CampX | A Platform by Nischay Bahl
                    </div>
                    <button
                        onClick={() => document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth' })}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(204,255,0,0.1)', border: '1px solid rgba(204,255,0,0.3)',
                            color: '#ccff00', padding: '0.6rem 1.4rem', borderRadius: '2rem',
                            fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.3s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(204,255,0,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(204,255,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Headphones size={16} /> Support
                    </button>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', fontStyle: 'italic' }}>
                    Where technology meets the future of campus life.
                </div>
            </footer>
        </div>
    );
}

// ====== SUPPORT SECTION COMPONENT ======
function SupportSection() {
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [isSending, setIsSending] = useState(false);
    const [sendSuccess, setSendSuccess] = useState(false);
    const [sendError, setSendError] = useState('');
    const [showSupportModal, setShowSupportModal] = useState(false);

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSendError('');
        setIsSending(true);

        // Store query in local storage for Admin to read
        const messages = JSON.parse(localStorage.getItem('campx_support_messages') || '[]');
        messages.push({ ...contactForm, timestamp: new Date().toISOString() });
        localStorage.setItem('campx_support_messages', JSON.stringify(messages));
        
        setIsSending(false);
        setSendSuccess(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setSendSuccess(false), 5000);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '0.9rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px', color: '#fff', fontSize: '0.95rem',
        outline: 'none', transition: 'border-color 0.3s, box-shadow 0.3s',
        fontFamily: "'Inter', sans-serif",
    };

    return (
        <>
            <section
                id="support-section"
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(10,10,20,0.98) 100%)',
                    borderTop: '1px solid rgba(204,255,0,0.1)',
                    padding: '6rem 2rem',
                    position: 'relative',
                    zIndex: 10,
                    overflow: 'hidden',
                    pointerEvents: 'auto',
                }}
            >
                {/* Decorative glow */}
                <div style={{
                    position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '300px',
                    background: 'radial-gradient(ellipse, rgba(204,255,0,0.06) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
                    {/* Section Header */}
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(204,255,0,0.08)', border: '1px solid rgba(204,255,0,0.2)',
                            borderRadius: '2rem', padding: '0.4rem 1.2rem', marginBottom: '1.5rem',
                            fontSize: '0.85rem', color: '#ccff00', fontWeight: '600',
                        }}>
                            <Headphones size={14} /> Support Center
                        </div>
                        <h2 style={{
                            fontFamily: "'Instrument Serif', serif",
                            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                            fontWeight: 'normal', color: '#fff',
                            letterSpacing: '-1px', lineHeight: '1.2',
                            marginBottom: '1rem',
                        }}>
                            Need Help? <span style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>We're here.</span>
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
                            Reach out to us anytime. We'd love to hear from you.
                        </p>
                    </div>

                    {/* Content Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '2.5rem',
                        alignItems: 'start',
                    }}>
                        {/* Left: Contact Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Phone card */}
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px', padding: '1.8rem',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(123,97,255,0.2))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Phone size={22} color="#00d4ff" />
                                    </div>
                                    <div>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone</p>
                                        <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '600' }}>911103350</p>
                                    </div>
                                </div>
                            </div>

                            {/* Email card */}
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px', padding: '1.8rem',
                                transition: 'all 0.3s',
                                cursor: 'pointer',
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                                    <div style={{
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        background: 'linear-gradient(135deg, rgba(204,255,0,0.2), rgba(168,230,0,0.2))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Mail size={22} color="#ccff00" />
                                    </div>
                                    <div>
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</p>
                                        <p style={{ color: '#fff', fontSize: '1rem', fontWeight: '600' }}>nischay.bahl.11681@gmail.com</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick support badge */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgba(204,255,0,0.05), rgba(204,255,0,0.02))',
                                border: '1px solid rgba(204,255,0,0.15)',
                                borderRadius: '20px', padding: '1.5rem',
                                textAlign: 'center',
                            }}>
                                <MessageSquare size={28} color="#ccff00" style={{ marginBottom: '0.8rem' }} />
                                <p style={{ color: '#fff', fontSize: '1rem', fontWeight: '600', marginBottom: '0.4rem' }}>Quick Response</p>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>We typically respond within 24 hours</p>
                            </div>
                        </div>

                        {/* Right: Contact Form */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '24px', padding: '2.5rem',
                        }}>
                            <h3 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: '700', marginBottom: '0.4rem' }}>Send us a message</h3>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
                                Fill out the form and we'll get back to you.
                            </p>

                            {sendSuccess && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.3)',
                                    borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.2rem',
                                    color: '#34c759', fontSize: '0.85rem',
                                    animation: 'slideDown 0.3s ease-out',
                                }}>
                                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                                    Message sent successfully! We'll get back to you soon.
                                </div>
                            )}

                            {sendError && (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
                                    borderRadius: '12px', padding: '0.8rem 1rem', marginBottom: '1.2rem',
                                    color: '#ff6b6b', fontSize: '0.85rem',
                                }}>
                                    <X size={16} style={{ flexShrink: 0 }} />
                                    {sendError}
                                </div>
                            )}

                            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <input
                                    type="text" placeholder="Your name" required
                                    value={contactForm.name}
                                    onChange={(e) => setContactForm(p => ({ ...p, name: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(204,255,0,0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <input
                                    type="email" placeholder="Your email" required
                                    value={contactForm.email}
                                    onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))}
                                    style={inputStyle}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(204,255,0,0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <textarea
                                    placeholder="Your message" required rows={5}
                                    value={contactForm.message}
                                    onChange={(e) => setContactForm(p => ({ ...p, message: e.target.value }))}
                                    style={{
                                        ...inputStyle,
                                        resize: 'vertical',
                                        minHeight: '120px',
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(204,255,0,0.5)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(204,255,0,0.1)'; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                />
                                <button
                                    type="submit"
                                    disabled={isSending}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        background: 'var(--accent)', color: '#000',
                                        padding: '0.9rem', borderRadius: '12px',
                                        fontSize: '1rem', fontWeight: '600', border: 'none',
                                        cursor: isSending ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s', marginTop: '0.5rem',
                                        opacity: isSending ? 0.7 : 1,
                                    }}
                                    onMouseEnter={(e) => { if (!isSending) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(204, 255, 0, 0.4)'; } }}
                                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                >
                                    <Send size={18} />
                                    {isSending ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* Floating Support Button */}
            <button
                onClick={() => setShowSupportModal(!showSupportModal)}
                style={{
                    position: 'fixed', bottom: '2rem', right: '2rem',
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ccff00, #88cc00)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 30px rgba(204,255,0,0.3)',
                    transition: 'all 0.3s',
                    zIndex: 1000,
                    animation: 'pulse-glow 2s ease-in-out infinite',
                    pointerEvents: 'auto',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(204,255,0,0.5)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(204,255,0,0.3)'; }}
            >
                {showSupportModal ? <X size={24} color="#000" /> : <Headphones size={24} color="#000" />}
            </button>

            {/* Floating Support Quick Card */}
            {showSupportModal && (
                <div style={{
                    position: 'fixed', bottom: '5.5rem', right: '2rem',
                    width: '320px',
                    background: 'rgba(15,15,20,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(204,255,0,0.2)',
                    borderRadius: '20px', padding: '1.8rem',
                    zIndex: 999,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                    animation: 'slideUp 0.3s ease-out',
                    pointerEvents: 'auto',
                }}>
                    <h4 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.3rem' }}>Need Help?</h4>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1.2rem' }}>Get in touch with our support team.</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#fff', fontSize: '0.9rem' }}>
                            <Phone size={16} color="#00d4ff" /> <span>911103350</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#fff', fontSize: '0.85rem' }}>
                            <Mail size={16} color="#ccff00" /> <span>nischay.bahl.11681@gmail.com</span>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            setShowSupportModal(false);
                            document.getElementById('support-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            background: 'var(--accent)', color: '#000',
                            padding: '0.7rem', borderRadius: '12px',
                            fontSize: '0.9rem', fontWeight: '600', border: 'none',
                            cursor: 'pointer', transition: 'all 0.3s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                        <Send size={15} /> Send a Message
                    </button>
                </div>
            )}
        </>
    );
}
