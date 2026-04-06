import { useState, useEffect, useRef } from 'react';

interface TypewriterOptions {
  phrases: string[];
  typeSpeed?: number;   // ms per character while typing   (default 80)
  deleteSpeed?: number; // ms per character while deleting (default 40)
  pauseMs?: number;     // pause after phrase is complete  (default 1800)
}

/**
 * Returns the currently-visible text slice plus a boolean `showCursor`.
 * The cursor blink itself is handled via CSS (`.typewriter-cursor`).
 */
export function useTypewriter({
  phrases,
  typeSpeed = 80,
  deleteSpeed = 40,
  pauseMs = 1800,
}: TypewriterOptions) {
  const [displayed, setDisplayed] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = phrases[phraseIndex];

    const tick = () => {
      setDisplayed((prev) => {
        if (!isDeleting) {
          // Typing forward
          const next = current.slice(0, prev.length + 1);
          if (next === current) {
            // Fully typed — pause then start deleting
            timeoutRef.current = setTimeout(() => setIsDeleting(true), pauseMs);
          } else {
            timeoutRef.current = setTimeout(tick, typeSpeed);
          }
          return next;
        } else {
          // Deleting
          const next = current.slice(0, prev.length - 1);
          if (next === '') {
            // Fully deleted — move to next phrase
            setIsDeleting(false);
            setPhraseIndex((i) => (i + 1) % phrases.length);
          } else {
            timeoutRef.current = setTimeout(tick, deleteSpeed);
          }
          return next;
        }
      });
    };

    timeoutRef.current = setTimeout(tick, isDeleting ? deleteSpeed : typeSpeed);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phraseIndex, isDeleting]);

  return displayed;
}
