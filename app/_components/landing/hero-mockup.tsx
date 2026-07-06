import { Bell, CheckCircle2, Clock, CalendarDays, ArrowUpRight } from 'lucide-react';

/**
 * HeroMockup — a stylised, monochrome product mockup that floats
 * gently in the hero. The design follows the Cal.com principle of
 * letting the product be the hero: no abstract illustrations, just
 * a real-feeling slice of the dashboard.
 *
 * Composition: a primary "dashboard" card with three satellite
 * cards (notification, pending badge, calendar glyph) drifting
 * around it. All animations are pure CSS keyframes defined in
 * globals.css.
 */
export function HeroMockup() {
  return (
    <div
      className="relative w-full max-w-[640px] mx-auto animate-float"
      aria-hidden="true"
    >
      {/* Main card */}
      <div
        className="relative bg-[var(--bg-card)] rounded-[16px] overflow-hidden shadow-card-elevated"
      >
        {/* Faux browser top bar */}
        <div className="flex items-center justify-between px-4 h-9 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-default)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-default)]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--border-default)]" />
          </div>
          <div className="px-3 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[10px] font-medium text-[var(--text-tertiary)] tracking-tight">
            naub-lms / staff / dashboard
          </div>
          <div className="w-12" />
        </div>

        {/* Page header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)]"
                style={{ letterSpacing: '0.08em' }}
              >
                Staff dashboard
              </p>
              <h3
                className="text-[18px] font-semibold text-[var(--text-primary)] mt-1 leading-tight"
                style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.01em' }}
              >
                Welcome back, Samuel
              </h3>
              <p
                className="text-[12px] text-[var(--text-secondary)] mt-0.5"
                style={{ fontWeight: 300 }}
              >
                Computer Science · 18 of 21 annual days remaining
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span
                className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-[var(--bg-subtle)]"
                aria-hidden
              >
                <Bell size={12} strokeWidth={1.5} className="text-[var(--text-tertiary)]" />
              </span>
              <span
                className="h-7 w-7 rounded-full bg-[var(--ink)] inline-flex items-center justify-center text-white text-[10px] font-bold"
                aria-hidden
              >
                SA
              </span>
            </div>
          </div>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-3 gap-2 px-5 pb-4">
          {BALANCES.map((b, i) => (
            <div
              key={b.label}
              className="rounded-[10px] p-2.5 bg-[var(--bg-card)]"
              style={{ boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}
            >
              <p
                className="text-[9px] uppercase font-semibold text-[var(--text-tertiary)]"
                style={{ letterSpacing: '0.08em' }}
              >
                {b.label}
              </p>
              <p
                className="text-[16px] font-semibold text-[var(--text-primary)] mt-0.5 tabular-nums"
                style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.01em' }}
              >
                {b.remaining}
                <span className="text-[10px] font-light text-[var(--text-tertiary)]">
                  /{b.total}
                </span>
              </p>
              <div className="mt-1.5 h-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                <div
                  className="h-full bg-[var(--ink)] rounded-full"
                  style={{
                    width: `${Math.round(((b.total - b.remaining) / b.total) * 100)}%`,
                    animation: `progress-grow 1.4s ${0.2 + i * 0.1}s cubic-bezier(0.22, 0.61, 0.36, 1) both`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Recent applications */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-[12px] font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.01em' }}
            >
              Recent applications
            </p>
            <span
              className="text-[10px] text-[var(--text-tertiary)] font-medium inline-flex items-center gap-0.5"
            >
              View all
              <ArrowUpRight size={10} strokeWidth={2} />
            </span>
          </div>
          <div
            className="rounded-[10px] overflow-hidden bg-[var(--bg-card)]"
            style={{ boxShadow: 'inset 0 0 0 1px var(--border-subtle)' }}
          >
            {RECENT.map((row, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 text-[11px]"
                style={{
                  borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
                }}
              >
                <span
                  className="font-medium text-[var(--text-primary)] flex-1 truncate"
                >
                  {row.type}
                </span>
                <span className="text-[var(--text-tertiary)] tabular-nums hidden sm:inline">
                  {row.dates}
                </span>
                <StatusPill status={row.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating notification — top left */}
      <div
        className="hidden sm:flex absolute -left-8 lg:-left-12 -top-6 bg-[var(--bg-card)] rounded-[12px] pl-2 pr-3.5 py-2.5 items-start gap-2.5 animate-float-slow shadow-floating"
        style={{ width: 250 }}
      >
        <span className="relative shrink-0 mt-0.5">
          <span className="block w-8 h-8 rounded-full bg-[var(--success-bg)] inline-flex items-center justify-center">
            <CheckCircle2 size={16} className="text-[var(--success)]" strokeWidth={1.75} />
          </span>
          <span className="absolute inset-0 rounded-full bg-[var(--success)] animate-ping-soft" />
        </span>
        <div className="min-w-0">
          <p
            className="text-[11px] font-semibold text-[var(--text-primary)] truncate"
            style={{ fontFamily: 'var(--font-cal-sans)', letterSpacing: '0.01em' }}
          >
            Leave approved
          </p>
          <p
            className="text-[10px] text-[var(--text-secondary)] mt-0.5 leading-snug"
            style={{ fontWeight: 300 }}
          >
            HOD approved your 5-day annual leave for 24 – 28 Jun.
          </p>
        </div>
      </div>

      {/* Floating pending badge — right side */}
      <div
        className="hidden md:flex absolute -right-6 top-32 bg-[var(--bg-card)] rounded-[12px] px-3 py-2.5 items-center gap-2.5 animate-float-slow shadow-floating-sm"
        style={{ animationDelay: '1.2s' }}
      >
        <span className="w-7 h-7 rounded-full bg-[var(--bg-subtle)] inline-flex items-center justify-center">
          <Clock size={13} className="text-[var(--text-secondary)]" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-widest font-semibold">
            Awaiting
          </p>
          <p
            className="text-[12px] font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cal-sans)' }}
          >
            3 reviews
          </p>
        </div>
      </div>

      {/* Floating calendar glyph — top right */}
      <div
        className="hidden md:flex absolute -right-4 -top-4 w-14 h-14 rounded-[12px] bg-[var(--bg-card)] items-center justify-center animate-float-slow shadow-floating-xs"
        style={{ animationDelay: '2s' }}
      >
        <CalendarDays size={22} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
      </div>

      {/* Floating "Apply" pill — bottom right */}
      <div
        className="hidden lg:flex absolute -right-2 -bottom-2 bg-[var(--ink)] text-white rounded-full pl-2.5 pr-4 py-2 items-center gap-1.5 animate-float-slow"
        style={{ animationDelay: '0.6s' }}
      >
        <span className="w-5 h-5 rounded-full bg-white/15 inline-flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              d="M5 1V9M1 5H9"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span
          className="text-[12px] font-medium tracking-tight"
          style={{ fontFamily: 'var(--font-cal-sans)' }}
        >
          Apply for leave
        </span>
      </div>
    </div>
  );
}

const BALANCES = [
  { label: 'Annual', total: 21, remaining: 18 },
  { label: 'Casual', total: 7, remaining: 5 },
  { label: 'Sick', total: 7, remaining: 3 },
];

const RECENT = [
  { type: 'Annual leave', dates: '24 – 28 Jun', status: 'approved' as const },
  { type: 'Casual leave', dates: '15 – 17 May', status: 'approved' as const },
  { type: 'Sick leave', dates: '02 – 03 Apr', status: 'pending' as const },
];

function StatusPill({ status }: { status: 'approved' | 'pending' }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--ink)] text-white text-[9px] font-semibold tracking-tight">
        <span className="w-1 h-1 rounded-full bg-white" />
        Approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] text-[9px] font-semibold tracking-tight">
      <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] animate-pulse-soft" />
      Pending
    </span>
  );
}
