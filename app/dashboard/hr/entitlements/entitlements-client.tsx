'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/stat-card';
import { adjustEntitlementAction } from '@/lib/data/actions';
import { formatDate } from '@/lib/utils';
import { BarChart3, Plus, Minus } from 'lucide-react';
import type { User, LeaveType, LeaveEntitlement } from '@/types';
import { toast } from 'sonner';

export function EntitlementsClient({
  staff,
  leaveTypes,
  entitlementsMap,
  currentYear,
}: {
  staff: User[];
  leaveTypes: LeaveType[];
  entitlementsMap: Record<string, LeaveEntitlement[]>;
  currentYear: number;
}) {
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [adjustTarget, setAdjustTarget] = useState<{
    entitlementId: string;
    name: string;
    current: number;
  } | null>(null);
  const [delta, setDelta] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const filtered = staff.filter((u) => {
    if (filterDept && u.department_id !== filterDept) return false;
    return true;
  });

  const activeTypes = leaveTypes.filter((t) => t.is_active);

  const handleAdjust = async () => {
    if (!adjustTarget || delta === 0) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('id', adjustTarget.entitlementId);
      fd.append('delta', String(delta));
      await adjustEntitlementAction(fd);
      toast.success(`Balance adjusted by ${delta > 0 ? '+' : ''}${delta} days.`);
      setAdjustTarget(null);
      setDelta(0);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Entitlements"
        description={`Staff leave balances for the ${currentYear} leave year.`}
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <Select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="w-48"
        >
          <option value="">All departments</option>
          {[...new Map(staff.filter(u => u.department_id).map(u => [u.department_id, u.department_id])).values()].map((id) => (
            <option key={id} value={id}>{id}</option>
          ))}
        </Select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                  Staff
                </th>
                {activeTypes.map((lt) => (
                  <th
                    key={lt.id}
                    className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] whitespace-nowrap"
                  >
                    {lt.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTypes.length + 1} className="py-12 text-center">
                    <p className="text-[13px] text-[var(--text-secondary)]">No staff found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const ents = entitlementsMap[u.id] ?? [];
                  return (
                    <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-[13px] font-medium text-[var(--text-primary)]">
                          {u.full_name}
                        </p>
                        <p className="text-[11px] text-[var(--text-tertiary)]">{u.staff_id}</p>
                      </td>
                      {activeTypes.map((lt) => {
                        const ent = ents.find((e) => e.leave_type_id === lt.id);
                        return (
                          <td key={lt.id} className="py-3 px-4">
                            {ent ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[13px] font-medium ${
                                    ent.total_days - ent.used_days <= 2
                                      ? 'text-[var(--danger)]'
                                      : 'text-[var(--text-primary)]'
                                  }`}
                                >
                                  {ent.total_days - ent.used_days}/{ent.total_days}
                                </span>
                                <button
                                  className="p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors"
                                  onClick={() =>
                                    setAdjustTarget({
                                      entitlementId: ent.id,
                                      name: `${u.full_name} — ${lt.name}`,
                                      current: ent.total_days,
                                    })
                                  }
                                  title="Adjust balance"
                                >
                                  <BarChart3 size={13} className="text-[var(--text-tertiary)]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[12px] text-[var(--text-tertiary)]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Adjust dialog */}
      {adjustTarget && (
        <Dialog
          open
          onClose={() => { setAdjustTarget(null); setDelta(0); }}
          title="Adjust entitlement"
          description={adjustTarget.name}
        >
          <div className="space-y-4">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Current total days: <strong>{adjustTarget.current}</strong>
            </p>
            <FormField label="Adjustment (+/-)">
              <Input
                type="number"
                value={delta}
                onChange={(e) => setDelta(Number(e.target.value))}
                placeholder="e.g. 5 or -2"
              />
            </FormField>
            <p className="text-[13px] text-[var(--text-secondary)]">
              New total: <strong>{Math.max(0, adjustTarget.current + delta)}</strong>
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => { setAdjustTarget(null); setDelta(0); }}>
              Cancel
            </Button>
            <Button
              variant="ink"
              disabled={delta === 0}
              onClick={handleAdjust}
            >
              {submitting ? 'Saving…' : 'Save adjustment'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
