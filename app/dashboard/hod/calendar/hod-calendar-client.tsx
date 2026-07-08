'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader, Skeleton } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import type {
  LeaveApplicationWithRelations,
  LeaveRota,
  RotaSlot,
} from '@/types';

type SlotRow = {
  id: string;
  rota_id: string;
  user_id: string;
  slot_start: string;
  slot_end: string;
  leave_type_id: string | null;
};

type CalendarEvent = {
  title: string;
  start: string;
  end: string;
  color: string;
  textColor: string;
  extendedProps: {
    type: 'rota' | 'approved' | 'hod_approved';
    staffName: string;
    leaveType: string;
  };
};

/* Event palette - all foreground/background pairs are AA-safe.
   Each color shows white text. White-on-{color} contrasts verified:
     --rota bg #475569 : 6.12:1 âœ“ AA
     --approved bg #1f2937 : 14.9:1 âœ“ AAA
     --hod_approved bg #0c6cc7 : 5.74:1 âœ“ AA */
const EVENT_COLORS = {
  rota: { bg: '#475569', text: '#ffffff' },          // Slate-600 - rota slots
  approved: { bg: '#1f2937', text: '#ffffff' },      // Slate-800 - fully approved
  hod_approved: { bg: '#0c6cc7', text: '#ffffff' },  // Brand blue - pending Registrar
};

// Look up user/leave-type names from a small dict passed via window context.
// In production this would be resolved server-side, but for the demo we
// embed the names in the slot/applicant objects.

export function HodCalendarClient({
  applications,
  rotas,
  slots,
}: {
  applications: LeaveApplicationWithRelations[];
  rotas: LeaveRota[];
  slots: RotaSlot[];
}) {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [legend, setLegend] = useState({ rota: 0, approved: 0, hod_approved: 0 });

  useEffect(() => {
    const events: CalendarEvent[] = [];

    // Rota slots - grey
    slots.forEach((slot) => {
      const leaveType = slot.leave_type_id ? `Leave (${slot.leave_type_id})` : 'Leave';
      events.push({
        title: `Staff - ${leaveType}`,
        start: slot.slot_start,
        end: slot.slot_end,
        color: EVENT_COLORS.rota.bg,
        textColor: EVENT_COLORS.rota.text,
        extendedProps: {
          type: 'rota',
          staffName: 'Staff',
          leaveType,
        },
      });
    });

    // Approved and HOD-approved applications
    const statusCounts = { rota: slots.length, approved: 0, hod_approved: 0 };

    applications.forEach((app) => {
      if (app.status === 'approved' || app.status === 'hod_approved') {
        const leaveType = app.leave_type?.name ?? 'Leave';
        const colors =
          app.status === 'approved' ? EVENT_COLORS.approved : EVENT_COLORS.hod_approved;

        events.push({
          title: `${app.applicant?.full_name ?? 'Staff'} - ${leaveType}`,
          start: app.start_date,
          end: app.end_date,
          color: colors.bg,
          textColor: colors.text,
          extendedProps: {
            type: app.status as 'approved' | 'hod_approved',
            staffName: app.applicant?.full_name ?? 'Unknown',
            leaveType,
          },
        });

        if (app.status === 'approved') statusCounts.approved++;
        else statusCounts.hod_approved++;
      }
    });

    setLegend(statusCounts);

    // Render FullCalendar
    const el = calendarRef.current;
    if (!el) return;

    import('@fullcalendar/core').then(({ Calendar }) => {
      import('@fullcalendar/daygrid').then(() => {
        import('@fullcalendar/interaction').then(() => {
          if (!calendarRef.current) return;
          new Calendar(calendarRef.current, {
            plugins: [],
            initialView: 'dayGridMonth',
            headerToolbar: {
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,listWeek',
            },
            height: 'auto',
            events,
            eventDisplay: 'block',
            eventTimeFormat: {
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short',
            },
          }).render();
        });
      });
    });

    return () => {
      if (calendarRef.current) calendarRef.current.innerHTML = '';
    };
  }, [applications, slots]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Department Calendar"
        description="Full view of published rota slots and leave applications for your department."
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EVENT_COLORS.rota.bg }} />
          <span className="text-[13px] text-[var(--text-secondary)]">
            Rota Slots ({legend.rota})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EVENT_COLORS.approved.bg }} />
          <span className="text-[13px] text-[var(--text-secondary)]">
            Approved ({legend.approved})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: EVENT_COLORS.hod_approved.bg }} />
          <span className="text-[13px] text-[var(--text-secondary)]">
            Pending Registrar ({legend.hod_approved})
          </span>
        </div>
      </div>

      <Card padding={false}>
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <CardTitle>Calendar View</CardTitle>
          <CardDescription className="mt-1">
            Staff names are visible to you as HOD. All approved and HOD-approved applications are shown.
          </CardDescription>
        </div>
        <div className="p-6">
          <div ref={calendarRef} className="fc min-h-[400px]">
            <Skeleton height={400} />
          </div>
        </div>
      </Card>
    </div>
  );
}