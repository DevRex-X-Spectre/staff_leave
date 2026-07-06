'use client';

import { useMemo, useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RequestStatusBadge, RoleBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Textarea, FormField } from '@/components/ui/input';
import { CheckCircle, XCircle } from 'lucide-react';
import { useApprovalRequests } from '@/lib/local/data-hooks';
import { useAuth } from '@/components/providers/auth-provider';
import { Notifications, UAR, Users } from '@/lib/local/store';
import { timeAgo } from '@/lib/utils';
import { toast } from 'sonner';

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export function AdminApprovalsClient() {
  const { currentUser } = useAuth();
  const requests = useApprovalRequests();
  const [filter, setFilter] = useState<Filter>('pending');
  const [showReject, setShowReject] = useState<string | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Filter in-memory so we don't need a server round-trip per filter change.
  const filtered = useMemo(
    () => (filter === 'all' ? requests : requests.filter((r) => r.status === filter)),
    [filter, requests]
  );

  const handleApprove = async (requestId: string) => {
    if (!currentUser) return;
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    setProcessing(requestId);
    try {
      UAR.update(requestId, {
        status: 'approved',
        admin_comment: null,
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      });
      Users.update(req.user_id, { is_approved: true });
      Notifications.insert({
        user_id: req.user_id,
        title: 'Account approved',
        message: 'Your NAUB LMS account has been approved. You can now log in.',
        type: 'account_approved',
        is_read: false,
        related_application_id: null,
      });
      toast.success('User approved!');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setProcessing(null);
      setShowReject(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectComment.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    if (!currentUser) return;
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;
    setProcessing(requestId);
    try {
      UAR.update(requestId, {
        status: 'rejected',
        admin_comment: rejectComment.trim(),
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      });
      Notifications.insert({
        user_id: req.user_id,
        title: 'Account not approved',
        message: rejectComment.trim(),
        type: 'account_approved',
        is_read: false,
        related_application_id: null,
      });
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
      <div className="flex flex-wrap items-center gap-2 mb-5 sm:mb-6">
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

        {filtered.length === 0 ? (
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
          <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {['Name', 'Email', 'Staff ID', 'Role', 'Department', 'Requested', 'Actions'].map(
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
                {filtered.map((req) => (
                  <tr key={req.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-3 sm:px-4 text-[13px] font-medium text-[var(--text-primary)] whitespace-nowrap">
                      {req.user?.full_name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {req.user?.email ?? ''}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {req.user?.staff_id ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <RoleBadge role={req.requested_role} />
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {req.department?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)]">
                      {timeAgo(req.created_at)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
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

      {showReject && (
        <Dialog
          open
          onClose={() => { setShowReject(null); setRejectComment(''); }}
          title="Reject registration"
          description="Provide a reason for rejection. The applicant will be notified."
        >
          <FormField label="Reason for rejection">
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
              {processing === showReject ? 'Rejecting...' : 'Confirm rejection'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
