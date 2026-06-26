import { cn } from '@/lib/utils';
import type { LeaveStatus } from '@/types';

/* -------------------------------------------------------------------------
   StatusBadge — Cal.com-style pill for leave application status.
   ------------------------------------------------------------------------- */
const STATUS_CONFIG: Record<
  LeaveStatus,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className:
      'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning)]/20',
  },
  hod_approved: {
    label: 'HOD Approved',
    className:
      'bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info)]/20',
  },
  approved: {
    label: 'Approved',
    className:
      'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/20',
  },
  hod_rejected: {
    label: 'HOD Rejected',
    className:
      'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20',
  },
  rejected: {
    label: 'Rejected',
    className:
      'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger)]/20',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]',
  },
};

export function StatusBadge({ status }: { status: LeaveStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-[12px] font-medium tracking-tight',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

/* -------------------------------------------------------------------------
   RoleBadge
   ------------------------------------------------------------------------- */
const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  admin: {
    label: 'Admin',
    className: 'bg-[var(--ink)] text-white',
  },
  hod: {
    label: 'HOD',
    className: 'bg-[var(--color-action-blue)] text-white',
  },
  hr_manager: {
    label: 'HR',
    className: 'bg-[var(--info-bg)] text-[var(--info)] border border-[var(--info)]/20',
  },
  staff: {
    label: 'Staff',
    className: 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
  },
};

export function RoleBadge({ role }: { role: string }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG.staff;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-[11px] font-semibold tracking-wide uppercase',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Generic Badge
   ------------------------------------------------------------------------- */
export function Badge({
  children,
  variant = 'subtle',
  className,
}: {
  children: React.ReactNode;
  variant?: 'subtle' | 'solid' | 'outline';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-[12px] font-medium tracking-tight',
        variant === 'solid' && 'bg-[var(--ink)] text-white',
        variant === 'subtle' &&
          'bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]',
        variant === 'outline' &&
          'bg-transparent border border-[var(--border-subtle)] text-[var(--text-secondary)]',
        className
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------
   Approval Request Status Badge
   ------------------------------------------------------------------------- */
export function RequestStatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected';
}) {
  const config =
    status === 'pending'
      ? { label: 'Pending', className: 'bg-[var(--warning-bg)] text-[var(--warning)]' }
      : status === 'approved'
      ? { label: 'Approved', className: 'bg-[var(--success-bg)] text-[var(--success)]' }
      : { label: 'Rejected', className: 'bg-[var(--danger-bg)] text-[var(--danger)]' };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium tracking-tight',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
