'use client';

import { useMemo, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { Select, FormField } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import type { LeaveApplicationWithRelations } from '@/types';
import { FileText } from 'lucide-react';

export function HodAllRequestsClient({
  initialApplications,
}: {
  initialApplications: LeaveApplicationWithRelations[];
}) {
  const [apps] = useState<LeaveApplicationWithRelations[]>(initialApplications);
  const [filterStatus, setFilterStatus] = useState('');

  const filtered = useMemo(
    () => (filterStatus ? apps.filter((a) => a.status === filterStatus) : apps),
    [filterStatus, apps]
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Department Requests"
        description="Complete history of leave requests from your department."
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <FormField label="">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="hod_approved">HOD Approved</option>
            <option value="approved">Approved</option>
            <option value="hod_rejected">HOD Rejected</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </FormField>
        <span className="text-[13px] text-[var(--text-secondary)] mt-5">
          {filtered.length} records
        </span>
      </div>

      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No requests" description="No requests match the selected filter." />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Leave type', 'Dates', 'Days', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {app.applicant?.full_name ?? '\u2014'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '\u2014'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(app.start_date)} \u2013 {formatDate(app.end_date)}
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