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
  if (isComplete) {
    return (
      <div className="w-6 h-6 rounded-full bg-[var(--success)] flex items-center justify-center">
        <Check size={13} className="text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (isRejected) {
    return (
      <div className="w-6 h-6 rounded-full bg-[var(--danger)] flex items-center justify-center">
        <X size={13} className="text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className="w-6 h-6 rounded-full border-2 border-[var(--warning)] flex items-center justify-center">
        <Clock size={11} className="text-[var(--warning)]" />
      </div>
    );
  }
  // Future step
  return (
    <div className="w-6 h-6 rounded-full border-2 border-[var(--border-subtle)] flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-[var(--border-subtle)]" />
    </div>
  );
}

/**
 * LeaveTracker â€” stepper showing the multi-gate approval flow:
 * Submitted â†’ HOD Review â†’ Registrar Review â†’ Final Decision
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
    <div className="flex items-start gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start">
          {/* Step node */}
          <div className="flex flex-col items-center">
            <StatusIcon
              isComplete={step.isComplete}
              isRejected={step.isRejected}
              isPending={step.isCurrent}
            />
            <p
              className={cn(
                'mt-2 text-[11px] font-medium text-center whitespace-nowrap',
                step.isCurrent && !step.isRejected && 'text-[var(--warning)]',
                step.isRejected && step.isCurrent && 'text-[var(--danger)]',
                step.isComplete && !step.isRejected && 'text-[var(--success)]',
                !step.isCurrent && !step.isComplete && 'text-[var(--text-tertiary)]'
              )}
            >
              {step.label}
            </p>
          </div>

          {/* Connector */}
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-6 w-8 mx-1 mt-3 flex items-center justify-center',
                step.isComplete && !step.isRejected
                  ? 'text-[var(--success)]'
                  : 'text-[var(--border-subtle)]'
              )}
            >
              <div
                className={cn(
                  'h-0.5 flex-1',
                  step.isComplete && !step.isRejected
                    ? 'bg-[var(--success)]'
                    : 'bg-[var(--border-subtle)]'
                )}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
