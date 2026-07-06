/**
 * Marquee — continuous horizontal scroll. Pure CSS, pauses on hover.
 * Children are duplicated so the second copy seamlessly follows.
 */
export function Marquee({
  children,
  className,
  speed = 'normal',
}: {
  children: React.ReactNode;
  className?: string;
  speed?: 'normal' | 'fast';
}) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ''}`}
      style={{
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        maskImage:
          'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div
        className={`flex w-max gap-3 ${
          speed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee'
        }`}
        style={{ animationPlayState: 'running' }}
      >
        <div className="flex shrink-0 gap-3">{children}</div>
        <div className="flex shrink-0 gap-3" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
