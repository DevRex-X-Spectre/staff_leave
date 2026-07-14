'use client';

import { useState, useTransition } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { formatDate, timeAgo } from '@/lib/utils';
import { registrarDecisionAction } from '@/app/actions/approvals';
import { ApplicationBreakdown, isCasualLeave } from '@/components/leave/application-breakdown';
import { CheckCircle, XCircle } from 'lucide-react';
import type { LeaveApplicationWithRelations } from '@/types';
import { toast } from 'sonner';

export function RegistrarRequestsClient({
  applications,
}: {
  applications: LeaveApplicationWithRelations[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [howFinanced, setHowFinanced] = useState<'university' | 'applicant'>('university');
  const [isPending, startTransition] = useTransition();

  const selectedApp = applications.find((a) => a.id === selected) ?? null;
  const closeDialog = () => {
    setAction(null);
    setComment('');
    setHowFinanced('university');
    setSelected(null);
  };

  const handleDecision = (appId: string, decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !comment.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    startTransition(async () => {
      const result = await registrarDecisionAction({
        applicationId: appId,
        decision,
        comment,
        howFinanced: selectedApp && isCasualLeave(selectedApp) ? howFinanced : null,
      });
      if (result.ok) {
        toast.success(decision === 'approve' ? 'Leave fully approved.' : 'Leave rejected.');
      } else {
        toast.error(result.message);
      }
      closeDialog();
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Registrar Approval Queue"
        description="Final approval. Confirm the applicant's staff ID, rank, department, and complete leave details before deciding."
      />

      <Card>
        <CardTitle className="mb-4">Awaiting Registrar approval ({applications.length})</CardTitle>

        {applications.length === 0 ? (
          <EmptyState icon={CheckCircle} title="All caught up" description="No applications awaiting Registrar approval." />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Staff ID', 'Rank', 'Department', 'Leave type', 'Dates', 'Days', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">{app.applicant_name ?? app.applicant?.full_name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{app.applicant_staff_id ?? app.applicant?.staff_id ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">{app.applicant_rank ?? app.applicant?.rank ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{app.department?.name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{app.leave_type?.name ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">{formatDate(app.start_date)} - {formatDate(app.end_date)}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{app.total_days}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelected(app.id); setAction('approve'); }}><CheckCircle size={13} />Approve</Button>
                        <Button variant="outline-danger" size="sm" onClick={() => { setSelected(app.id); setAction('reject'); }}><XCircle size={13} />Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedApp && action && (
        <Dialog
          open
          onClose={closeDialog}
          title={action === 'approve' ? 'Review and finalise leave approval' : 'Review and reject leave request'}
          description={action === 'approve' ? 'Confirm all details before final approval and entitlement deduction.' : 'Review the full application and state the reason for rejection.'}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            <ApplicationBreakdown application={selectedApp} />

            {action === 'approve' && isCasualLeave(selectedApp) && (
              <fieldset>
                <legend className="block text-[13px] font-medium text-[var(--text-secondary)] mb-2">How financed</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    ['university', 'University'],
                    ['applicant', 'Applicant'],
                  ] as const).map(([value, label]) => (
                    <label key={value} className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] cursor-pointer">
                      <input type="radio" name="registrar-finance" value={value} checked={howFinanced === value} onChange={() => setHowFinanced(value)} />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <FormField label={action === 'reject' ? 'Reason (required)' : 'Registrar comment (optional)'}>
              <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder={action === 'reject' ? 'Enter reason for rejection...' : 'Optional comment...'} rows={3} />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button variant={action === 'approve' ? 'ink' : 'danger'} disabled={isPending || (action === 'reject' && !comment.trim())} onClick={() => handleDecision(selectedApp.id, action)}>
              {isPending ? 'Processing...' : action === 'approve' ? 'Confirm final approval' : 'Confirm rejection'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
