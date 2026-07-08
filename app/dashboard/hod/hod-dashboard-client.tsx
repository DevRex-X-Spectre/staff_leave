'use client';

import { useMemo } from 'react';
import { PageHeader, StatCard } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Clock, CheckCircle, CalendarRange } from 'lucide-react';
import {
  useApplications,
  useDepartment,
} from '@/lib/local/data-hooks';
import { useAuth } from '@/components/providers/auth-provider';

export function HodDashboardClient() {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.department_id ?? null;

  const department = useDepartment(departmentId);
  const pendingApps = useApplications({
    departmentId: departmentId ?? undefined,
    status: ['pending'],
  });
  const allApps = useApplications({ departmentId: departmentId ?? undefined });

  const { approved, awaiting } = useMemo(() => {
    return {
      approved: allApps.filter((a) => a.status === 'approved').length,
      awaiting: allApps.filter((a) => a.status === 'hod_approved').length,
    };
  }, [allApps]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="HOD Dashboard"
        description={
          department
            ? `${department.name} Â· Head of Department`
            : 'Department overview'
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard
          label="Awaiting your review"
          value={pendingApps.length}
          icon={Clock}
        />
        <StatCard
          label="Awaiting Registrar approval"
          value={awaiting}
          icon={CheckCircle}
        />
        <StatCard label="Approved (total)" value={approved} icon={CheckCircle} />
        <StatCard
          label="Total applications"
          value={allApps.length}
          icon={CalendarRange}
        />
      </div>

      {/* Pending approvals */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Pending your review</CardTitle>
          <Link href="/dashboard/hod/requests">
            <Button variant="outline" size="sm">Review all</Button>
          </Link>
        </div>

        {pendingApps.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle
              size={28}
              strokeWidth={1}
              className="mx-auto text-[var(--success)] mb-3"
            />
            <p className="text-[13px] text-[var(--text-secondary)]">
              No pending requests. All caught up!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Leave type', 'Dates', 'Days', 'Submitted', 'Actions'].map((h) => (
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
                {pendingApps.slice(0, 8).map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {app.applicant?.full_name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(app.start_date)} â€“ {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(app.created_at)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <Link href="/dashboard/hod/requests">
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
