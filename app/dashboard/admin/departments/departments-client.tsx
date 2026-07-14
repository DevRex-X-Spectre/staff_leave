'use client';

import { useState, useTransition } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { createDepartmentAction, deleteDepartmentAction } from '@/app/actions/admin';
import type { Department, User } from '@/types';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDepartmentsClient({
  departments,
  hods,
}: {
  departments: Department[];
  hods: User[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newHod, setNewHod] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Department name is required.');
      return;
    }
    startTransition(async () => {
      const result = await createDepartmentAction({
        name: newName.trim(),
        hodId: newHod || null,
      });
      if (result.ok) {
        toast.success('Department created.');
        setShowCreate(false);
        setNewName('');
        setNewHod('');
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteDepartmentAction(id);
      if (result.ok) {
        toast.success('Department deleted.');
      } else {
        toast.error(result.message);
      }
      setDeleteTarget(null);
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Departments"
        description="Manage university departments and assign HODs."
        actions={
          <Button variant="ink" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            Add department
          </Button>
        }
      />

      <Card padding={false}>
        {departments.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No departments"
            description="Add your first department to get started."
            action={
              <Button variant="outline" onClick={() => setShowCreate(true)}>
                <Plus size={14} />
                Add department
              </Button>
            }
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {departments.map((dept) => {
              const hod = hods.find((u) => u.id === dept.hod_id);
              return (
                <div
                  key={dept.id}
                  className="flex items-start justify-between px-4 sm:px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors gap-3"
                >
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      {dept.name}
                    </p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
                      {hod ? `HOD: ${hod.full_name}` : 'No HOD assigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(dept.id)}
                    >
                      <Trash2 size={14} className="text-[var(--danger)]" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {showCreate && (
        <Dialog open onClose={() => setShowCreate(false)} title="Add department">
          <div className="space-y-4">
            <FormField label="Department name">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Computer Science"
              />
            </FormField>
            <FormField label="Assign HOD (optional)">
              <Select value={newHod} onChange={(e) => setNewHod(e.target.value)}>
                <option value="">No HOD assigned</option>
                {hods.map((u) => (
                  <option key={u.id} value={u.id}>{u.full_name}</option>
                ))}
              </Select>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="ink" disabled={isPending} onClick={handleCreate}>
              {isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          title="Delete this department?"
          description="This will remove the department. Existing staff may lose their department assignment."
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}