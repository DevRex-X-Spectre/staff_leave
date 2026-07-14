'use client';

import { useMemo, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Select, FormField, Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { downloadLeaveApprovalPdf } from '@/lib/pdf';
import type { Department, LeaveApproval, LeaveApplicationWithRelations } from '@/types';
import { Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function RegistrarAllApplicationsClient({
  applications,
  departments,
  approvalsByApplication,
}: {
  applications: LeaveApplicationWithRelations[];
  departments: Department[];
  approvalsByApplication: Record<string, LeaveApproval[]>;
}) {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return applications.filter((application) => {
      if (filterStatus && application.status !== filterStatus) return false;
      if (filterDept && application.department_id !== filterDept) return false;
      const applicantName = application.applicant_name ?? application.applicant?.full_name ?? '';
      const staffId = application.applicant_staff_id ?? application.applicant?.staff_id ?? '';
      const query = search.toLowerCase();
      if (query && !applicantName.toLowerCase().includes(query) && !staffId.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [applications, filterStatus, filterDept, search]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Applications"
        description="System-wide view of all leave applications and their approved documents."
      />

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <Input
          placeholder="Search staff name or ID..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-xs"
        />
        <FormField label="">
          <Select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="hod_approved">HOD Approved</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </Select>
        </FormField>
        <FormField label="">
          <Select value={filterDept} onChange={(event) => setFilterDept(event.target.value)}>
            <option value="">All departments</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>{department.name}</option>
            ))}
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
                  {['Staff', 'Staff ID', 'Rank', 'Department', 'Leave type', 'Dates', 'Days', 'Status', 'Document'].map((heading) => (
                    <th key={heading} className="text-left py-2.5 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {filtered.map((application) => (
                  <tr key={application.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{application.applicant_name ?? application.applicant?.full_name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{application.applicant_staff_id ?? application.applicant?.staff_id ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{application.applicant_rank ?? application.applicant?.rank ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{application.department?.name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{application.leave_type?.name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">{formatDate(application.start_date)} - {formatDate(application.end_date)}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{application.total_days}</td>
                    <td className="py-3 px-3 sm:px-4"><StatusBadge status={application.status} /></td>
                    <td className="py-3 px-3 sm:px-4">
                      {application.status === 'approved' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              downloadLeaveApprovalPdf(application, approvalsByApplication[application.id] ?? []);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Could not create PDF.');
                            }
                          }}
                        >
                          <Download size={13} />
                          PDF
                        </Button>
                      ) : (
                        <span className="text-[12px] text-[var(--text-tertiary)]">-</span>
                      )}
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
