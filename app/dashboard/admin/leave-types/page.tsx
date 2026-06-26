'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/stat-card';
import { listLeaveTypes } from '@/lib/data/dal';
import { createLeaveTypeAction, toggleLeaveTypeActiveAction } from '@/lib/data/actions';
import { CalendarDays, Plus } from 'lucide-react';
import type { LeaveType } from '@/types';
import { toast } from 'sonner';
import { useActionState } from 'react';

export default function AdminLeaveTypesPage() {
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [applicable, setApplicable] = useState('both');
  const [maxAcademic, setMaxAcademic] = useState('');
  const [maxNonAcademic, setMaxNonAcademic] = useState('');
  const [requiresDoc, setRequiresDoc] = useState(false);

  useEffect(() => {
    listLeaveTypes().then((data) => {
      setTypes(data);
      setLoading(false);
    });
  }, []);

  const [, createAction] = useActionState(createLeaveTypeAction, undefined);
  const [, toggleAction] = useActionState(toggleLeaveTypeActiveAction, undefined);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Name is required.'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      fd.append('applicable_to', applicable);
      if (maxAcademic) fd.append('max_days_academic', maxAcademic);
      if (maxNonAcademic) fd.append('max_days_non_academic', maxNonAcademic);
      if (requiresDoc) fd.append('requires_document', 'on');
      await createAction(fd);
      const updated = await listLeaveTypes();
      setTypes(updated);
      setShowCreate(false);
      setName('');
      setApplicable('both');
      setMaxAcademic('');
      setMaxNonAcademic('');
      setRequiresDoc(false);
      toast.success('Leave type created.');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      const fd = new FormData();
      fd.append('id', id);
      fd.append('is_active', String(currentActive));
      await toggleAction(fd);
      setTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !currentActive } : t))
      );
    } catch (e) {
      toast.error(String(e));
    }
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
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">Loading…</div>
        ) : types.length === 0 ? (
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
            {types.map((lt) => (
              <div
                key={lt.id}
                className="flex items-start justify-between px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-[14px] font-medium ${lt.is_active ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                      {lt.name}
                    </p>
                    {!lt.is_active && (
                      <span className="text-[10px] px-2 py-0.5 bg-[var(--bg-subtle)] rounded-full text-[var(--text-tertiary)]">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
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
                  onClick={() => handleToggle(lt.id, lt.is_active)}
                >
                  {lt.is_active ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {showCreate && (
        <Dialog
          open
          onClose={() => setShowCreate(false)}
          title="Add leave type"
        >
          <div className="space-y-4">
            <FormField label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Leave" />
            </FormField>
            <FormField label="Applies to">
              <Select value={applicable} onChange={(e) => setApplicable(e.target.value)}>
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
            <Button variant="ink" disabled={creating} onClick={handleCreate}>
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
