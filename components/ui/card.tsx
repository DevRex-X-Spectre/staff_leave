import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------
   Card - 12px radius, white background, subtle shadow. No border.
   Optional hoverable variant lifts to the Cal.com hover shadow.
   ------------------------------------------------------------------------- */
export function Card({
  children,
  className,
  padding = true,
  hoverable = false,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  hoverable?: boolean;
}) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm-4)]',
        'transition-shadow duration-200',
        hoverable && 'hover:shadow-[var(--shadow-sm)] cursor-pointer',
        padding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4', className)}>{children}</div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        'text-[18px] font-semibold text-[var(--text-primary)] tracking-tight',
        className
      )}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn('text-[13px] text-[var(--text-secondary)] mt-0.5', className)}>
      {children}
    </p>
  );
}