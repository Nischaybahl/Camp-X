import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  life: number;
  maxLife: number;
}

/**
 * Mounts a full-screen canvas overlay (fixed, pointer-events: none, z-index: 9999)
 * and renders a glowing teal/cyan particle trail that follows the mouse cursor.
 */
export function useParticleTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    // ── Create canvas ──────────────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.style.cssText = [
      'position:fixed',
      'top:0',
      'left:0',
      'width:100vw',
      'height:100vh',
      'pointer-events:none',
      'z-index:9999',
    ].join(';');
    document.body.appendChild(canvas);
    canvasRef.current = canvas;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Spawn particles on mousemove ───────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      for (let i = 0; i < 3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.2 + 0.3;
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1.5, // 1.5–5px
          hue: Math.random() * 60 + 160,   // 160–220 teal/cyan
          life: 45,
          maxLife: 45,
        });
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Animation loop ─────────────────────────────────────────────────────────
    const ctx = canvas.getContext('2d')!;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => p.life > 0);

      for (const p of particlesRef.current) {
        const alpha = p.life / p.maxLife;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsl(${p.hue}, 100%, 60%)`;
        ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03; // subtle gravity drift
        p.life -= 1;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', resize);
      canvas.remove();
    };
  }, []);
}
