'use client';

import { useMemo, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Select, FormField, Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { useApplications, useDepartments } from '@/lib/local/data-hooks';
import type { LeaveApplicationWithRelations, LeaveStatus } from '@/types';
import { FileText } from 'lucide-react';

export function RegistrarAllApplicationsClient() {
  const apps = useApplications();
  const departments = useDepartments();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      if (filterStatus && a.status !== filterStatus) return false;
      if (filterDept && a.department_id !== filterDept) return false;
      if (
        search &&
        !(a.applicant?.full_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [apps, filterStatus, filterDept, search]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Applications"
        description="System-wide view of all leave applications."
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <Input
          placeholder="Search staff name..."
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
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No records" description="No applications match the selected filters." />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Department', 'Leave type', 'Dates', 'Days', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{app.applicant?.full_name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{app.department?.name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{app.leave_type?.name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">{formatDate(app.start_date)} - {formatDate(app.end_date)}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{app.total_days}</td>
                    <td className="py-3 px-3 sm:px-4"><StatusBadge status={app.status} /></td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)]">{formatDate(app.created_at)}</td>
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