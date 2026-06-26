'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/stat-card';
import {
  listApplicationsByDepartment,
  listRotasByDepartment,
  listRotaSlotsByDepartment,
} from '@/lib/data/dal';
import type { LeaveApplicationWithRelations, LeaveRota, RotaSlot, User } from '@/types';
import { Users, LeaveTypes } from '@/lib/mock/store';
import { format, parseISO, eachDayOfInterval, isWithinInterval } from 'date-fns';

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

const EVENT_COLORS = {
  rota: { bg: '#6b7280', text: '#ffffff' }, // Slate - rota slots
  approved: { bg: '#101010', text: '#ffffff' }, // Ink - fully approved
  hod_approved: { bg: '#0099ff', text: '#ffffff' }, // Blue - pending HR
};

export default function HodCalendarPage() {
  const calendarRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [legend, setLegend] = useState<{ rota: number; approved: number; hod_approved: number }>({
    rota: 0,
    approved: 0,
    hod_approved: 0,
  });

  useEffect(() => {
    async function loadCalendar() {
      // In demo mode, use the CS department for the HOD
      const departmentId = 'dept-cs';

      const [apps, rotas, slots] = await Promise.all([
        listApplicationsByDepartment(departmentId),
        listRotasByDepartment(departmentId),
        listRotaSlotsByDepartment(departmentId),
      ]);

      const events: CalendarEvent[] = [];

      // Rota slots — grey
      slots.forEach((slot: RotaSlot) => {
        const user = Users.byId(slot.user_id);
        const leaveType = slot.leave_type_id
          ? LeaveTypes.byId(slot.leave_type_id)?.name ?? 'Leave'
          : 'Leave';
        events.push({
          title: `${user?.full_name ?? 'Staff'} — ${leaveType}`,
          start: slot.slot_start,
          end: slot.slot_end,
          color: EVENT_COLORS.rota.bg,
          textColor: EVENT_COLORS.rota.text,
          extendedProps: {
            type: 'rota',
            staffName: user?.full_name ?? 'Unknown',
            leaveType,
          },
        });
      });

      // Approved and HOD-approved applications
      const statusCounts = { rota: slots.length, approved: 0, hod_approved: 0 };

      (apps as LeaveApplicationWithRelations[]).forEach((app) => {
        if (app.status === 'approved' || app.status === 'hod_approved') {
          const leaveType = app.leave_type?.name ?? 'Leave';
          const colors =
            app.status === 'approved' ? EVENT_COLORS.approved : EVENT_COLORS.hod_approved;

          events.push({
            title: `${app.applicant?.full_name ?? 'Staff'} — ${leaveType}`,
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
      setLoading(false);

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
    }

    loadCalendar();
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Department Calendar"
        description="Full view of published rota slots and leave applications for your department."
      />

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6">
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
            Pending HR ({legend.hod_approved})
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
