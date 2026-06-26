import { requireRole } from '@/lib/auth';
import { listApprovalRequests, listUsers, listDepartments, listLeaveTypes } from '@/lib/data/dal';
import { PageHeader, StatCard } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { StatusBadge, RoleBadge } from '@/components/ui/badge';
import { formatDate, timeAgo } from '@/lib/utils';
import { UsersRound, Building2, CalendarDays, CheckCircle } from 'lucide-react';

export default async function AdminDashboardPage() {
  await requireRole('admin');

  const [pending, allUsers, depts, leaveTypes] = await Promise.all([
    listApprovalRequests('pending'),
    listUsers(),
    listDepartments(),
    listLeaveTypes(),
  ]);

  const stats = [
    {
      label: 'Pending approvals',
      value: pending.length,
      icon: CheckCircle,
    },
    {
      label: 'Total staff',
      value: allUsers.filter((u) => u.role === 'staff').length,
      icon: UsersRound,
    },
    {
      label: 'Departments',
      value: depts.length,
      icon: Building2,
    },
    {
      label: 'Leave types',
      value: leaveTypes.filter((l) => l.is_active).length,
      icon: CalendarDays,
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Admin Dashboard"
        description="System overview and management."
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending approvals */}
        <Card>
          <CardTitle className="mb-4">Pending account approvals</CardTitle>
          {pending.length === 0 ? (
            <p className="text-[13px] text-[var(--text-secondary)]">No pending requests.</p>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {pending.slice(0, 5).map((req) => (
                <div key={req.id} className="py-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      {req.user?.full_name ?? '—'}
                    </p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      {req.user?.email ?? ''} · {req.requested_role}
                    </p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                      {timeAgo(req.created_at)}
                    </p>
                  </div>
                  <RoleBadge role={req.requested_role} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Staff overview */}
        <Card>
          <CardTitle className="mb-4">Staff by role</CardTitle>
          <div className="space-y-3">
            {(['admin', 'hod', 'hr_manager', 'staff'] as const).map((role) => {
              const count = allUsers.filter((u) => u.role === role).length;
              const pct = allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0;
              return (
                <div key={role} className="flex items-center gap-3">
                  <RoleBadge role={role} />
                  <div className="flex-1 h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--ink)] rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[13px] text-[var(--text-secondary)] w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
