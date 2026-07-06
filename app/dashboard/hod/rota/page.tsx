'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Textarea, Select } from '@/components/ui/input';
import { CalendarRange, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/providers/auth-provider';
import { useUsers } from '@/lib/local/data-hooks';
import { Notifications, Rotas, Slots } from '@/lib/local/store';

type Slot = {
  user_id: string;
  slot_start: string;
  slot_end: string;
  leave_type_id: string;
};

export default function HodRotaPage() {
  const { currentUser } = useAuth();
  const allUsers = useUsers();

  const deptStaff = useMemo(
    () =>
      allUsers.filter(
        (u) =>
          currentUser?.department_id &&
          u.department_id === currentUser.department_id &&
          u.role === 'staff'
      ),
    [allUsers, currentUser?.department_id]
  );

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
    if (!currentUser) {
      toast.error('Not signed in.');
      return;
    }
    setSubmitting(true);
    try {
      const rota = Rotas.insert({
        department_id: currentUser.department_id ?? '',
        title,
        period_start: periodStart,
        period_end: periodEnd,
        max_concurrent: maxConcurrent,
        published_by: currentUser.id,
        notes: notes || null,
      });

      for (const s of slots) {
        if (!s.user_id) continue;
        Slots.insert({
          rota_id: rota.id,
          user_id: s.user_id,
          slot_start: s.slot_start,
          slot_end: s.slot_end,
          leave_type_id: s.leave_type_id || null,
        });
      }

      // Notify all staff in the department.
      for (const staff of deptStaff) {
        Notifications.insert({
          user_id: staff.id,
          title: 'Rota published',
          message: `${title} has been published for the period ${periodStart} – ${periodEnd}.`,
          type: 'rota_published',
          is_read: false,
          related_application_id: null,
        });
      }

      toast.success('Rota published successfully!');
      setTitle('');
      setPeriodStart('');
      setPeriodEnd('');
      setMaxConcurrent(2);
      setNotes('');
      setSlots([]);
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : e));
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
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
                <div key={i} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
                  <FormField label="Staff">
                    <Select
                      value={slot.user_id}
                      onChange={(e) => updateSlot(i, 'user_id', e.target.value)}
                    >
                      <option value="">Select staff</option>
                      {deptStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name}
                        </option>
                      ))}
                    </Select>
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
