'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/stat-card';
import { formatDate } from '@/lib/utils';
import { LeaveTracker } from '@/components/leave/leave-tracker';
import { useApplications } from '@/lib/local/data-hooks';
import { Applications as ApplicationsStore } from '@/lib/local/store';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function MyLeavesClient({ userId }: { userId: string }) {
  const applications = useApplications({ applicantId: userId });
  const [selected, setSelected] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState<string | null>(null);

  const handleCancel = (id: string) => {
    setCancelling(id);
    try {
      ApplicationsStore.update(id, { status: 'cancelled' });
      toast.success('Application cancelled.');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setCancelling(null);
      setShowCancel(null);
    }
  };

  const selectedApp = applications.find((a) => a.id === selected) ?? null;

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
                      {app.leave_type?.name ?? '—'}
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                      {formatDate(app.start_date)} – {formatDate(app.end_date)}
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3">
                Progress
              </p>
              <LeaveTracker status={selectedApp.status} />
            </div>

            <div className="space-y-2.5">
              {[
                ['Leave type', selectedApp.leave_type?.name ?? '—'],
                ['Department', selectedApp.department?.name ?? '—'],
                ['Start date', formatDate(selectedApp.start_date)],
                ['End date', formatDate(selectedApp.end_date)],
                ['Total days', String(selectedApp.total_days)],
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

            {selectedApp.rota_conflict && (
              <div className="p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-[var(--radius-md)]">
                <p className="text-[12px] text-[var(--warning)]">
                  ⚠️ This application conflicts with the published departmental leave rota.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[13px] text-[var(--text-secondary)]">Current status</span>
              <StatusBadge status={selectedApp.status} />
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
    </div>
  );
}