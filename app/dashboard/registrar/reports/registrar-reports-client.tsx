'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { FileSpreadsheet, FileText } from 'lucide-react';
import type { Department, LeaveApplicationWithRelations } from '@/types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
// jspdf-autotable@5 is a standalone plugin that must be explicitly attached
// to the jsPDF class (it no longer auto-registers itself in jspdf@4).
import { applyPlugin } from 'jspdf-autotable';
applyPlugin(jsPDF);

export function RegistrarReportsClient({
  applications,
  departments,
}: {
  applications: LeaveApplicationWithRelations[];
  departments: Department[];
}) {
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (filterDept && a.department_id !== filterDept) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (startDate && a.start_date < startDate) return false;
      if (endDate && a.end_date > endDate) return false;
      return true;
    });
  }, [applications, filterDept, filterStatus, startDate, endDate]);

  const exportExcel = () => {
    const rows = filtered.map((a) => ({
      Staff: a.applicant?.full_name ?? '-',
      Email: a.applicant?.email ?? '-',
      Department: a.department?.name ?? '-',
      'Leave Type': a.leave_type?.name ?? '-',
      'Start Date': a.start_date,
      'End Date': a.end_date,
      'Days': a.total_days,
      Status: a.status,
      Submitted: a.created_at.split('T')[0],
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Report');
    XLSX.writeFile(wb, `naub-leave-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('NAUB Leave Report', 14, 20);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    const rows = filtered.map((a) => [
      a.applicant?.full_name ?? '-',
      a.department?.name ?? '-',
      a.leave_type?.name ?? '-',
      a.start_date,
      a.end_date,
      String(a.total_days),
      a.status,
    ]);
    doc.autoTable({
      head: [['Staff', 'Department', 'Leave Type', 'Start', 'End', 'Days', 'Status']],
      body: rows,
      startY: 34,
    });
    doc.save(`naub-leave-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalDays = filtered.reduce((s, a) => s + a.total_days, 0);
  const approvedDays = filtered
    .filter((a) => a.status === 'approved')
    .reduce((s, a) => s + a.total_days, 0);
  const pending = filtered.filter(
    (a) => a.status === 'pending' || a.status === 'hod_approved'
  ).length;
  const rejected = filtered.filter(
    (a) => a.status === 'rejected' || a.status === 'hod_rejected'
  ).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="Leave usage analytics with export to Excel and PDF."
      />
      <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-6">
        <Button variant="outline" size="sm" onClick={exportExcel}>
          <FileSpreadsheet size={14} />
          Export Excel
        </Button>
        <Button variant="outline" size="sm" onClick={exportPdf}>
          <FileText size={14} />
          Export PDF
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-5 sm:mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <FormField label="Department">
            <Select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="hod_approved">HOD Approved</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </FormField>
          <FormField label="From date">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="To date">
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Card padding>
          <p className="text-[12px] text-[var(--text-secondary)]">Total records</p>
          <p className="text-[24px] font-semibold text-[var(--text-primary)] mt-1">{filtered.length}</p>
        </Card>
        <Card padding>
          <p className="text-[12px] text-[var(--text-secondary)]">Total leave days</p>
          <p className="text-[24px] font-semibold text-[var(--text-primary)] mt-1">{totalDays}</p>
        </Card>
        <Card padding>
          <p className="text-[12px] text-[var(--text-secondary)]">Approved days</p>
          <p className="text-[24px] font-semibold text-[var(--text-primary)] mt-1">{approvedDays}</p>
        </Card>
        <Card padding>
          <p className="text-[12px] text-[var(--text-secondary)]">Pending / Rejected</p>
          <p className="text-[24px] font-semibold text-[var(--text-primary)] mt-1">{pending} / {rejected}</p>
        </Card>
      </div>

      {/* Full table */}
      <Card>
        <CardTitle className="mb-4">{filtered.length} records</CardTitle>
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-[var(--text-secondary)]">No records match the selected filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Department', 'Leave type', 'Start', 'End', 'Days', 'Status'].map((h) => (
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
                {filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {app.applicant?.full_name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.department?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {app.start_date}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {app.end_date}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.status}
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