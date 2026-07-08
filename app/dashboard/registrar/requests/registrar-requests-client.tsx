'use client';

import { useState, useTransition } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { formatDate, timeAgo } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { useApplications } from '@/lib/local/data-hooks';
import {
  Applications,
  Approvals,
  Departments,
  Entitlements,
  LeaveTypes,
  Notifications,
  Users,
} from '@/lib/local/store';
import { CheckCircle, XCircle } from 'lucide-react';
import type { LeaveStatus } from '@/types';
import { toast } from 'sonner';

export function RegistrarRequestsClient() {
  const { currentUser } = useAuth();
  const apps = useApplications({ status: ['hod_approved'] });
  const [selected, setSelected] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedApp = apps.find((a) => a.id === selected) ?? null;

  const handleDecision = (appId: string, decision: 'approved' | 'rejected') => {
    if (decision === 'rejected' && !comment.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    if (!currentUser) return;
    startTransition(() => {
      try {
        const app = Applications.byId(appId);
        if (!app) {
          toast.error('Application not found.');
          return;
        }
        const nextStatus: LeaveStatus = decision === 'approved' ? 'approved' : 'rejected';
        // 1) Update application status
        Applications.update(appId, { status: nextStatus });
        // 2) Audit row
        Approvals.insert({
          application_id: appId,
          approver_id: currentUser.id,
          approver_role: 'hr_manager',
          decision,
          comment: comment || null,
        });
        // 3) Deduct from entitlement on approval
        if (decision === 'approved') {
          const year = new Date(app.start_date).getFullYear();
          const ent = Entitlements.byUser(app.applicant_id, year).find(
            (e) => e.leave_type_id === app.leave_type_id
          );
          if (ent) {
            Entitlements.update(ent.id, {
              used_days: ent.used_days + app.total_days,
            });
          }
        }
        // 4) Notify applicant + HOD
        const applicant = Users.byId(app.applicant_id);
        const lt = LeaveTypes.byId(app.leave_type_id);
        if (applicant && lt) {
          Notifications.insert({
            user_id: applicant.id,
            title: decision === 'approved' ? 'Leave approved' : 'Leave rejected',
            message:
              decision === 'approved'
                ? `Your ${lt.name} request has been fully approved.`
                : comment || 'The Registrar did not approve the leave.',
            type: decision === 'approved' ? 'leave_approved' : 'leave_rejected',
            is_read: false,
            related_application_id: appId,
          });
          const dept = Departments.byId(app.department_id);
          if (dept?.hod_id) {
            Notifications.insert({
              user_id: dept.hod_id,
              title: decision === 'approved' ? 'Leave fully approved' : 'Leave rejected at Registrar',
              message: `${applicant.full_name}'s ${lt.name} was ${nextStatus}.`,
              type: 'leave_approved',
              is_read: false,
              related_application_id: appId,
            });
          }
        }
        toast.success(
          decision === 'approved' ? 'Leave fully approved.' : 'Leave rejected.'
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
        title="Registrar Approval Queue"
        description="Final approval step. These requests have been approved by HOD."
      />

      <Card>
        <CardTitle className="mb-4">Awaiting Registrar approval ({apps.length})</CardTitle>

        {apps.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All caught up"
            description="No applications awaiting Registrar approval."
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Department', 'Leave type', 'Dates', 'Days', 'Submitted', 'Actions'].map(
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
                      {app.applicant?.full_name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.department?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(app.start_date)} - {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(app.created_at)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
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
          title={action === 'approve' ? 'Final approval' : 'Reject leave request'}
          description={
            action === 'approve'
              ? 'This is the final approval. The leave will be deducted from entitlements.'
              : 'Provide a reason for rejection. The staff member will be notified.'
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)]">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                {selectedApp.applicant?.full_name} · {selectedApp.department?.name}
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {selectedApp.leave_type?.name} · {formatDate(selectedApp.start_date)} -{' '}
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
                    ? 'Enter reason for rejection...'
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
              onClick={() =>
                handleDecision(selectedApp.id, action as 'approved' | 'rejected')
              }
            >
              {isPending ? 'Processing...' : action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}