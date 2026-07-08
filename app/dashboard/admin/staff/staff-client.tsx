'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { RoleBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useUsers, useDepartments } from '@/lib/local/data-hooks';
import { Users } from '@/lib/local/store';
import type { User } from '@/types';
import { toast } from 'sonner';

export function AdminStaffClient() {
  const users = useUsers();
  const departments = useDepartments();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (
          search &&
          !u.full_name.toLowerCase().includes(search.toLowerCase()) &&
          !u.email.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (filterRole && u.role !== filterRole) return false;
        return true;
      }),
    [users, search, filterRole]
  );

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    try {
      Users.update(userId, { is_active: !currentActive });
      toast.success('Account updated.');
    } catch (e) {
      toast.error(String(e));
    }
  };

  const handleChangeRole = (userId: string, newRole: User['role']) => {
    try {
      Users.update(userId, { role: newRole });
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

      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-48">
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="hod">HOD</option>
          <option value="hr_manager">Registrar</option>
          <option value="staff">Staff</option>
        </Select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                {['Name', 'Email', 'Staff ID', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left py-2.5 px-3 sm:px-4 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]"
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
                    <td className="py-3 px-3 sm:px-4">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">
                        {u.full_name}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{u.phone}</p>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{u.email}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">{u.staff_id}</td>
                    <td className="py-3 px-3 sm:px-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">
                      {dept?.name ?? '-'}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
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
                    <td className="py-3 px-3 sm:px-4 text-[12px] text-[var(--text-tertiary)] whitespace-nowrap">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as User['role'])}
                          className="text-[12px] border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-input)] text-[var(--text-primary)]"
                        >
                          <option value="admin">Admin</option>
                          <option value="hod">HOD</option>
                          <option value="hr_manager">Registrar</option>
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
