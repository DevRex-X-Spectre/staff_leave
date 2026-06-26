'use client';

import { useEffect, useRef } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/stat-card';

export default function StaffRotaPage() {
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Lazy-load FullCalendar client-side
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
          events: [
            // Sample event — in real app, resolve from RotaSlotsByDepartment
            { title: 'Engr. Adekunle — Annual', start: '2026-07-15', end: '2026-07-19', color: '#101010' },
            { title: 'Ms. Yusuf — Annual', start: '2026-08-04', end: '2026-08-08', color: '#6b7280' },
          ],
          eventDisplay: 'block',
        }).render();
      });
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Rota"
        description="Published departmental leave schedule. Dates with staff on leave are shown below."
      />

      <Card padding={false}>
        <div className="p-6 border-b border-[var(--border-subtle)]">
          <CardTitle>Departmental Rota</CardTitle>
          <CardDescription className="mt-1">
            Only the number of staff on leave is shown per day — individual names are
            hidden to protect privacy.
          </CardDescription>
        </div>
        <div className="p-6">
          <div ref={calendarRef} className="fc" />
        </div>
      </Card>
    </div>
  );
}
