'use client';

import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Scheduling-widget card for the landing hero - a clean, isolated
 * product slice showing a leave calendar. Built per the Cal.com
 * design skill: white surface, 12px radius, subtle diffuse shadow,
 * no border.
 */
export function LeaveWidgetCard() {
  // Demo state for the widget visual - independent of the localStorage store.
  const today = 11;
  const onLeaveDays = [3, 4, 5, 6, 7, 8, 9];
  const pendingDays = [16, 17, 18];
  const approvedDays = [24, 25, 26, 27, 28];

  // July 2026 starts on Wednesday (indices: M T W T F S S → 0 1 2 3 4 5 6).
  const startWeekday = 2; // Wednesday
  const daysInMonth = 31;
  const cells: ({ day: number; status: 'default' | 'on-leave' | 'pending' | 'approved' | 'today' } | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    let status: 'default' | 'on-leave' | 'pending' | 'approved' | 'today' = 'default';
    if (d === today) status = 'today';
    else if (onLeaveDays.includes(d)) status = 'on-leave';
    else if (pendingDays.includes(d)) status = 'pending';
    else if (approvedDays.includes(d)) status = 'approved';
    cells.push({ day: d, status });
  }

  return (
    <Card padding={false} className="overflow-hidden">
      {/* Faux browser top bar - like the Cal.com widget */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-[var(--silver,#e5e7eb)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--slate,#6b7280)]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--slate,#6b7280)]/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--slate,#6b7280)]/40" />
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-[var(--paper,#f4f4f4)] text-[10px] font-medium text-[var(--slate,#6b7280)] tracking-tight">
          naub-lms / staff
        </span>
        <div className="w-10" />
      </div>

      {/* Card heading */}
      <div className="px-5 pt-5 pb-4">
        <CardTitle>July 2026</CardTitle>
        <CardDescription>Team on leave · NAUB Computer Science</CardDescription>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-5 pb-3 text-center">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="text-[10px] font-semibold uppercase tracking-widest text-[var(--stone,#898989)]"
          >
            {d}
          </span>
        ))}
        {cells.map((c, i) =>
          !c ? (
            <span key={`empty-${i}`} className="h-6 text-[10px]" />
          ) : (
            <span
              key={`d-${c.day}`}
              className={cn(
                'h-6 text-[11px] inline-flex items-center justify-center rounded-md tabular-nums text-[var(--graphite,#242424)]',
                c.status === 'on-leave' && 'bg-[var(--ink)] text-white font-semibold',
                c.status === 'pending' &&
                  'bg-[var(--paper,#f4f4f4)] text-[var(--graphite,#242424)] ring-1 ring-inset ring-[var(--ink)]/30',
                c.status === 'approved' &&
                  'bg-[var(--graphite,#242424)]/10 text-[var(--graphite,#242424)] font-medium',
                c.status === 'today' &&
                  'bg-[var(--ink)] text-white font-bold ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-white'
              )}
            >
              {c.day}
            </span>
          )
        )}
      </div>

      {/* Legend */}
      <div className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Legend swatch="bg-[var(--ink)]" label="On leave" />
        <Legend swatch="bg-[var(--paper,#f4f4f4)] ring-1 ring-[var(--ink)]/30" label="Pending" />
        <Legend swatch="bg-[var(--graphite,#242424)]/10" label="Approved" />
        <Legend swatch="bg-[var(--ink)] ring-2 ring-[var(--ink)]/20" label="Today" />
      </div>
    </Card>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--slate,#6b7280)]">
      <span className={cn('w-2.5 h-2.5 rounded-sm', swatch)} aria-hidden />
      {label}
    </span>
  );
}