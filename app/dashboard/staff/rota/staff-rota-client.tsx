'use client';

import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Info, Users as UsersIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RotaSlot } from '@/types';

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

const MAX_CONCURRENT = 2; // Visual cap - at or above this paints red-orange
const COLOR_LIGHT = '#6b7280';
const COLOR_HEAVY = '#dc2626';

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eachDay(startIso: string, endIso: string): string[] {
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
  departmentId,
  departmentSize,
}: {
  slots: RotaSlot[];
  departmentId: string;
  departmentSize: number;
}) {
  const calRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState('');
  const [view, setView] = useState<'dayGridMonth' | 'listMonth'>('dayGridMonth');

  const rows: RotaRow[] = useMemo(
    () =>
      slots.map((s) => ({
        slot_start: s.slot_start,
        slot_end: s.slot_end,
        leave_type_id: s.leave_type_id,
      })),
    [slots]
  );

  const buckets = useMemo(() => bucketByDay(rows), [rows]);

  const peakCount = buckets.length ? Math.max(...buckets.map((b) => b.count)) : 0;
  const uniqueDays = buckets.length;

  const calendarEvents = useMemo(() => {
    const backgroundEvents = buckets.map((b) => ({
      start: b.date,
      allDay: true,
      display: 'background' as const,
      backgroundColor: b.count >= MAX_CONCURRENT ? COLOR_HEAVY : COLOR_LIGHT,
    }));
    const labelEvents = buckets.map((b) => ({
      start: b.date,
      allDay: true,
      title: `${b.count} on leave`,
      backgroundColor: b.count >= MAX_CONCURRENT ? COLOR_HEAVY : COLOR_LIGHT,
      borderColor: b.count >= MAX_CONCURRENT ? COLOR_HEAVY : COLOR_LIGHT,
      textColor: '#ffffff',
      extendedProps: { count: b.count },
    }));
    return [...backgroundEvents, ...labelEvents];
  }, [buckets]);

  const nav = (dir: 'prev' | 'next' | 'today') => {
    const api = calRef.current?.getApi();
    if (!api) return;
    if (dir === 'today') api.today();
    else api[dir]();
  };

  const switchView = (v: 'dayGridMonth' | 'listMonth') => {
    const api = calRef.current?.getApi();
    setView(v);
    api?.changeView(v);
  };

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
            description="You are not currently assigned to a department. Contact your Registrar to be added."
          />
        </Card>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Leave Rota"
          description="Published departmental leave schedule."
        />
        <Card>
          <EmptyState
            icon={UsersIcon}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">Department</p>
          <p className="text-[18px] font-semibold text-[var(--text-primary)] mt-1 tabular-nums">{departmentSize} staff</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] px-4 py-3">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">Days with leave</p>
          <p className="text-[18px] font-semibold text-[var(--text-primary)] mt-1 tabular-nums">{uniqueDays}</p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-card)] px-4 py-3 col-span-2 sm:col-span-1">
          <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-medium">Peak overlap</p>
          <p className="text-[18px] font-semibold text-[var(--text-primary)] mt-1 tabular-nums">
            {peakCount} {peakCount === 1 ? 'person' : 'people'}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 sm:mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_LIGHT }} aria-hidden />
          <span className="text-[12px] sm:text-[13px] text-[var(--text-secondary)]">1 person on leave</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: COLOR_HEAVY }} aria-hidden />
          <span className="text-[12px] sm:text-[13px] text-[var(--text-secondary)]">
            {MAX_CONCURRENT}+ people (concurrent limit reached)
          </span>
        </div>
      </div>

      <Card padding={false} className="overflow-hidden">
        {/* Custom toolbar */}
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 order-2 sm:order-1">
              <button
                type="button"
                onClick={() => nav('prev')}
                aria-label="Previous"
                className="w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => nav('next')}
                aria-label="Next"
                className="w-8 h-8 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => nav('today')}
                className="ml-1 h-8 px-3 inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
              >
                Today
              </button>
            </div>

            <div className="order-1 sm:order-2 sm:flex-1 text-center">
              <h2
                className="text-[16px] sm:text-[18px] font-semibold text-[var(--text-primary)] capitalize"
                style={{ fontFamily: 'var(--font-cal-sans)' }}
              >
                {title || 'Loading...'}
              </h2>
            </div>

            <div className="order-3 inline-flex p-0.5 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] self-start sm:self-auto">
              {(['dayGridMonth', 'listMonth'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => switchView(v)}
                  className={cn(
                    'h-7 px-3 rounded-[calc(var(--radius-md)-2px)] text-[12px] font-medium transition-colors',
                    view === v
                      ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {v === 'dayGridMonth' ? 'Month' : 'List'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={calendarEvents}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            datesSet={(info) => setTitle(info.view.title)}
            eventContent={(arg) => {
              if (arg.view.type === 'listMonth') {
                const { count } = arg.event.extendedProps as { count: number };
                const isHeavy = count >= MAX_CONCURRENT;
                return (
                  <div className="flex items-center gap-2 min-w-0 py-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isHeavy ? COLOR_HEAVY : COLOR_LIGHT }}
                      aria-hidden
                    />
                    <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {count} {count === 1 ? 'person' : 'people'} on leave
                    </span>
                  </div>
                );
              }
              const { count } = arg.event.extendedProps as { count: number };
              return (
                <div
                  className="fc-event-pill text-[10px] sm:text-[11px] font-semibold text-white text-center rounded-[4px] px-1 py-0.5 truncate"
                  style={{
                    backgroundColor: count >= MAX_CONCURRENT ? COLOR_HEAVY : COLOR_LIGHT,
                  }}
                  title={`${count} on leave`}
                >
                  {count}
                </div>
              );
            }}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <CardDescription>
          Only the number of staff on leave is shown per day - individual names are
          hidden to protect privacy. Switch to List view to see a compact agenda.
        </CardDescription>
      </Card>
    </div>
  );
}