import { useEffect, useRef, type CSSProperties } from 'react';

interface Orb {
  size: number;        // px diameter
  top: string;
  left: string;
  color: string;       // radial-gradient colours
  duration: number;    // animation duration seconds
  delay: number;       // animation delay seconds
  parallaxFactor: number; // multiplier for scroll parallax
}

const ORBS: Orb[] = [
  {
    size: 520,
    top: '-10%',
    left: '60%',
    color: 'rgba(0, 220, 200, 0.18), transparent',
    duration: 18,
    delay: 0,
    parallaxFactor: 0.25,
  },
  {
    size: 400,
    top: '30%',
    left: '-8%',
    color: 'rgba(0, 180, 255, 0.14), transparent',
    duration: 22,
    delay: 3,
    parallaxFactor: 0.35,
  },
  {
    size: 340,
    top: '60%',
    left: '70%',
    color: 'rgba(80, 230, 180, 0.12), transparent',
    duration: 15,
    delay: 6,
    parallaxFactor: 0.2,
  },
  {
    size: 300,
    top: '80%',
    left: '20%',
    color: 'rgba(0, 150, 220, 0.10), transparent',
    duration: 20,
    delay: 9,
    parallaxFactor: 0.3,
  },
];

/**
 * Renders 3–4 large blurred radial-gradient orbs behind your hero content
 * with a slow floating animation and subtle scroll-based parallax.
 *
 * Mount this component as the FIRST child inside your hero wrapper at z-index –1
 * so it doesn't interfere with content.
 */
export default function FloatingOrbs() {
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll parallax listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      orbRefs.current.forEach((el, i) => {
        if (!el) return;
        const factor = ORBS[i].parallaxFactor;
        // Combine the CSS float animation translateY with parallax offset via a
        // CSS custom property so we don't overwrite the keyframe animation.
        el.style.setProperty('--parallax-y', `${scrollY * factor}px`);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {ORBS.map((orb, i) => {
        const style: CSSProperties & { [key: string]: string | number } = {
          position: 'fixed',
          top: orb.top,
          left: orb.left,
          width: `${orb.size}px`,
          height: `${orb.size}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle at center, ${orb.color})`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
          // Use CSS custom property for parallax offset + keyframe float
          transform: 'translateY(calc(var(--parallax-y, 0px)))',
          animation: `orbFloat ${orb.duration}s ease-in-out ${orb.delay}s infinite alternate`,
          willChange: 'transform',
        };

        return (
          <div
            key={i}
            ref={(el) => { orbRefs.current[i] = el; }}
            style={style}
          />
        );
      })}
    </>
  );
}
