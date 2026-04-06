import { useRef, useCallback, type RefObject } from 'react';

interface TiltOptions {
  maxDeg?: number;          // maximum tilt angle in degrees (default 12)
  perspective?: number;     // CSS perspective in px            (default 900)
  resetDuration?: number;   // transition duration on leave (ms) (default 600)
}

/**
 * Returns a ref to attach to the element that should tilt, plus the three
 * mouse handlers (onMouseMove, onMouseLeave, onMouseEnter).
 *
 * Usage:
 *   const { ref, onMouseMove, onMouseLeave, onMouseEnter } = useTilt();
 *   <div ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} onMouseEnter={onMouseEnter}>…</div>
 */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
  maxDeg = 12,
  perspective = 900,
  resetDuration = 600,
}: TiltOptions = {}): {
  ref: RefObject<T>;
  onMouseMove: (e: React.MouseEvent<T>) => void;
  onMouseLeave: () => void;
  onMouseEnter: () => void;
} {
  const ref = useRef<T>(null!);

  const onMouseEnter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.1s ease, box-shadow 0.1s ease';
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / (rect.width / 2);   // -1 to +1
      const dy = (e.clientY - cy) / (rect.height / 2);  // -1 to +1

      const rotateY = dx * maxDeg;
      const rotateX = -dy * maxDeg;

      // Shadow shifts opposite to tilt direction
      const shadowX = -dx * 20;
      const shadowY = -dy * 20;

      el.style.transition = 'transform 0.05s ease, box-shadow 0.05s ease';
      el.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      el.style.boxShadow = `${shadowX}px ${shadowY}px 40px rgba(0,200,180,0.18), 0 8px 32px rgba(0,0,0,0.4)`;
    },
    [maxDeg, perspective]
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = `transform ${resetDuration}ms ease, box-shadow ${resetDuration}ms ease`;
    el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`;
    el.style.boxShadow = '';
  }, [perspective, resetDuration]);

  return { ref, onMouseMove, onMouseLeave, onMouseEnter };
}
