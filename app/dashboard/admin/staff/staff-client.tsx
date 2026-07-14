'use client';

import { useMemo, useState, useTransition } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Select, FormField } from '@/components/ui/input';
import { Dialog } from '@/components/ui/dialog';
import { RoleBadge, GradeBadge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  createStaffAction,
  toggleStaffActiveAction,
  updateStaffCategoryAction,
  updateStaffRoleAction,
} from '@/app/actions/admin';
import { DEFAULT_PASSWORD } from '@/lib/constants';
import type { Department, StaffGrade, StaffType, User, UserRole } from '@/types';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';

type NewStaff = {
  full_name: string;
  email: string;
  phone: string;
  staff_id: string;
  staff_type: StaffType;
  staff_grade: StaffGrade;
  rank: string;
  department_id: string;
  role: Exclude<UserRole, 'admin'>;
};

const EMPTY_NEW: NewStaff = {
  full_name: '',
  email: '',
  phone: '',
  staff_id: '',
  staff_type: 'non_academic',
  staff_grade: 'junior',
  rank: '',
  department_id: '',
  role: 'staff',
};

export function AdminStaffClient({
  users,
  departments,
}: {
  users: User[];
  departments: Department[];
}) {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState<NewStaff>(EMPTY_NEW);
  const [, startTransition] = useTransition();

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

  const handleToggleActive = (userId: string) => {
    startTransition(async () => {
      const result = await toggleStaffActiveAction(userId);
      if (result.ok) toast.success('Account updated.');
      else toast.error(result.message);
    });
  };

  const handleChangeRole = (userId: string, newRole: User['role']) => {
    startTransition(async () => {
      const result = await updateStaffRoleAction(userId, newRole);
      if (result.ok) toast.success('Role updated.');
      else toast.error(result.message);
    });
  };

  /** Change a user's staff category. Academic => grade null; non-academic
   *  keeps current grade. Annual entitlement is re-synced. */
  const handleChangeStaffType = (userId: string, staffType: StaffType) => {
    startTransition(async () => {
      const u = users.find((x) => x.id === userId);
      const nextGrade: StaffGrade =
        staffType === 'academic' ? 'junior' : (u?.staff_grade ?? 'junior');
      const result = await updateStaffCategoryAction(userId, staffType, nextGrade);
      if (result.ok) toast.success('Staff category updated and annual leave re-synced.');
      else toast.error(result.message);
    });
  };

  /** Promote/demote a non-academic staff between senior and junior. */
  const handleChangeGrade = (userId: string, grade: StaffGrade) => {
    startTransition(async () => {
      const u = users.find((x) => x.id === userId);
      if (!u) return;
      const result = await updateStaffCategoryAction(userId, u.staff_type, grade);
      if (result.ok) toast.success(`Grade set to ${grade}. Annual leave re-synced.`);
      else toast.error(result.message);
    });
  };

  const canCreate =
    draft.full_name.trim() &&
    /\S+@\S+\.\S+/.test(draft.email) &&
    draft.staff_id.trim() &&
    draft.rank.trim() &&
    draft.department_id;

  const handleCreate = () => {
    if (!canCreate) {
      toast.error('Please fill all required fields with a valid email.');
      return;
    }
    startTransition(async () => {
      const result = await createStaffAction({
        full_name: draft.full_name.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        staff_id: draft.staff_id.trim(),
        staff_type: draft.staff_type,
        staff_grade: draft.staff_grade,
        rank: draft.rank.trim(),
        department_id: draft.department_id,
        role: draft.role,
      });
      if (result.ok) {
        toast.success(
          `Staff account created. Default password ${DEFAULT_PASSWORD}. ${result.provisioned} entitlement${result.provisioned !== 1 ? 's' : ''} provisioned.`
        );
        setShowCreate(false);
        setDraft(EMPTY_NEW);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Staff Management"
        description="Manage all staff accounts, roles, categories, and active status."
        actions={
          <Button variant="ink" onClick={() => setShowCreate(true)}>
            <UserPlus size={15} />
            Create staff
          </Button>
        }
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
                {['Name', 'Email', 'Staff ID', 'Rank', 'Role', 'Category', 'Department', 'Status', 'Actions'].map(
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
                  <tr key={u.id} className="hover:bg-[var(--bg-hover)] transition-colors align-top">
                    <td className="py-3 px-3 sm:px-4">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                        {u.full_name}
                        {u.staff_type === 'non_academic' && <GradeBadge grade={u.staff_grade} />}
                      </p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{u.phone ?? '-'}</p>
                    </td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)]">{u.email}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">{u.staff_id}</td>
                    <td className="py-3 px-3 sm:px-4 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">{u.rank ?? '-'}</td>
                    <td className="py-3 px-3 sm:px-4">
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
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <div className="flex flex-col gap-1">
                        <select
                          value={u.staff_type}
                          onChange={(e) => handleChangeStaffType(u.id, e.target.value as StaffType)}
                          className="text-[12px] border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-input)] text-[var(--text-primary)]"
                        >
                          <option value="academic">Academic</option>
                          <option value="non_academic">Non-academic</option>
                        </select>
                        {u.staff_type === 'non_academic' && (
                          <select
                            value={u.staff_grade ?? 'junior'}
                            onChange={(e) => handleChangeGrade(u.id, e.target.value as StaffGrade)}
                            className="text-[11px] border border-[var(--border-subtle)] rounded px-2 py-1 bg-[var(--bg-input)] text-[var(--text-secondary)]"
                          >
                            <option value="junior">Junior (21 days)</option>
                            <option value="senior">Senior (30 days)</option>
                          </select>
                        )}
                      </div>
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
                      {!u.is_approved && (
                        <span className="block text-[10px] text-[var(--warning)] mt-1">Pending approval</span>
                      )}
                    </td>
                    <td className="py-3 px-3 sm:px-4">
                      <Button
                        variant={u.is_active ? 'outline-danger' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleActive(u.id)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && (
        <Dialog
          open
          onClose={() => setShowCreate(false)}
          title="Create staff account"
          description="The account is created approved. The default password is shown on success."
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField label="Full name">
                <Input
                  value={draft.full_name}
                  onChange={(e) => setDraft({ ...draft, full_name: e.target.value })}
                  placeholder="e.g. Dr. Jane Doe"
                />
              </FormField>
              <FormField label="Staff ID">
                <Input
                  value={draft.staff_id}
                  onChange={(e) => setDraft({ ...draft, staff_id: e.target.value })}
                  placeholder="e.g. NAUB/ADM/SN001 (senior) or NAUB/ADM/JS001 (junior)"
                />
              </FormField>
            </div>
            <FormField label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                placeholder="name@naub.edu.ng"
              />
            </FormField>
            <FormField label="Phone (optional)">
              <Input
                value={draft.phone}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                placeholder="+234 ..."
              />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField label="Department">
                <Select
                  value={draft.department_id}
                  onChange={(e) => setDraft({ ...draft, department_id: e.target.value })}
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Role">
                <Select
                  value={draft.role}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value as NewStaff['role'] })}
                >
                  <option value="staff">Staff</option>
                  <option value="hod">HOD</option>
                  <option value="hr_manager">Registrar</option>
                </Select>
              </FormField>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <FormField label="Staff category">
                <Select
                  value={draft.staff_type}
                  onChange={(e) => setDraft({ ...draft, staff_type: e.target.value as StaffType })}
                >
                  <option value="academic">Academic (30 days annual)</option>
                  <option value="non_academic">Non-academic</option>
                </Select>
              </FormField>
              {draft.staff_type === 'non_academic' && (
                <FormField label="Grade">
                  <Select
                    value={draft.staff_grade}
                    onChange={(e) => setDraft({ ...draft, staff_grade: e.target.value as StaffGrade })}
                  >
                    <option value="junior">Junior (21 days annual)</option>
                    <option value="senior">Senior (30 days annual)</option>
                  </Select>
                </FormField>
              )}
            </div>
            <FormField label="Rank / post">
              <Input
                list="naub-rank-options"
                value={draft.rank}
                onChange={(e) => setDraft({ ...draft, rank: e.target.value })}
                placeholder={draft.staff_type === 'academic' ? 'e.g. Lecturer II' : 'e.g. Administrative Officer'}
              />
              <datalist id="naub-rank-options">
                <option value="Graduate Assistant" />
                <option value="Assistant Lecturer" />
                <option value="Lecturer II" />
                <option value="Lecturer I" />
                <option value="Senior Lecturer" />
                <option value="Associate Professor" />
                <option value="Professor" />
                <option value="Administrative Officer" />
                <option value="Assistant Registrar" />
                <option value="Deputy Registrar" />
                <option value="Principal Registrar" />
              </datalist>
            </FormField>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="ink" disabled={!canCreate} onClick={handleCreate}>
              Create account
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}