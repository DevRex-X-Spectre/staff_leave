import 'server-only';
import { cache } from 'react';
import {
  Applications,
  Approvals,
  Departments,
  Entitlements,
  LeaveTypes,
  Notifications,
  Rotas,
  Slots,
  UAR,
  Users,
} from '@/lib/mock/store';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/utils';
import type {
  Department,
  LeaveApplication,
  LeaveApplicationWithRelations,
  LeaveApproval,
  LeaveBalance,
  LeaveEntitlement,
  LeaveType,
  Notification,
  User,
  UserApprovalRequest,
  UserApprovalRequestWithRelations,
} from '@/types';

/* ============================================================
   Users
   ============================================================ */
export const listUsers = cache(async (): Promise<User[]> => {
  if (isDemoMode()) return Users.all();
  const sb = await getSupabaseServerClient();
  const { data } = await sb.from('users').select('*').order('full_name');
  return (data ?? []) as User[];
});

export const listUsersByDepartment = cache(
  async (departmentId: string): Promise<User[]> => {
    if (isDemoMode()) return Users.all().filter((u) => u.department_id === departmentId);
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('users')
      .select('*')
      .eq('department_id', departmentId)
      .order('full_name');
    return (data ?? []) as User[];
  }
);

export const getUserById = cache(async (id: string): Promise<User | null> => {
  if (isDemoMode()) return Users.byId(id);
  const sb = await getSupabaseServerClient();
  const { data } = await sb.from('users').select('*').eq('id', id).single();
  return (data ?? null) as User | null;
});

/* ============================================================
   Departments
   ============================================================ */
export const listDepartments = cache(async (): Promise<Department[]> => {
  if (isDemoMode()) return Departments.all();
  const sb = await getSupabaseServerClient();
  const { data } = await sb.from('departments').select('*').order('name');
  return (data ?? []) as Department[];
});

export const getDepartment = cache(
  async (id: string): Promise<Department | null> => {
    if (isDemoMode()) return Departments.byId(id);
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();
    return (data ?? null) as Department | null;
  }
);

/* ============================================================
   Leave Types
   ============================================================ */
export const listLeaveTypes = cache(async (): Promise<LeaveType[]> => {
  if (isDemoMode()) return LeaveTypes.all();
  const sb = await getSupabaseServerClient();
  const { data } = await sb.from('leave_types').select('*').order('name');
  return (data ?? []) as LeaveType[];
});

export const listActiveLeaveTypes = cache(async (): Promise<LeaveType[]> => {
  if (isDemoMode()) return LeaveTypes.active();
  const sb = await getSupabaseServerClient();
  const { data } = await sb
    .from('leave_types')
    .select('*')
    .eq('is_active', true)
    .order('name');
  return (data ?? []) as LeaveType[];
});

/* ============================================================
   Entitlements & Balances
   ============================================================ */
export async function getLeaveBalances(
  userId: string
): Promise<LeaveBalance[]> {
  const types = await listActiveLeaveTypes();
  const ents = await listEntitlementsForUser(userId);
  return types
    .filter((t) => {
      if (t.applicable_to === 'both') return true;
      // Resolve user staff type
      const u = Users.byId(userId);
      return t.applicable_to === (u?.staff_type ?? 'both');
    })
    .map((t) => {
      const e = ents.find((x) => x.leave_type_id === t.id);
      const total = e?.total_days ?? 0;
      const used = e?.used_days ?? 0;
      return { leave_type: t, total_days: total, used_days: used, remaining_days: total - used };
    })
    .filter((b) => b.total_days > 0);
}

export const listEntitlementsForUser = cache(
  async (userId: string, year: number = new Date().getFullYear()) => {
    if (isDemoMode()) return Entitlements.byUser(userId, year);
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('leave_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year);
    return (data ?? []) as LeaveEntitlement[];
  }
);

/* ============================================================
   Leave Applications
   ============================================================ */
function hydrateApplication(a: LeaveApplication): LeaveApplicationWithRelations {
  const applicant = Users.byId(a.applicant_id);
  const leave_type = LeaveTypes.byId(a.leave_type_id);
  const department = Departments.byId(a.department_id);
  return { ...a, applicant, leave_type, department };
}

export const listApplicationsByUser = cache(
  async (userId: string): Promise<LeaveApplicationWithRelations[]> => {
    if (isDemoMode()) {
      return Applications.byUser(userId)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(hydrateApplication);
    }
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('leave_applications')
      .select('*')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });
    return ((data ?? []) as LeaveApplication[]).map(hydrateApplication);
  }
);

export const listApplicationsByDepartment = cache(
  async (
    departmentId: string,
    statuses?: string[]
  ): Promise<LeaveApplicationWithRelations[]> => {
    if (isDemoMode()) {
      let rows = Applications.byDepartment(departmentId);
      if (statuses?.length) rows = rows.filter((r) => statuses.includes(r.status));
      return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(hydrateApplication);
    }
    const sb = await getSupabaseServerClient();
    let q = sb.from('leave_applications').select('*').eq('department_id', departmentId);
    if (statuses?.length) q = q.in('status', statuses);
    q = q.order('created_at', { ascending: false });
    const { data } = await q;
    return ((data ?? []) as LeaveApplication[]).map(hydrateApplication);
  }
);

export const listAllApplications = cache(
  async (filters: { status?: string[]; departmentId?: string } = {}): Promise<LeaveApplicationWithRelations[]> => {
    if (isDemoMode()) {
      let rows = Applications.all();
      if (filters.status?.length) rows = rows.filter((r) => filters.status!.includes(r.status));
      if (filters.departmentId) rows = rows.filter((r) => r.department_id === filters.departmentId);
      return rows.sort((a, b) => b.created_at.localeCompare(a.created_at)).map(hydrateApplication);
    }
    const sb = await getSupabaseServerClient();
    let q = sb.from('leave_applications').select('*');
    if (filters.status?.length) q = q.in('status', filters.status);
    if (filters.departmentId) q = q.eq('department_id', filters.departmentId);
    q = q.order('created_at', { ascending: false });
    const { data } = await q;
    return ((data ?? []) as LeaveApplication[]).map(hydrateApplication);
  }
);

export const getApplicationById = cache(
  async (id: string): Promise<LeaveApplicationWithRelations | null> => {
    if (isDemoMode()) {
      const a = Applications.byId(id);
      return a ? hydrateApplication(a) : null;
    }
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('leave_applications')
      .select('*')
      .eq('id', id)
      .single();
    return data ? hydrateApplication(data as LeaveApplication) : null;
  }
);

/* ============================================================
   Approval audit trail
   ============================================================ */
export const listApprovalsForApplication = cache(
  async (applicationId: string): Promise<LeaveApproval[]> => {
    if (isDemoMode()) return Approvals.byApplication(applicationId);
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('leave_approvals')
      .select('*')
      .eq('application_id', applicationId)
      .order('decided_at');
    return (data ?? []) as LeaveApproval[];
  }
);

/* ============================================================
   Rotas
   ============================================================ */
export const listRotasByDepartment = cache(
  async (departmentId: string) => {
    if (isDemoMode()) return Rotas.byDepartment(departmentId);
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('leave_rota')
      .select('*')
      .eq('department_id', departmentId)
      .order('period_start', { ascending: false });
    return (data ?? []) as Array<Awaited<ReturnType<typeof Rotas.byDepartment>>[number]>;
  }
);

export const listRotaSlotsByDepartment = cache(async (departmentId: string) => {
  if (isDemoMode()) return Slots.byDepartment(departmentId);
  const sb = await getSupabaseServerClient();
  // For Supabase we resolve via leave_rota.id list first
  const { data: rotas } = await sb
    .from('leave_rota')
    .select('id')
    .eq('department_id', departmentId);
  const ids = (rotas ?? []).map((r) => r.id as string);
  if (!ids.length) return [];
  const { data: slots } = await sb.from('rota_slots').select('*').in('rota_id', ids);
  return (slots ?? []) as Array<Awaited<ReturnType<typeof Slots.byDepartment>>[number]>;
});

/* ============================================================
   Notifications
   ============================================================ */
export const listNotificationsForUser = cache(
  async (userId: string): Promise<Notification[]> => {
    if (isDemoMode()) return Notifications.byUser(userId);
    const sb = await getSupabaseServerClient();
    const { data } = await sb
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []) as Notification[];
  }
);

export const unreadCountForUser = cache(
  async (userId: string): Promise<number> => {
    if (isDemoMode()) return Notifications.unreadCount(userId);
    const sb = await getSupabaseServerClient();
    const { count } = await sb
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count ?? 0;
  }
);

/* ============================================================
   User Approval Requests (admin queue)
   ============================================================ */
export const listApprovalRequests = cache(
  async (status?: 'pending' | 'approved' | 'rejected'): Promise<UserApprovalRequestWithRelations[]> => {
    if (isDemoMode()) {
      const rows = status ? UAR.byStatus(status) : UAR.all();
      return rows
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map((r) => ({
          ...r,
          user: Users.byId(r.user_id) ?? null,
          department: r.requested_department_id ? Departments.byId(r.requested_department_id) ?? null : null,
          reviewer: r.reviewed_by ? Users.byId(r.reviewed_by) ?? null : null,
        }));
    }
    const sb = await getSupabaseServerClient();
    let q = sb.from('user_approval_requests').select('*');
    if (status) q = q.eq('status', status);
    q = q.order('created_at', { ascending: false });
    const { data } = await q;
    return ((data ?? []) as UserApprovalRequest[]).map((r) => ({
      ...r,
      user: null,
      department: null,
      reviewer: null,
    }));
  }
);