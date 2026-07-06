'use client';

import { useState, useTransition } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { formatDate, timeAgo } from '@/lib/utils';
import { useApplications } from '@/lib/local/data-hooks';
import { useAuth } from '@/components/providers/auth-provider';
import {
  Applications,
  Approvals,
  LeaveTypes,
  Notifications,
  Users,
} from '@/lib/local/store';
import type { ApprovalDecision, LeaveStatus } from '@/types';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function HodRequestsClient() {
  const { currentUser } = useAuth();
  const departmentId = currentUser?.department_id ?? null;
  const apps = useApplications({ departmentId: departmentId ?? undefined, status: ['pending'] });
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedApp = apps.find((a) => a.id === selected) ?? null;

  const handleDecision = (appId: string, decision: 'approve' | 'reject') => {
    if (!currentUser) return;
    if (decision === 'reject' && !comment.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    startTransition(() => {
      try {
        const app = Applications.byId(appId);
        if (!app) {
          toast.error('Application not found.');
          return;
        }
        if (app.department_id !== currentUser.department_id) {
          toast.error('Forbidden.');
          return;
        }
        const decisionValue: ApprovalDecision = decision === 'approve' ? 'approved' : 'rejected';
        const nextStatus: LeaveStatus = decision === 'approve' ? 'hod_approved' : 'hod_rejected';

        // 1) Update application status
        Applications.update(appId, { status: nextStatus });
        // 2) Audit row
        Approvals.insert({
          application_id: appId,
          approver_id: currentUser.id,
          approver_role: 'hod',
          decision: decisionValue,
          comment: comment || null,
        });
        // 3) Notify applicant + HR managers
        const applicant = Users.byId(app.applicant_id);
        const lt = LeaveTypes.byId(app.leave_type_id);
        if (applicant && lt) {
          Notifications.insert({
            user_id: applicant.id,
            title:
              decision === 'approve'
                ? 'HOD approved your leave'
                : 'HOD rejected your leave',
            message:
              decision === 'approve'
                ? 'Your leave has been forwarded to HR for final approval.'
                : comment || 'Your HOD did not approve the leave.',
            type: decision === 'approve' ? 'leave_approved' : 'leave_rejected',
            is_read: false,
            related_application_id: appId,
          });
          const hrs = Users.all().filter((u) => u.role === 'hr_manager' && u.is_active);
          if (decision === 'approve') {
            hrs.forEach((hr) => {
              Notifications.insert({
                user_id: hr.id,
                title: 'Leave awaiting HR review',
                message: `${applicant.full_name}'s ${lt.name} request needs final approval.`,
                type: 'leave_submitted',
                is_read: false,
                related_application_id: appId,
              });
            });
          }
        }
        toast.success(
          decision === 'approve'
            ? 'Leave approved and forwarded to HR.'
            : 'Leave rejected.'
        );
        setAction(null);
        setComment('');
        setSelected(null);
      } catch (e) {
        toast.error(String(e instanceof Error ? e.message : e));
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Requests"
        description="Review and approve leave requests from your department."
      />

      <Card>
        <CardTitle className="mb-4">Pending your review ({apps.length})</CardTitle>

        {apps.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All caught up"
            description="No pending leave requests in your department."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Leave type', 'Dates', 'Days', 'Submitted', 'Conflict', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-2.5"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {apps.map((app) => (
                  <tr key={app.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {app.applicant?.full_name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(app.start_date)} – {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(app.created_at)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      {app.rota_conflict ? (
                        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--warning)]">
                          <AlertTriangle size={13} /> Conflict
                        </span>
                      ) : (
                        <span className="text-[12px] text-[var(--text-tertiary)]">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelected(app.id); setAction('approve'); }}
                        >
                          <CheckCircle size={13} />
                          Approve
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => { setSelected(app.id); setAction('reject'); }}
                        >
                          <XCircle size={13} />
                          Reject
                        </Button>
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
          onClose={() => { setAction(null); setComment(''); setSelected(null); }}
          title={action === 'approve' ? 'Approve leave request' : 'Reject leave request'}
          description={
            action === 'approve'
              ? 'Add an optional comment, then confirm.'
              : 'Provide a reason for rejection. The staff member will be notified.'
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)]">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                {selectedApp.applicant?.full_name}
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {selectedApp.leave_type?.name} · {formatDate(selectedApp.start_date)} –{' '}
                {formatDate(selectedApp.end_date)} · {selectedApp.total_days} days
              </p>
            </div>
            <FormField
              label={action === 'reject' ? 'Reason (required)' : 'Comment (optional)'}
            >
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  action === 'reject'
                    ? 'Enter reason for rejection'
                    : 'Optional comment...'
                }
                rows={3}
              />
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button
              variant="outline"
              onClick={() => { setAction(null); setComment(''); setSelected(null); }}
            >
              Cancel
            </Button>
            <Button
              variant={action === 'approve' ? 'ink' : 'danger'}
              disabled={action === 'reject' && !comment.trim()}
              onClick={() => handleDecision(selectedApp.id, action)}
            >
              {isPending
                ? 'Processing...'
                : action === 'approve'
                ? 'Confirm approval'
                : 'Confirm rejection'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
