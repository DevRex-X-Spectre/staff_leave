'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, Info } from 'lucide-react';

type RotaRow = {
  slot_start: string;
  slot_end: string;
  leave_type_id: string | null;
};

type DayBucket = {
  date: string;
  count: number;
  hasApproved: boolean;
};

const MAX_CONCURRENT = 2; // Visual cap — at or above this paints red-orange
const COLOR_LIGHT = '#6b7280';
const COLOR_HEAVY = '#dc2626';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eachDay(startIso: string, endIso: string): string[] {
  // FullCalendar end dates are exclusive — strip to days inclusive of start, exclusive of end.
  const out: string[] = [];
  const s = new Date(startIso);
  const e = new Date(endIso);
  const cursor = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  while (cursor < e) {
    out.push(ymd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/**
 * Privacy-preserving: collapse many slots into a single per-day count
 * event. Staff never see colleague names on this view.
 */
function bucketByDay(rows: RotaRow[]): DayBucket[] {
  const map = new Map<string, DayBucket>();
  rows.forEach((r) => {
    const days = eachDay(r.slot_start, r.slot_end);
    days.forEach((d) => {
      const existing = map.get(d);
      if (existing) existing.count++;
      else map.set(d, { date: d, count: 1, hasApproved: true });
    });
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function StaffRotaClient({
  slots,
  departmentSize,
  departmentId,
}: {
  slots: RotaRow[];
  departmentSize: number;
  departmentId: string | null;
}) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [peakCount, setPeakCount] = useState(0);
  const [uniqueDays, setUniqueDays] = useState(0);

  const buckets = useMemo(() => bucketByDay(slots), [slots]);

  useEffect(() => {
    if (buckets.length) {
      setPeakCount(Math.max(...buckets.map((b) => b.count)));
      setUniqueDays(buckets.length);
    }
  }, [buckets]);

  useEffect(() => {
    const el = calendarRef.current;
    if (!el) return;
    setLoading(false);

    const events = buckets.map((b) => ({
      start: b.date,
      allDay: true,
      display: 'background' as const,
      backgroundColor: b.count >= MAX_CONCURRENT ? COLOR_HEAVY : COLOR_LIGHT,
      title: `${b.count} on leave`,
      extendedProps: { count: b.count },
    }));

    // Numeric badge event rendered in the foreground for accessibility.
    const labelEvents = buckets.map((b) => ({
      start: b.date,
      allDay: true,
      title: `${b.count}`,
      color: b.count >= MAX_CONCURRENT ? COLOR_HEAVY : COLOR_LIGHT,
      textColor: '#ffffff',
    }));

    import('@fullcalendar/react').then(({ default: Calendar }) => {
      import('@fullcalendar/daygrid').then(() => {
        if (!calendarRef.current) return;
        new Calendar(calendarRef.current, {
          plugins: [],
          initialView: 'dayGridMonth',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth',
          },
          height: 'auto',
          events: [...events, ...labelEvents],
          eventDisplay: 'block',
        }).render();
      });
    });

    return () => {
      // Cleanup innerHTML so re-renders don't duplicate.
      if (calendarRef.current) calendarRef.current.innerHTML = '';
    };
  }, [buckets]);

  if (!departmentId) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Leave Rota"
          description="Published departmental leave schedule."
        />
        <Card>
          <EmptyState
            icon={Info}
            title="No department assigned"
            description="You are not currently assigned to a department. Contact HR to be added."
          />
        </Card>
      </div>
    );
  }

  if (!slots.length) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Leave Rota"
          description="Published departmental leave schedule."
        />
        <Card>
          <EmptyState
            icon={Users}
            title="No published rota"
            description="Your HOD has not published a rota yet. Check back later."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Rota"
        description="Published departmental leave schedule. Dates with staff on leave are highlighted below."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)]">Department</p>
          <p className="text-[18px] font-semibold text-[var(--text-primary)] mt-1">{departmentSize} staff</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)]">Days with leave</p>
          <p className="text-[18px] font-semibold text-[var(--text-primary)] mt-1">{uniqueDays}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)]">Peak overlap</p>
          <p className="text-[18px] font-semibold text-[var(--text-primary)] mt-1">
            {peakCount} {peakCount === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_LIGHT }} />
          <span className="text-[13px] text-[var(--text-secondary)]">1 person on leave</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_HEAVY }} />
          <span className="text-[13px] text-[var(--text-secondary)]">
            {MAX_CONCURRENT}+ people (concurrent limit reached)
          </span>
        </div>
      </div>

      <Card padding={false}>
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <CardTitle>Departmental Rota</CardTitle>
          <CardDescription className="mt-1">
            Only the number of staff on leave is shown per day — individual names are
            hidden to protect privacy.
          </CardDescription>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton height={40} />
              <Skeleton height={300} />
            </div>
          ) : (
            <div ref={calendarRef} className="fc" />
          )}
        </div>
      </Card>
    </div>
  );
}