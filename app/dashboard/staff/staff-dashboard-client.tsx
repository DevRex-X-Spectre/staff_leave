'use client';

import { useMemo } from 'react';
import { PageHeader, ProgressBar } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { CalendarDays, Plus } from 'lucide-react';
import { useApplications, useDepartment, useLeaveBalances } from '@/lib/local/data-hooks';
import { useAuth } from '@/components/providers/auth-provider';

export function StaffDashboardClient() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const departmentId = currentUser?.department_id ?? null;

  const balances = useLeaveBalances(userId);
  const applications = useApplications({ applicantId: userId ?? undefined });
  const department = useDepartment(departmentId);

  const { pending, approved } = useMemo(() => {
    return {
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
    };
  }, [applications]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welcome back, ${currentUser?.full_name?.split(' ')[0] ?? ''}`}
        description={department ? `Department: ${department.name}` : undefined}
        actions={
          <Link href="/dashboard/staff/apply">
            <Button variant="ink">
              <Plus size={15} />
              Apply for leave
            </Button>
          </Link>
        }
      />

      {/* Leave balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {balances.length === 0 ? (
          <p className="text-[13px] text-[var(--text-secondary)] col-span-full">
            No leave entitlements found. Contact your Registrar.
          </p>
        ) : (
          balances.map((b) => (
            <Card key={b.leave_type.id} padding>
              <div className="flex items-start justify-between mb-3">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {b.leave_type.name}
                </p>
                <CalendarDays
                  size={15}
                  className="text-[var(--text-tertiary)]"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-[24px] font-semibold text-[var(--text-primary)]">
                  {b.remaining_days}
                </span>
                <span className="text-[13px] text-[var(--text-secondary)]">
                  / {b.total_days} days remaining
                </span>
              </div>
              <ProgressBar value={b.used_days} max={b.total_days} />
              <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">
                {b.used_days} days used
              </p>
            </Card>
          ))
        )}
      </div>

      {/* Recent applications */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Recent applications</CardTitle>
          <Link href="/dashboard/staff/my-leaves">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="py-8 text-center">
            <CalendarDays
              size={28}
              strokeWidth={1}
              className="mx-auto text-[var(--text-tertiary)] mb-3"
            />
            <p className="text-[13px] text-[var(--text-secondary)]">
              No leave applications yet.
            </p>
            <Link href="/dashboard/staff/apply" className="mt-3 inline-block">
              <Button variant="outline" size="sm">Apply now</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  <th className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5">
                    Leave type
                  </th>
                  <th className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5">
                    Dates
                  </th>
                  <th className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5">
                    Days
                  </th>
                  <th className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5">
                    Status
                  </th>
                  <th className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5">
                    Applied
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {applications.slice(0, 5).map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-primary)]">
                      {app.leave_type?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {formatDate(app.start_date)} - {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)]">
                      {formatDate(app.created_at)}
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
