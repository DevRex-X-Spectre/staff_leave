'use client';

import { useMemo } from 'react';
import { PageHeader, StatCard } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, CalendarDays, FileText } from 'lucide-react';
import { useApplications } from '@/lib/local/data-hooks';

export function HrDashboardClient() {
  const allApps = useApplications();

  const { pending, approved, rejected, onLeave } = useMemo(() => {
    const pending = allApps.filter((a) => a.status === 'hod_approved');
    const approved = allApps.filter((a) => a.status === 'approved');
    const rejected = allApps.filter((a) => a.status === 'rejected');
    const now = new Date().toISOString().split('T')[0];
    const onLeave = allApps.filter(
      (a) =>
        a.status === 'approved' &&
        a.start_date <= now &&
        a.end_date >= now
    );
    return { pending, approved, rejected, onLeave };
  }, [allApps]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="HR Dashboard" description="Leave management overview." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Awaiting HR approval" value={pending.length} icon={Clock} />
        <StatCard label="Approved (all time)" value={approved.length} icon={CheckCircle} />
        <StatCard label="Rejected (all time)" value={rejected.length} icon={XCircle} />
        <StatCard label="Currently on leave" value={onLeave.length} icon={CalendarDays} />
      </div>

      {/* Pending HR approval */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Applications awaiting HR approval</CardTitle>
            <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
              These have been approved by HOD and need your final sign-off.
            </p>
          </div>
          <Link href="/dashboard/hr/requests">
            <Button variant="outline" size="sm">Review all</Button>
          </Link>
        </div>

        {pending.length === 0 ? (
          <div className="py-10 text-center">
            <FileText size={28} strokeWidth={1} className="mx-auto text-[var(--text-tertiary)] mb-3" />
            <p className="text-[13px] text-[var(--text-secondary)]">
              No applications awaiting HR approval.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Department', 'Leave type', 'Dates', 'Days', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {pending.slice(0, 8).map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {app.applicant?.full_name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.department?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(app.start_date)} – {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <Link href="/dashboard/hr/requests">
                        <Button variant="outline" size="sm">Review</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
