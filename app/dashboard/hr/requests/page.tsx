'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/stat-card';
import { formatDate, timeAgo } from '@/lib/utils';
import { listAllApplications } from '@/lib/data/dal';
import { hrDecisionAction } from '@/lib/data/actions';
import { CheckCircle, XCircle } from 'lucide-react';
import type { LeaveApplicationWithRelations } from '@/types';
import { toast } from 'sonner';
import { useActionState } from 'react';

export default function HrRequestsPage() {
  const [apps, setApps] = useState<LeaveApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<LeaveApplicationWithRelations | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    listAllApplications({ status: ['hod_approved'] }).then((data) => {
      setApps(data as LeaveApplicationWithRelations[]);
      setLoading(false);
    });
  }, []);

  const [state, formAction, isPending] = useActionState(hrDecisionAction, null);

  const handleDecision = async (appId: string, decision: 'approved' | 'rejected') => {
    try {
      const fd = new FormData();
      fd.append('application_id', appId);
      fd.append('decision', decision);
      fd.append('comment', comment);
      await formAction(fd);
      setApps((prev) => prev.filter((a) => a.id !== appId));
      toast.success(
        decision === 'approved'
          ? 'Leave fully approved.'
          : 'Leave rejected.'
      );
      setAction(null);
      setComment('');
      setSelected(null);
    } catch (e) {
      toast.error(String(e));
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="HR Approval Queue"
        description="Final approval step — these requests have been approved by HOD."
      />

      <Card>
        <CardTitle className="mb-4">
          Awaiting HR approval ({apps.length})
        </CardTitle>

        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
            Loading…
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All caught up"
            description="No applications awaiting HR approval."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Staff', 'Department', 'Leave type', 'Dates', 'Days', 'Submitted', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] pb-3"
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
                    <td className="py-3 text-[13px] font-medium text-[var(--text-primary)]">
                      {app.applicant?.full_name ?? '—'}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {app.department?.name ?? '—'}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {app.leave_type?.name ?? '—'}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {formatDate(app.start_date)} – {formatDate(app.end_date)}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {app.total_days}
                    </td>
                    <td className="py-3 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(app.created_at)}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelected(app); setAction('approve'); }}
                        >
                          <CheckCircle size={13} />
                          Approve
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => { setSelected(app); setAction('reject'); }}
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

      {selected && action && (
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
                {selected.applicant?.full_name} · {selected.department?.name}
              </p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {selected.leave_type?.name} · {formatDate(selected.start_date)} –{' '}
                {formatDate(selected.end_date)} · {selected.total_days} days
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
                    ? 'Enter reason for rejection…'
                    : 'Optional comment…'
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
                handleDecision(selected.id, action as 'approved' | 'rejected')
              }
            >
              {isPending ? 'Processing…' : action === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
