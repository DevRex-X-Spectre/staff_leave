import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/* -------------------------------------------------------------------------
   StatCard — summary card used on dashboard overview pages.
   ------------------------------------------------------------------------- */
export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-[var(--bg-card)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)]',
        'flex items-start justify-between gap-4',
        className
      )}
    >
      <div>
        <p className="text-[13px] text-[var(--text-secondary)] font-medium tracking-tight">
          {label}
        </p>
        <p className="text-[28px] font-semibold text-[var(--text-primary)] mt-1 leading-none">
          {value}
        </p>
        {(trendLabel || trend) && (
          <p
            className={cn(
              'text-[12px] mt-2 font-medium',
              trend === 'up' && 'text-[var(--success)]',
              trend === 'down' && 'text-[var(--danger)]',
              trend === 'neutral' && 'text-[var(--text-tertiary)]',
              !trend && 'text-[var(--text-tertiary)]'
            )}
          >
            {trend === 'up' && '↑ '}
            {trend === 'down' && '↓ '}
            {trendLabel}
          </p>
        )}
      </div>
      {Icon && (
        <div className="p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)] shrink-0">
          <Icon
            size={20}
            className="text-[var(--text-secondary)]"
            strokeWidth={1.5}
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Skeleton — placeholder while data loads.
   ------------------------------------------------------------------------- */
export function Skeleton({
  className,
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={cn('skeleton rounded-[var(--radius-md)]', className)}
      style={{ width, height: height ?? '1em' }}
    />
  );
}

/* -------------------------------------------------------------------------
   EmptyState — friendly placeholder for empty tables/lists.
   ------------------------------------------------------------------------- */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className
      )}
    >
      {Icon && (
        <div className="p-4 bg-[var(--bg-subtle)] rounded-full mb-4">
          <Icon
            size={28}
            strokeWidth={1.5}
            className="text-[var(--text-tertiary)]"
          />
        </div>
      )}
      <h3 className="text-[16px] font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[var(--text-secondary)] mt-1 max-w-xs">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------
   ProgressBar — used in leave balance cards.
   ------------------------------------------------------------------------- */
export function ProgressBar({
  value,
  max,
  color = 'var(--ink)',
  className,
}: {
  value: number;
  max: number;
  color?: string;
  className?: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div
      className={cn(
        'w-full h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden',
        className
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------
   PageHeader — consistent page title block.
   ------------------------------------------------------------------------- */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 mb-6',
        'flex-col sm:flex-row',
        className
      )}
    >
      <div>
        <h1 className="text-[20px] font-semibold text-[var(--text-primary)] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </div>
  );
}
