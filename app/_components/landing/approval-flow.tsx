import { Check, Clock, FileText, Shield, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ApprovalFlow — an animated product illustration showing how a
 * leave request flows through NAUB's two-stage approval. Steps
 * progress automatically, the progress bar fills, and a mini
 * calendar highlights the approved days.
 *
 * Pure server component — animations are pure CSS so they run
 * even if JavaScript is disabled.
 */
export function ApprovalFlow() {
  return (
    <div className="relative w-full max-w-[760px] mx-auto">
      {/* Outer glow plate for depth (adapts: dark in light mode, white highlight in dark) */}
      <div
        className="absolute -inset-6 rounded-[24px] blur-2xl"
        style={{
          zIndex: -1,
          background:
            'radial-gradient(ellipse at center, rgba(var(--shadow-color), var(--shadow-medium)) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <div className="relative bg-[var(--bg-card)] rounded-[16px] overflow-hidden shadow-card-elevated">
        {/* Faux title bar */}
        <div className="flex items-center justify-between px-5 h-11 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[var(--ink)] inline-flex items-center justify-center text-white text-[10px] font-bold">
              NA
            </span>
            <span className="text-[12px] font-semibold text-[var(--text-primary)]">
              NAUB LMS · Application
            </span>
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
            #NAUB-2026-0124
          </span>
        </div>

        {/* Application summary */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
                Annual leave
              </p>
              <h4 className="text-[18px] font-semibold text-[var(--text-primary)] mt-0.5">
                5 working days · 24 – 28 Jun 2026
              </h4>
              <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                Family vacation — Samuel Adekunle · Computer Science
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ink)] text-white text-[10px] font-semibold tracking-tight">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse-soft" />
              In progress
            </span>
          </div>
        </div>

        {/* Approval stepper */}
        <div className="px-5 pb-5">
          <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold mb-3">
            Approval progress
          </p>

          <div className="relative">
            {/* Track */}
            <div className="absolute left-4 right-4 top-4 h-[2px] bg-[var(--bg-subtle)] rounded-full" />
            {/* Animated fill — fills 0 → 75% over 6s then holds */}
            <div
              className="absolute left-4 top-4 h-[2px] bg-[var(--ink)] rounded-full"
              style={{
                width: '0%',
                animation:
                  'flow-progress 6s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
              }}
            />

            <div className="grid grid-cols-4 gap-2 relative">
              {STEPS.map((step, i) => (
                <Step key={step.label} step={step} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-subtle)]" />

        {/* Calendar + side info */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 px-5 py-4 items-center">
          <MiniCalendar />
          <div className="space-y-2 sm:max-w-[220px]">
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Next action
            </p>
            <p className="text-[12px] text-[var(--text-primary)] font-medium leading-snug">
              Awaiting HR Manager review
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] inline-flex items-center justify-center text-[10px] font-semibold text-[var(--text-primary)]">
                AB
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">
                  Amina Bello
                </p>
                <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                  HR Manager
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { label: 'Submitted', date: '20 Jun', icon: FileText },
  { label: 'HOD review', date: '21 Jun', icon: Shield },
  { label: 'HR review', date: 'Now', icon: Clock },
  { label: 'Approved', date: 'Soon', icon: CheckCircle2 },
];

function Step({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const Icon = step.icon;
  // Each step activates at index * 25% of the 6s cycle
  const delay = `${index * 1.5}s`;
  return (
    <div className="flex flex-col items-center text-center">
      <span
        className={cn(
          'relative w-8 h-8 rounded-full inline-flex items-center justify-center',
          'border bg-[var(--bg-card)] border-[var(--border-subtle)] text-[var(--text-tertiary)]',
          'transition-colors'
        )}
        style={{
          animation: `step-activate 6s ${delay} cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite`,
        }}
      >
        <Icon size={14} strokeWidth={1.75} className="step-icon-default" />
        <Check
          size={14}
          strokeWidth={2.5}
          className="step-icon-active absolute inset-0 m-auto text-white hidden"
        />
        {/* Active dot pulse on the currently-in-progress step */}
        {index === 2 && (
          <span
            className="absolute inset-0 rounded-full bg-[var(--ink)] animate-ping-soft"
            style={{ animationDelay: '3s' }}
            aria-hidden
          />
        )}
      </span>
      <p
        className="text-[10px] mt-1.5 font-medium text-[var(--text-tertiary)] step-label transition-colors"
      >
        {step.label}
      </p>
      <p className="text-[9px] text-[var(--text-tertiary)]/70 mt-0.5 tabular-nums">
        {step.date}
      </p>
    </div>
  );
}

function MiniCalendar() {
  // June 2026 — start on Monday (index 1)
  // 30 days, first day is Mon Jun 1
  const monthLabel = 'June 2026';
  const startWeekday = 1; // Mon
  const daysInMonth = 30;
  const approvedDays = [24, 25, 26, 27, 28];
  const start = 22; // Mon 22 Jun (the application window)
  const end = 30;

  const cells: ({ day: number; state: 'default' | 'window' | 'approved' } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    let state: 'default' | 'window' | 'approved' = 'default';
    if (d >= start && d <= end) state = 'window';
    if (approvedDays.includes(d)) state = 'approved';
    cells.push({ day: d, state });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[12px] font-semibold text-[var(--text-primary)]">
          {monthLabel}
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)] font-medium">
          Application window
        </p>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-[9px] text-[var(--text-tertiary)] font-semibold uppercase tracking-widest"
          >
            {d}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c)
            return <span key={`empty-${i}`} className="h-6 text-[10px]" />;
          return (
            <span
              key={`d-${c.day}`}
              className={cn(
                'h-6 text-[10px] inline-flex items-center justify-center rounded-md tabular-nums',
                c.state === 'default' && 'text-[var(--text-secondary)]',
                c.state === 'window' && 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]',
                c.state === 'approved' &&
                  'bg-[var(--ink)] text-white font-semibold animate-pulse-soft'
              )}
            >
              {c.day}
            </span>
          );
        })}
      </div>
    </div>
  );
}
