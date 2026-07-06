'use client';

import { useState } from 'react';
import { PageHeader, EmptyState } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { Dialog, ConfirmDialog } from '@/components/ui/dialog';
import { useDepartments, useUsers } from '@/lib/local/data-hooks';
import { Departments } from '@/lib/local/store';
import { Building2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDepartmentsClient() {
  const departments = useDepartments();
  const users = useUsers();
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [newName, setNewName] = useState('');
  const [newHod, setNewHod] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Department name is required.');
      return;
    }
    setCreating(true);
    try {
      Departments.insert({
        name: newName.trim(),
        hod_id: newHod || null,
      });
      toast.success('Department created.');
      setShowCreate(false);
      setNewName('');
      setNewHod('');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = (id: string) => {
    try {
      Departments.remove(id);
      toast.success('Department deleted.');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setDeleteTarget(null);
    }
  };

  const hods = users.filter((u) => u.role === 'hod' && u.is_active);

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
              const hod = users.find((u) => u.id === dept.hod_id);
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
            <Button variant="ink" disabled={creating} onClick={handleCreate}>
              {creating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </Dialog>
      )}

      {deleteTarget && (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          title={`Delete this department?`}
          description="This will remove the department. Existing staff may lose their department assignment."
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
