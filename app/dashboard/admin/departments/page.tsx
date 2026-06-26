'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/stat-card';
import { listDepartments, listUsers } from '@/lib/data/dal';
import { createDepartmentAction, deleteDepartmentAction, updateDepartmentAction } from '@/lib/data/actions';
import { Building2, Plus, Trash2 } from 'lucide-react';
import type { Department, User } from '@/types';
import { toast } from 'sonner';
import { useActionState } from 'react';
import { ConfirmDialog } from '@/components/ui/dialog';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state for create
  const [newName, setNewName] = useState('');
  const [newHod, setNewHod] = useState('');

  useEffect(() => {
    Promise.all([listDepartments(), listUsers()]).then(([d, u]) => {
      setDepartments(d);
      setUsers(u);
      setLoading(false);
    });
  }, []);

  const [, createAction] = useActionState(createDepartmentAction, undefined);
  const [, deleteAction] = useActionState(deleteDepartmentAction, undefined);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Department name is required.'); return; }
    setCreating(true);
    try {
      const fd = new FormData();
      fd.append('name', newName.trim());
      fd.append('hod_id', newHod);
      await createAction(fd);
      const updated = await listDepartments();
      setDepartments(updated);
      setShowCreate(false);
      setNewName('');
      setNewHod('');
      toast.success('Department created.');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const fd = new FormData();
      fd.append('id', id);
      await deleteAction(fd);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
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
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">Loading…</div>
        ) : departments.length === 0 ? (
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
                  className="flex items-start justify-between px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors"
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
                      onClick={() => setDeleteTarget(dept)}
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

      {/* Create dialog */}
      {showCreate && (
        <Dialog
          open
          onClose={() => setShowCreate(false)}
          title="Add department"
        >
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
              {creating ? 'Creating…' : 'Create'}
            </Button>
          </div>
        </Dialog>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
          title={`Delete "${deleteTarget.name}"?`}
          description="This will remove the department. Existing staff may lose their department assignment."
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </div>
  );
}
