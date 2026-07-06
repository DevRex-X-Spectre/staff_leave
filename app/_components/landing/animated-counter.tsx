'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * AnimatedCounter — eases from 0 to `value` when the element enters
 * the viewport. Uses an exponential ease-out for that classic
 * "count up" feel.
 */
export function AnimatedCounter({
  value,
  suffix = '',
  prefix = '',
  className,
  duration = 1200,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setDisplay(value);
      setDone(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            const start = performance.now();
            const tick = (now: number) => {
              const t = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
              setDisplay(Math.round(eased * value));
              if (t < 1) {
                requestAnimationFrame(tick);
              } else {
                setDone(true);
              }
            };
            requestAnimationFrame(tick);
            break;
          }
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span
      ref={ref}
      className={cn(
        'tabular-nums',
        done ? '' : 'transition-colors',
        className
      )}
    >
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
