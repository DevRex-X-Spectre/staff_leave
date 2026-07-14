import { cn } from '@/lib/utils';
import { Check, X, Clock, ArrowRight } from 'lucide-react';
import type { LeaveStatus } from '@/types';

type Step = {
  label: string;
  key: LeaveStatus | 'submitted';
  icon: React.ReactNode;
  isComplete: boolean;
  isCurrent: boolean;
  isRejected: boolean;
};

function StatusIcon({
  isComplete,
  isRejected,
  isPending,
}: {
  isComplete: boolean;
  isRejected: boolean;
  isPending: boolean;
}) {
  const base =
    'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ease-out relative';
  const ring = 'before:absolute before:inset-[-6px] before:rounded-full before:transition-all before:duration-300';

  if (isComplete) {
    return (
      <div
        className={cn(
          base,
          ring,
          'bg-[var(--success)] text-white shadow-[0_0_0_1px_rgba(16,185,129,0.12)]',
          'before:bg-[rgba(16,185,129,0.12)] before:scale-100'
        )}
      >
        <Check size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  }

  if (isRejected) {
    return (
      <div
        className={cn(
          base,
          ring,
          'bg-[var(--danger)] text-white shadow-[0_0_0_1px_rgba(239,68,68,0.12)]',
          'before:bg-[rgba(239,68,68,0.12)] before:scale-100'
        )}
      >
        <X size={14} className="text-white" strokeWidth={2.5} />
      </div>
    );
  }

  if (isPending) {
    return (
      <div
        className={cn(
          base,
          ring,
          'border-2 border-[var(--warning)] bg-[var(--warning-bg)] text-[var(--warning)]',
          'shadow-[0_0_0_1px_rgba(245,158,11,0.12)]',
          'before:bg-[rgba(245,158,11,0.12)] before:scale-100'
        )}
      >
        <Clock size={12} className="text-[var(--warning)]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        base,
        ring,
        'border-2 border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-tertiary)]',
        'before:bg-[rgba(148,163,184,0.10)] before:scale-100'
      )}
    >
      <div className="w-2 h-2 rounded-full bg-[var(--border-subtle)]" />
    </div>
  );
}

/**
 * LeaveTracker - stepper showing the multi-gate approval flow:
 * Submitted -> HOD Review -> Registrar Review -> Final Decision
 *
 * Used in the staff "My Leave History" drawer.
 */
export function LeaveTracker({ status }: { status: LeaveStatus }) {
  const isRejected =
    status === 'hod_rejected' || status === 'rejected' || status === 'cancelled';

  const steps: Step[] = [
    {
      label: 'Submitted',
      key: 'submitted',
      icon: <Clock size={13} />,
      isComplete: true,
      isCurrent: false,
      isRejected: false,
    },
    {
      label: 'HOD Review',
      key: 'pending',
      icon: <Clock size={13} />,
      isComplete: status === 'hod_approved' || status === 'approved',
      isCurrent: status === 'pending',
      isRejected: status === 'hod_rejected' || isRejected,
    },
    {
      label: 'Registrar Review',
      key: 'hod_approved',
      icon: <Clock size={13} />,
      isComplete: status === 'approved',
      isCurrent: status === 'hod_approved',
      isRejected: status === 'rejected',
    },
    {
      label: status === 'approved' ? 'Approved' : isRejected ? 'Rejected' : 'Final Decision',
      key: status,
      icon: status === 'approved' ? <Check size={13} /> : isRejected ? <X size={13} /> : <ArrowRight size={13} />,
      isComplete: status === 'approved',
      isCurrent: !isRejected && status !== 'approved',
      isRejected,
    },
  ];

  return (
    <div className="w-full overflow-hidden px-1 sm:px-2 py-1">
      <div className="mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-4 gap-x-1 sm:gap-x-2 items-start">
          {steps.map((step, i) => (
            <div key={step.label} className="relative flex flex-col items-center min-w-0 text-center">
              <div className="relative z-10 flex items-center justify-center h-10 sm:h-12 w-full">
                <StatusIcon
                  isComplete={step.isComplete}
                  isRejected={step.isRejected}
                  isPending={step.isCurrent}
                />
              </div>

              {i < steps.length - 1 && (
                <div className="absolute top-5 sm:top-6 left-[calc(50%+14px)] right-[calc(-50%+14px)] h-0.5 overflow-hidden">
                  <div
                    className={cn(
                      'h-full w-full origin-left transition-transform duration-500 ease-out',
                      step.isComplete && !step.isRejected ? 'bg-[var(--success)] scale-x-100' : 'bg-[var(--border-subtle)] scale-x-100'
                    )}
                  />
                </div>
              )}

              <p
                className={cn(
                  'mt-1.5 text-[10px] sm:text-[11px] md:text-[12px] font-medium leading-tight break-words whitespace-normal max-w-full transition-colors duration-300',
                  step.isCurrent && !step.isRejected && 'text-[var(--warning)]',
                  step.isRejected && step.isCurrent && 'text-[var(--danger)]',
                  step.isComplete && !step.isRejected && 'text-[var(--success)]',
                  !step.isCurrent && !step.isComplete && 'text-[var(--text-tertiary)]'
                )}
              >
                {step.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
