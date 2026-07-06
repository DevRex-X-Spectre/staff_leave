'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Reveal — fades + lifts the wrapped content on mount and (optionally)
 * re-plays the animation when it scrolls into view.
 *
 * IMPORTANT: this component NEVER leaves content invisible. If JS is
 * disabled or the IntersectionObserver fails, the content is still
 * visible because the animation has `both` fill mode and we apply the
 * animated class from the very first render.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: As = 'div',
  replay = false,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'header' | 'span';
  /** If true, the animation re-plays every time the element re-enters view. */
  replay?: boolean;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Always show after first paint.
    setVisible(true);

    if (!replay || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Replay the animation by removing + re-adding the class.
            el.classList.remove('animate-fade-up');
            // Force reflow so the animation re-triggers.
            void (el as HTMLElement).offsetWidth;
            el.classList.add('animate-fade-up');
          }
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [replay]);

  const Component = As as 'div';
  return (
    <Component
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn('animate-fade-up', className)}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Component>
  );
}
