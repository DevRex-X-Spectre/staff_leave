'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/stat-card';
import { Select, FormField, Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { listAllApplications } from '@/lib/data/dal';
import type { LeaveApplicationWithRelations } from '@/types';
import { FileText } from 'lucide-react';

export default function HrAllApplicationsPage() {
  const [apps, setApps] = useState< LeaveApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    listAllApplications().then((data) => {
      setApps(data as LeaveApplicationWithRelations[]);
      setLoading(false);
    });
  }, []);

  const filtered = apps.filter((a) => {
    if (filterStatus && a.status !== filterStatus) return false;
    if (filterDept && a.department_id !== filterDept) return false;
    if (search && !(a.applicant?.full_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const depts = Array.from(new Set(apps.map((a) => a.department?.name).filter(Boolean) as string[]));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Applications"
        description="System-wide view of all leave applications."
      />

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Input
          placeholder="Search staff name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <FormField label="">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="hod_approved">HOD Approved</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </FormField>
        <span className="text-[13px] text-[var(--text-secondary)] mt-5">{filtered.length} records</span>
      </div>

      <Card padding={false}>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No records" description="No applications match the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Department', 'Leave type', 'Dates', 'Days', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-4 text-[13px] font-medium text-[var(--text-primary)]">{app.applicant?.full_name ?? '—'}</td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">{app.department?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">{app.leave_type?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">{formatDate(app.start_date)} – {formatDate(app.end_date)}</td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">{app.total_days}</td>
                    <td className="py-3 px-4"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-4 text-[12px] text-[var(--text-tertiary)]">{formatDate(app.created_at)}</td>
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
