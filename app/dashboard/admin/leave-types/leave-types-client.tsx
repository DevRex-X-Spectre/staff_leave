'use client';

import { useState, useTransition } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createLeaveTypeAction, toggleLeaveTypeAction } from '@/app/actions/admin';
import { CalendarDays, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { LeaveType, LeaveTypeApplicable } from '@/types';

export function AdminLeaveTypesClient({
  leaveTypes,
}: {
  leaveTypes: LeaveType[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [applicable, setApplicable] = useState<LeaveTypeApplicable>('both');
  const [maxAcademic, setMaxAcademic] = useState('');
  const [maxNonAcademic, setMaxNonAcademic] = useState('');
  const [requiresDoc, setRequiresDoc] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Name is required.');
      return;
    }
    startTransition(async () => {
      const result = await createLeaveTypeAction({
        name: name.trim(),
        applicableTo: applicable,
        maxDaysAcademic: maxAcademic ? Number(maxAcademic) : null,
        maxDaysNonAcademic: maxNonAcademic ? Number(maxNonAcademic) : null,
        requiresDocument: requiresDoc,
      });
      if (result.ok) {
        toast.success('Leave type created.');
        setShowCreate(false);
        setName('');
        setApplicable('both');
        setMaxAcademic('');
        setMaxNonAcademic('');
        setRequiresDoc(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const result = await toggleLeaveTypeAction(id);
      if (!result.ok) toast.error(result.message);
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Types"
        description="Define the types of leave available and their maximum durations."
        actions={
          <Button variant="ink" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            Add leave type
          </Button>
        }
      />

      <Card padding={false}>
        {leaveTypes.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No leave types"
            description="Add leave types to define what staff can apply for."
            action={
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus size={14} />
                Add leave type
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {leaveTypes.map((lt) => (
              <div
                key={lt.id}
                className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className={lt.is_active ? 'text-[14px] font-medium text-[var(--text-primary)]' : 'text-[14px] font-medium text-[var(--text-tertiary)]'}>
                      {lt.name}
                    </p>
                    {!lt.is_active && (
                      <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-subtle)] rounded-full text-[var(--text-tertiary)]">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      {lt.applicable_to}
                    </span>
                    <span className="text-[12px] text-[var(--text-tertiary)]">·</span>
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      Academic: {lt.max_days_academic ?? 'N/A'} days
                    </span>
                    <span className="text-[12px] text-[var(--text-tertiary)]">·</span>
                    <span className="text-[12px] text-[var(--text-secondary)]">
                      Non-academic: {lt.max_days_non_academic ?? 'N/A'} days
                    </span>
                    {lt.requires_document && (
                      <Badge variant="outline" className="text-[11px]">Document required</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggle(lt.id)}
                >
                  {lt.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreate && (
        <Dialog open onClose={() => setShowCreate(false)} title="Add leave type">
          <div className="space-y-4">
            <FormField label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Leave" />
            </FormField>
            <FormField label="Applies to">
              <Select value={applicable} onChange={(e) => setApplicable(e.target.value as LeaveTypeApplicable)}>
                <option value="both">Both academic and non-academic</option>
                <option value="academic">Academic staff only</option>
                <option value="non_academic">Non-academic staff only</option>
              </Select>
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Max days (academic)">
                <Input type="number" min={1} value={maxAcademic} onChange={(e) => setMaxAcademic(e.target.value)} placeholder="e.g. 21" />
              </FormField>
              <FormField label="Max days (non-academic)">
                <Input type="number" min={1} value={maxNonAcademic} onChange={(e) => setMaxNonAcademic(e.target.value)} placeholder="e.g. 21" />
              </FormField>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_doc"
                checked={requiresDoc}
                onChange={(e) => setRequiresDoc(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="requires_doc" className="text-[13px] text-[var(--text-secondary)]">
                Requires supporting document
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="ink" disabled={isPending} onClick={handleCreate}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}