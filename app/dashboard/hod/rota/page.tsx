'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Textarea, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/stat-card';
import { CalendarRange, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type Slot = {
  user_id: string;
  slot_start: string;
  slot_end: string;
  leave_type_id: string;
};

export default function HodRotaPage() {
  const [title, setTitle] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [maxConcurrent, setMaxConcurrent] = useState(2);
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      { user_id: '', slot_start: '', slot_end: '', leave_type_id: '' },
    ]);
  };

  const removeSlot = (i: number) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateSlot = (i: number, field: keyof Slot, value: string) => {
    setSlots((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async () => {
    if (!title || !periodStart || !periodEnd) {
      toast.error('Fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const { publishRotaAction } = await import('@/lib/data/actions');
      const fd = new FormData();
      fd.append('title', title);
      fd.append('period_start', periodStart);
      fd.append('period_end', periodEnd);
      fd.append('max_concurrent', String(maxConcurrent));
      fd.append('notes', notes);
      fd.append('slots', JSON.stringify(slots));
      await publishRotaAction(fd);
      toast.success('Rota published successfully!');
      setTitle('');
      setPeriodStart('');
      setPeriodEnd('');
      setMaxConcurrent(2);
      setNotes('');
      setSlots([]);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Leave Rota"
        description="Publish the departmental leave rota so staff know when colleagues will be away."
        actions={
          <Button variant="ink" onClick={handleSubmit} disabled={submitting}>
            <CalendarRange size={15} />
            {submitting ? 'Publishing…' : 'Publish rota'}
          </Button>
        }
      />

      <Card>
        <CardTitle className="mb-4">Publish new rota</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <FormField label="Rota title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 2026 Rota"
            />
          </FormField>
          <FormField label="Max concurrent staff on leave">
            <Input
              type="number"
              min={1}
              max={50}
              value={maxConcurrent}
              onChange={(e) => setMaxConcurrent(Number(e.target.value))}
            />
          </FormField>
          <FormField label="Period start">
            <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          </FormField>
          <FormField label="Period end">
            <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
          </FormField>
        </div>

        <FormField label="Notes (optional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes for staff…"
            rows={2}
          />
        </FormField>

        {/* Slots */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-[var(--text-primary)]">Scheduled slots</p>
            <Button variant="outline" size="sm" onClick={addSlot}>
              <Plus size={14} />
              Add slot
            </Button>
          </div>

          {slots.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
              <CalendarRange size={24} strokeWidth={1} className="mx-auto text-[var(--text-tertiary)] mb-2" />
              <p className="text-[13px] text-[var(--text-secondary)]">
                No slots added yet. Click "Add slot" to schedule staff leave.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, i) => (
                <div key={i} className="grid grid-cols-4 gap-3 items-end">
                  <FormField label="Staff">
                    <Input
                      value={slot.user_id}
                      onChange={(e) => updateSlot(i, 'user_id', e.target.value)}
                      placeholder="Staff name or ID"
                    />
                  </FormField>
                  <FormField label="Start">
                    <Input
                      type="date"
                      value={slot.slot_start}
                      onChange={(e) => updateSlot(i, 'slot_start', e.target.value)}
                    />
                  </FormField>
                  <FormField label="End">
                    <Input
                      type="date"
                      value={slot.slot_end}
                      onChange={(e) => updateSlot(i, 'slot_end', e.target.value)}
                    />
                  </FormField>
                  <div className="flex items-center gap-2 pb-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSlot(i)}
                      className="text-[var(--danger)]"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
