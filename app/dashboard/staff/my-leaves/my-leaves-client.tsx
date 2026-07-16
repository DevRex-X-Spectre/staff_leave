'use client';

import { useRef, useState, useTransition } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/stat-card';
import { formatDate } from '@/lib/utils';
import { LeaveTracker } from '@/components/leave/leave-tracker';
import { cancelLeaveAction } from '@/app/actions/leave';
import {
  deleteSupportingDocAction,
  getSupportingDocUrlAction,
  uploadSupportingDocAction,
} from '@/app/actions/leave-docs';
import { documentLabelFor } from '@/lib/leave-docs';
import { downloadLeaveApprovalPdf } from '@/lib/pdf';
import type { LeaveApproval, LeaveApplicationWithRelations } from '@/types';
import { Calendar, Download, FileText, Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function MyLeavesClient({
  applications,
  approvalsByApplication,
}: {
  applications: LeaveApplicationWithRelations[];
  approvalsByApplication: Record<string, LeaveApproval[]>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [docBusy, setDocBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    setCancelling(id);
    startTransition(async () => {
      const result = await cancelLeaveAction(id);
      if (result.ok) {
        toast.success('Application cancelled.');
      } else {
        toast.error(result.message);
      }
      setCancelling(null);
      setShowCancel(null);
      setSelected(null);
    });
  };

  const selectedApp = applications.find((a) => a.id === selected) ?? null;

  async function handleView(app: LeaveApplicationWithRelations) {
    setDocBusy(true);
    try {
      const res = await getSupportingDocUrlAction(app.id);
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      window.open(res.url, '_blank', 'noopener,noreferrer');
    } finally {
      setDocBusy(false);
    }
  }

  function handleReplace(app: LeaveApplicationWithRelations, file: File) {
    setDocBusy(true);
    const fd = new FormData();
    fd.set('application_id', app.id);
    fd.set('file', file);
    startTransition(async () => {
      const res = await uploadSupportingDocAction(fd);
      if (res.ok) toast.success('Document replaced.');
      else toast.error(res.message);
      setDocBusy(false);
    });
  }

  function handleDelete(app: LeaveApplicationWithRelations) {
    setDocBusy(true);
    startTransition(async () => {
      const res = await deleteSupportingDocAction(app.id);
      if (res.ok) toast.success('Document deleted.');
      else toast.error(res.message);
      setConfirmDelete(null);
      setDocBusy(false);
    });
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Leave History"
        description="Track all your leave applications and their status."
      />

      <Card>
        <CardTitle className="mb-4">Applications</CardTitle>

        {applications.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No applications yet"
            description="Apply for leave to see your history here."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Leave type', 'Dates', 'Days', 'Status', 'Submitted', 'Actions'].map((h) => (
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
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
                    onClick={() => setSelected(app.id)}
                  >
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-primary)]">
                      {app.leave_type?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
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
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        {(app.status === 'pending' || app.status === 'hod_approved') && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCancel(app.id);
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                        {app.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              try {
                                downloadLeaveApprovalPdf(app, approvalsByApplication[app.id] ?? []);
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : 'Could not create PDF.');
                              }
                            }}
                          >
                            <Download size={13} />
                            PDF
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail drawer */}
      {selectedApp && (
        <Dialog
          open={!!selectedApp}
          onClose={() => setSelected(null)}
          title="Leave application details"
          className="max-w-lg"
        >
          <div className="space-y-5">
            <div>
              <p className="text-[11px] text-center font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                Progress
              </p>
              <LeaveTracker status={selectedApp.status} />
            </div>

            <div className="space-y-2.5">
              {[
                ['Staff ID', selectedApp.applicant_staff_id ?? selectedApp.applicant?.staff_id ?? '-'],
                ['Rank', selectedApp.applicant_rank ?? selectedApp.applicant?.rank ?? '-'],
                ['Leave type', selectedApp.leave_type?.name ?? '-'],
                ['Department', selectedApp.department?.name ?? '-'],
                ['Start date', formatDate(selectedApp.start_date)],
                ['End date', formatDate(selectedApp.end_date)],
                ['Working days', String(selectedApp.total_days)],
                ...(selectedApp.destination ? [['Destination', selectedApp.destination] as [string, string]] : []),
                ['Covering staff', selectedApp.cover_staff?.full_name ?? 'Not specified'],
                ['Submitted', formatDate(selectedApp.created_at)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
                >
                  <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
                  <span className="text-[13px] font-medium text-[var(--text-primary)]">{value}</span>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Reason
              </p>
              <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">
                {selectedApp.reason}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-2">
                Supporting document
              </p>
              {selectedApp.supporting_doc_url ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                    <FileText size={15} className="text-[var(--text-secondary)] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">
                        {documentLabelFor(selectedApp.leave_type?.name)}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                        {selectedApp.supporting_doc_name ?? 'Uploaded document'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(selectedApp)}
                      disabled={docBusy}
                    >
                      {docBusy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Download size={13} />
                      )}
                      View / Download
                    </Button>
                    {selectedApp.status === 'pending' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => replaceInputRef.current?.click()}
                          disabled={docBusy}
                        >
                          <Upload size={13} />
                          Replace
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setConfirmDelete(selectedApp.id)}
                          disabled={docBusy}
                        >
                          <Trash2 size={13} />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                  {/* Hidden file input — clicking Replace triggers it. Resetting
                      e.target.value lets the user re-pick the same file. */}
                  <input
                    ref={replaceInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleReplace(selectedApp, f);
                      e.target.value = '';
                    }}
                  />
                </div>
              ) : selectedApp.leave_type?.requires_document ? (
                <div className="p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-[var(--radius-md)]">
                  <p className="text-[12px] text-[var(--warning)]">
                    This leave type requires a document but none is attached yet.
                    {selectedApp.status === 'pending'
                      ? ' Use Replace below to attach one before the HOD reviews it.'
                      : ''}
                  </p>
                  {selectedApp.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => replaceInputRef.current?.click()}
                      disabled={docBusy}
                    >
                      <Upload size={13} />
                      Attach document
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-[12px] text-[var(--text-tertiary)]">
                  None required for this leave type.
                </p>
              )}
            </div>

            {selectedApp.rota_conflict && (
              <div className="p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-[var(--radius-md)]">
                <p className="text-[12px] text-[var(--warning)]">
                  This application conflicts with the published departmental leave rota.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-[var(--text-secondary)]">Current status</span>
                <StatusBadge status={selectedApp.status} />
              </div>
              {selectedApp.status === 'approved' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    try {
                      downloadLeaveApprovalPdf(selectedApp, approvalsByApplication[selectedApp.id] ?? []);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Could not create PDF.');
                    }
                  }}
                >
                  <Download size={14} />
                  Download approval PDF
                </Button>
              )}
            </div>
          </div>
        </Dialog>
      )}

      {showCancel && (
        <ConfirmDialog
          open
          onClose={() => setShowCancel(null)}
          onConfirm={() => handleCancel(showCancel)}
          title="Cancel this application?"
          description="This action cannot be undone."
          confirmLabel="Cancel application"
          variant="danger"
          loading={cancelling === showCancel}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          open
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            const app = applications.find((a) => a.id === confirmDelete);
            if (app) handleDelete(app);
          }}
          title="Delete the supporting document?"
          description="The document will be removed from storage and can be re-uploaded while the application is pending."
          confirmLabel="Delete document"
          variant="danger"
          loading={docBusy}
        />
      )}
    </div>
  );
}
