'use client';

import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import type { LeaveApplicationWithRelations } from '@/types';
import { AlertTriangle, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { documentLabelFor } from '@/lib/leave-docs';
import { getSupportingDocUrlAction } from '@/app/actions/leave-docs';
import { toast } from 'sonner';

export function isCasualLeave(application: LeaveApplicationWithRelations): boolean {
  return application.leave_type?.name.toLowerCase() === 'casual leave';
}

export function ApplicationBreakdown({
  application,
  compact = false,
}: {
  application: LeaveApplicationWithRelations;
  compact?: boolean;
}) {
  const casual = isCasualLeave(application);
  const applicantName = application.applicant_name ?? application.applicant?.full_name ?? '-';
  const applicantStaffId = application.applicant_staff_id ?? application.applicant?.staff_id ?? '-';
  const applicantRank = application.applicant_rank ?? application.applicant?.rank ?? '-';
  const rows: [string, string][] = [
    ['Applicant', applicantName],
    ['Staff ID', applicantStaffId],
    ['Rank', applicantRank],
    ['Department', application.department?.name ?? '-'],
    ['Leave type', application.leave_type?.name ?? '-'],
    ['Period of absence', `${formatDate(application.start_date)} - ${formatDate(application.end_date)}`],
    ['Working days', String(application.total_days)],
    ...(casual ? [['Destination', application.destination || '-'] as [string, string]] : []),
    ['Responsible staff', application.cover_staff?.full_name ?? 'Not specified'],
  ];

  const [docLoading, setDocLoading] = useState(false);

  async function handleDownload() {
    setDocLoading(true);
    try {
      const res = await getSupportingDocUrlAction(application.id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      // Signed URLs from Supabase storage carry download:true so the browser
      // saves to disk; opening in a new tab keeps it obvious to the reviewer.
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not open document.');
    } finally {
      setDocLoading(false);
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-0 rounded-[var(--radius-md)] bg-[var(--bg-subtle)] px-3 sm:px-4">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-start justify-between gap-4 py-2.5 border-b border-[var(--border-subtle)] sm:odd:pr-4 sm:even:pl-4 last:border-b sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
          >
            <span className="text-[12px] text-[var(--text-secondary)] shrink-0">{label}</span>
            <span className="text-[12px] font-medium text-[var(--text-primary)] text-right break-words">{value}</span>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">
          Reason for absence
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--text-primary)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] p-3">
          {application.reason}
        </p>
      </div>

      {application.supporting_doc_url && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={15} className="text-[var(--text-secondary)] shrink-0" />
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                {documentLabelFor(application.leave_type?.name)}
              </p>
              <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                {application.supporting_doc_name ?? 'Uploaded document'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={docLoading}
          >
            {docLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            View / Download
          </Button>
        </div>
      )}

      {application.rota_conflict && (
        <div className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--warning)]/20 bg-[var(--warning-bg)] p-3">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--warning)]" />
          <p className="text-[12px] leading-relaxed text-[var(--warning)]">
            This leave period overlaps a published departmental rota slot.
          </p>
        </div>
      )}
    </div>
  );
}
