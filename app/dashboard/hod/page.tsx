import { requireRole } from '@/lib/auth';
import {
  listApplicationsByDepartment,
  listDepartments,
} from '@/lib/data/dal';
import { PageHeader, StatCard } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { formatDate, timeAgo } from '@/lib/utils';
import Link from 'next/link';
import { Clock, CheckCircle, CalendarRange } from 'lucide-react';

export default async function HodDashboardPage() {
  const user = await requireRole('hod');

  const [dept, pendingApps, allApps] = await Promise.all([
    listDepartments(),
    listApplicationsByDepartment(user.department_id!, ['pending']),
    listApplicationsByDepartment(user.department_id!),
  ]);

  const department = dept.find((d) => d.id === user.department_id);
  const approved = allApps.filter((a) => a.status === 'approved').length;
  const awaiting = allApps.filter((a) => a.status === 'hod_approved').length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="HOD Dashboard"
        description={
          department
            ? `${department.name} · Head of Department`
            : 'Department overview'
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Awaiting your review"
          value={pendingApps.length}
          icon={Clock}
        />
        <StatCard
          label="Awaiting HR approval"
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Leave type', 'Dates', 'Days', 'Submitted', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {pendingApps.slice(0, 8).map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 text-[13px] font-medium text-[var(--text-primary)]">
                      {app.applicant?.full_name ?? '—'}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '—'}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {formatDate(app.start_date)} – {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(app.created_at)}
                    </td>
                    <td className="py-3">
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
