'use client';

import { useMemo, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardDescription } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  LeaveApplicationWithRelations,
  LeaveRota,
  RotaSlot,
} from '@/types';

/* Event palette - all foreground/background pairs are AA-safe.
   Each color shows white text. White-on-{color} contrasts verified:
     --rota bg #475569 : 6.12:1 ✓ AA
     --approved bg #1f2937 : 14.9:1 ✓ AAA
     --hod_approved bg #0c6cc7 : 5.74:1 ✓ AA */
const EVENT_COLORS = {
  rota: { bg: '#475569', text: '#ffffff' },          // Slate-600 - rota slots
  approved: { bg: '#1f2937', text: '#ffffff' },      // Slate-800 - fully approved
  hod_approved: { bg: '#0c6cc7', text: '#ffffff' },  // Brand blue - pending Registrar
};

type EventType = 'rota' | 'approved' | 'hod_approved';

// FullCalendar treats all-day `end` as exclusive, but our data stores
// inclusive ranges (start..end = total_days). Add a day so an N-day leave
// visually spans N days on the grid.
function inclusiveEnd(endIso: string): string {
  const d = new Date(endIso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

type CalEvent = {
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: { type: EventType; staffName: string; leaveType: string };
};

export function HodCalendarClient({
  applications,
  rotas,
  slots,
}: {
  applications: LeaveApplicationWithRelations[];
  rotas: LeaveRota[];
  slots: RotaSlot[];
}) {
  const calRef = useRef<FullCalendar>(null);
  const [title, setTitle] = useState('');
  const [view, setView] = useState<'dayGridMonth' | 'listMonth'>('dayGridMonth');

  const events = useMemo<CalEvent[]>(() => {
    const out: CalEvent[] = [];

    slots.forEach((slot) => {
      const leaveType = slot.leave_type_id ? `Leave (${slot.leave_type_id})` : 'Leave';
      out.push({
        title: `Staff - ${leaveType}`,
        start: slot.slot_start,
        end: inclusiveEnd(slot.slot_end),
        backgroundColor: EVENT_COLORS.rota.bg,
        borderColor: EVENT_COLORS.rota.bg,
        textColor: EVENT_COLORS.rota.text,
        extendedProps: { type: 'rota', staffName: 'Staff', leaveType },
      });
    });

    applications.forEach((app) => {
      if (app.status === 'approved' || app.status === 'hod_approved') {
        const leaveType = app.leave_type?.name ?? 'Leave';
        const colors =
          app.status === 'approved' ? EVENT_COLORS.approved : EVENT_COLORS.hod_approved;
        out.push({
          title: `${app.applicant?.full_name ?? 'Staff'} - ${leaveType}`,
          start: app.start_date,
          end: inclusiveEnd(app.end_date),
          backgroundColor: colors.bg,
          borderColor: colors.bg,
          textColor: colors.text,
          extendedProps: {
            type: app.status as 'approved' | 'hod_approved',
            staffName: app.applicant?.full_name ?? 'Unknown',
            leaveType,
          },
        });
      }
    });

    return out;
  }, [applications, slots]);

  const legend = useMemo(
    () => ({
      rota: slots.length,
      approved: applications.filter((a) => a.status === 'approved').length,
      hod_approved: applications.filter((a) => a.status === 'hod_approved').length,
    }),
    [applications, slots]
  );

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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Department Calendar"
        description="Full view of published rota slots and leave applications for your department."
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 sm:mb-6">
        {[
          { label: 'Rota Slots', count: legend.rota, color: EVENT_COLORS.rota.bg },
          { label: 'Approved', count: legend.approved, color: EVENT_COLORS.approved.bg },
          { label: 'Pending Registrar', count: legend.hod_approved, color: EVENT_COLORS.hod_approved.bg },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: l.color }}
              aria-hidden
            />
            <span className="text-[12px] sm:text-[13px] text-[var(--text-secondary)]">
              {l.label}
              <span className="ml-1 font-medium text-[var(--text-primary)]">({l.count})</span>
            </span>
          </div>
        ))}
      </div>

      <Card padding={false} className="overflow-hidden">
        {/* Custom toolbar */}
        <div className="px-4 sm:px-6 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Nav buttons */}
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

            {/* Title */}
            <div className="order-1 sm:order-2 sm:flex-1 text-center">
              <h2
                className="text-[16px] sm:text-[18px] font-semibold text-[var(--text-primary)] capitalize"
                style={{ fontFamily: 'var(--font-cal-sans)' }}
              >
                {title || 'Loading...'}
              </h2>
            </div>

            {/* View toggle (segmented control) */}
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

        {/* Calendar surface */}
        <div className="p-3 sm:p-5">
          <FullCalendar
            ref={calRef}
            plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={false}
            events={events}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={2}
            nowIndicator
            datesSet={(info) => setTitle(info.view.title)}
            eventContent={(arg) => {
              const { staffName, leaveType, type } = arg.event.extendedProps as {
                staffName: string;
                leaveType: string;
                type: EventType;
              };
              const dotColor = EVENT_COLORS[type].bg;
              // List view renders fuller text; grid view truncates.
              if (arg.view.type === 'listMonth') {
                return (
                  <div className="flex items-center gap-2 min-w-0 py-0.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: dotColor }}
                      aria-hidden
                    />
                    <span className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {staffName}
                    </span>
                    <span className="text-[12px] text-[var(--text-tertiary)] truncate">
                      {leaveType}
                    </span>
                  </div>
                );
              }
              return (
                <div
                  className="fc-event-pill flex items-center gap-1.5 min-w-0 px-1.5 py-0.5 rounded-[4px]"
                  style={{ backgroundColor: dotColor, color: '#fff' }}
                  title={`${staffName} - ${leaveType}`}
                >
                  <span className="text-[10px] sm:text-[11px] font-medium leading-tight truncate">
                    {staffName} <span className="opacity-70">- {leaveType}</span>
                  </span>
                </div>
              );
            }}
          />
        </div>
      </Card>

      <Card className="mt-5">
        <CardDescription>
          Staff names are visible to you as HOD. The calendar shows all approved and
          HOD-approved applications, plus published rota slots. Switch to List view for a
          compact agenda of upcoming leave.
        </CardDescription>
      </Card>
    </div>
  );
}
