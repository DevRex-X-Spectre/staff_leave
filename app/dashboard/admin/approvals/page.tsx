'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, RequestStatusBadge, RoleBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/stat-card';
import { CheckCircle, XCircle } from 'lucide-react';
import { listApprovalRequests } from '@/lib/data/dal';
import { approveUserAction, rejectUserAction } from '@/lib/data/actions';
import { timeAgo } from '@/lib/utils';
import type { UserApprovalRequestWithRelations } from '@/types';
import { toast } from 'sonner';

export default function AdminApprovalsPage() {
  const [requests, setRequests] = useState<UserApprovalRequestWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selected, setSelected] = useState<UserApprovalRequestWithRelations | null>(null);
  const [showReject, setShowReject] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    listApprovalRequests(filter === 'all' ? undefined : filter).then((data) => {
      setRequests(data as UserApprovalRequestWithRelations[]);
      setLoading(false);
    });
  }, [filter]);

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const fd = new FormData();
      fd.append('request_id', requestId);
      await approveUserAction(fd);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success('User approved!');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setProcessing(null);
      setSelected(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectComment.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    setProcessing(requestId);
    try {
      const fd = new FormData();
      fd.append('request_id', requestId);
      fd.append('comment', rejectComment);
      await rejectUserAction(fd);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast.success('User rejected.');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setProcessing(null);
      setShowReject(null);
      setRejectComment('');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Approval Queue"
        description="Review and approve new staff account registrations."
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
              filter === f
                ? 'bg-[var(--ink)] text-white'
                : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle className="mb-4">
          {filter === 'pending'
            ? 'Pending requests'
            : filter === 'all'
            ? 'All requests'
            : `${filter.charAt(0).toUpperCase() + filter.slice(1)} requests`}
        </CardTitle>

        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">
            Loading…
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="No requests"
            description={
              filter === 'pending'
                ? 'All caught up — no pending approvals.'
                : 'No requests found.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Name', 'Email', 'Staff ID', 'Role', 'Department', 'Requested', 'Actions'].map(
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
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 text-[13px] font-medium text-[var(--text-primary)]">
                      {req.user?.full_name ?? '—'}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {req.user?.email ?? ''}
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {req.user?.staff_id ?? '—'}
                    </td>
                    <td className="py-3">
                      <RoleBadge role={req.requested_role} />
                    </td>
                    <td className="py-3 text-[13px] text-[var(--text-secondary)]">
                      {req.department?.name ?? '—'}
                    </td>
                    <td className="py-3 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(req.created_at)}
                    </td>
                    <td className="py-3">
                      {req.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={processing === req.id}
                            onClick={() => handleApprove(req.id)}
                          >
                            <CheckCircle size={13} />
                            Approve
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            disabled={processing === req.id}
                            onClick={() => setShowReject(req.id)}
                          >
                            <XCircle size={13} />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <RequestStatusBadge status={req.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Reject dialog */}
      {showReject && (
        <Dialog
          open
          onClose={() => { setShowReject(null); setRejectComment(''); }}
          title="Reject registration"
          description="Provide a reason for rejection. The applicant will be notified."
        >
          <FormField label="Reason for rejection" error={!rejectComment ? undefined : undefined}>
            <Textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="e.g. Staff ID not found in university records"
              rows={3}
            />
          </FormField>
          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => { setShowReject(null); setRejectComment(''); }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!rejectComment.trim() || processing === showReject}
              onClick={() => handleReject(showReject)}
            >
              {processing === showReject ? 'Rejecting…' : 'Confirm rejection'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
