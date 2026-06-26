'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Select } from '@/components/ui/input';
import { StatusBadge, RoleBadge } from '@/components/ui/badge';
import { formatDate, timeAgo } from '@/lib/utils';
import { listUsers, listDepartments } from '@/lib/data/dal';
import { toggleUserActiveAction, changeUserRoleAction } from '@/lib/data/actions';
import type { User, Department } from '@/types';
import { UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useActionState } from 'react';

export default function AdminStaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  useEffect(() => {
    Promise.all([listUsers(), listDepartments()]).then(([u, d]) => {
      setUsers(u);
      setDepartments(d);
      setLoading(false);
    });
  }, []);

  const filtered = users.filter((u) => {
    if (search && !u.full_name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRole && u.role !== filterRole) return false;
    return true;
  });

  const [, toggleAction] = useActionState(toggleUserActiveAction, undefined);
  const [, roleAction] = useActionState(changeUserRoleAction, undefined);

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('is_active', String(currentActive));
      await toggleAction(fd);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_active: !currentActive } : u
        )
      );
      toast.success('Account updated.');
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const fd = new FormData();
      fd.append('user_id', userId);
      fd.append('role', newRole);
      await roleAction(fd);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole as User['role'] } : u
        )
      );
      toast.success('Role updated.');
    } catch (e) {
      toast.error(String(e));
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Staff Management"
        description="Manage all staff accounts, roles, and active status."
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-48">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="hr_manager">HR Manager</option>
          <option value="staff">Staff</option>
        </Select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Name', 'Email', 'Staff ID', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((u) => {
                const dept = departments.find((d) => d.id === u.department_id);
                return (
                  <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="py-3 px-4">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">
                        {u.full_name}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{u.phone}</p>
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">{u.email}</td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">{u.staff_id}</td>
                    <td className="py-3 px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-4 text-[13px] text-[var(--text-secondary)]">
                      {dept?.name ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[12px] ${
                          u.is_active ? 'text-[var(--success)]' : 'text-[var(--text-tertiary)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.is_active ? 'bg-[var(--success)]' : 'bg-[var(--text-tertiary)]'
                          }`}
                        />
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12px] text-[var(--text-tertiary)]">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="text-[12px] border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-input)] text-[var(--text-primary)]"
                        >
                          <option value="admin">Admin</option>
                          <option value="hod">HOD</option>
                          <option value="hr_manager">HR</option>
                          <option value="staff">Staff</option>
                        </select>
                        <Button
                          variant={u.is_active ? 'outline-danger' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleActive(u.id, u.is_active)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
