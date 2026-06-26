'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/stat-card';
import { Select, FormField } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { listApplicationsByDepartment } from '@/lib/data/dal';
import type { LeaveApplicationWithRelations } from '@/types';
import { FileText } from 'lucide-react';

export default function HodAllRequestsPage() {
  const [apps, setApps] = useState< LeaveApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    listApplicationsByDepartment('dept-cs').then((data) => {
      setApps(data as LeaveApplicationWithRelations[]);
      setLoading(false);
    });
  }, []);

  const filtered = filterStatus
    ? apps.filter((a) => a.status === filterStatus)
    : apps;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Department Requests"
        description="Complete history of leave requests from your department."
      />

      <div className="flex items-center gap-3 mb-6">
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
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No requests" description="No requests match the selected filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Leave type', 'Dates', 'Days', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-4 text-[13px] font-medium text-[var(--text-primary)]">
                      {app.applicant?.full_name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">
                      {formatDate(app.start_date)} – {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[var(--text-tertiary)]">
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
