import { useEffect, useRef } from 'react';

interface ScrollRevealOptions {
  /** IntersectionObserver threshold (default 0.15) */
  threshold?: number;
  /** Base transition duration (default '0.8s ease') */
  duration?: string;
  /** translateY distance to start from (default '40px') */
  translateY?: string;
  /** Stagger delay increment per child in ms (default 150) */
  staggerMs?: number;
}

/**
 * Applies a scroll-triggered reveal animation to every element that has the
 * `data-reveal` attribute (or a custom selector you pass) on the page.
 *
 * Children of a reveal element receive staggered transition-delay values based
 * on their index among siblings.
 *
 * Call this hook once at the top-level of a page component. It sets up an
 * IntersectionObserver that removes the `reveal-hidden` class when the element
 * scrolls into view.
 *
 * Add `data-reveal` to any section/div you want to animate, and add
 * `data-reveal-children` to have its direct children staggered automatically.
 */
export function useScrollReveal({
  threshold = 0.15,
  duration = '0.8s',
  translateY = '40px',
  staggerMs = 150,
}: ScrollRevealOptions = {}) {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Inject base styles once
    const styleId = 'scroll-reveal-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        [data-reveal] {
          opacity: 0;
          transform: translateY(${translateY});
          transition: opacity ${duration} ease, transform ${duration} ease;
          will-change: opacity, transform;
        }
        [data-reveal].reveal-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        [data-reveal-children] > * {
          opacity: 0;
          transform: translateY(${translateY});
          will-change: opacity, transform;
        }
        [data-reveal-children].reveal-visible > * {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    }

    const targets = document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-children]');

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target as HTMLElement;
          el.classList.add('reveal-visible');

          // Stagger direct children if requested
          if (el.hasAttribute('data-reveal-children')) {
            const children = Array.from(el.children) as HTMLElement[];
            children.forEach((child, i) => {
              child.style.transition = `opacity ${duration} ease ${i * staggerMs}ms, transform ${duration} ease ${i * staggerMs}ms`;
            });
          }

          observerRef.current?.unobserve(el);
        });
      },
      { threshold }
    );

    targets.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, duration, translateY, staggerMs]);
}
