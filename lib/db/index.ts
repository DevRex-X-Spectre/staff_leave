import 'server-only';
import type {
  Department,
  LeaveApplication,
  LeaveApplicationWithRelations,
  LeaveApproval,
  LeaveBalance,
  LeaveEntitlement,
  LeaveRota,
  LeaveType,
  Notification,
  RotaSlot,
  User,
  UserApprovalRequest,
  UserApprovalRequestWithRelations,
} from '@/types';
import { db } from './client';

/**
 * Data Access Layer - server-only repos over Supabase (service role).
 * Mirrors the localStorage `lib/local/store.ts` API (now removed), so the page
 * migration is mostly mechanical. All functions are async.
 */

const APP_SELECT =
  '*, applicant:users!applicant_id(*), cover_staff:users!cover_staff_id(*), leave_type:leave_types(*), department:departments(*)';

const nowIso = () => new Date().toISOString();

// ---------------- Users ----------------
export const Users = {
  async all(): Promise<User[]> {
    const { data, error } = await db().from('users').select('*');
    if (error) throw error;
    return data ?? [];
  },
  async byId(id: string): Promise<User | null> {
    const { data } = await db().from('users').select('*').eq('id', id).maybeSingle();
    return data ?? null;
  },
  async byStaffId(staffId: string): Promise<User | null> {
    const { data } = await db()
      .from('users')
      .select('*')
      .ilike('staff_id', staffId.trim())
      .maybeSingle();
    return data ?? null;
  },
  async byEmail(email: string): Promise<User | null> {
    const { data } = await db()
      .from('users')
      .select('*')
      .ilike('email', email.trim())
      .maybeSingle();
    return data ?? null;
  },
  async byDepartment(deptId: string): Promise<User[]> {
    const { data } = await db().from('users').select('*').eq('department_id', deptId);
    return data ?? [];
  },
  async insert(u: Omit<User, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<User> {
    const { data, error } = await db()
      .from('users')
      .insert({ ...u, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const { data, error } = await db()
      .from('users')
      .update({ ...patch, updated_at: nowIso() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
};

// ---------------- Credentials ----------------
export const Credentials = {
  async set(userId: string, passwordHash: string): Promise<void> {
    const { error } = await db()
      .from('user_credentials')
      .upsert({ user_id: userId, password_hash: passwordHash, updated_at: nowIso() });
    if (error) throw error;
  },
  async get(userId: string): Promise<string | null> {
    const { data } = await db()
      .from('user_credentials')
      .select('password_hash')
      .eq('user_id', userId)
      .maybeSingle();
    return data?.password_hash ?? null;
  },
};

// ---------------- Departments ----------------
export const Departments = {
  async all(): Promise<Department[]> {
    const { data } = await db().from('departments').select('*').order('name');
    return data ?? [];
  },
  async byId(id: string): Promise<Department | null> {
    const { data } = await db().from('departments').select('*').eq('id', id).maybeSingle();
    return data ?? null;
  },
  async insert(d: Omit<Department, 'id' | 'created_at'>): Promise<Department> {
    const { data, error } = await db().from('departments').insert(d).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: Partial<Department>): Promise<Department | null> {
    const { data, error } = await db().from('departments').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
  async remove(id: string): Promise<boolean> {
    const { error } = await db().from('departments').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// ---------------- Leave types ----------------
export const LeaveTypes = {
  async all(): Promise<LeaveType[]> {
    const { data } = await db().from('leave_types').select('*').order('name');
    return data ?? [];
  },
  async active(): Promise<LeaveType[]> {
    const { data } = await db().from('leave_types').select('*').eq('is_active', true).order('name');
    return data ?? [];
  },
  async byId(id: string): Promise<LeaveType | null> {
    const { data } = await db().from('leave_types').select('*').eq('id', id).maybeSingle();
    return data ?? null;
  },
  async insert(lt: Omit<LeaveType, 'id' | 'created_at'>): Promise<LeaveType> {
    const { data, error } = await db().from('leave_types').insert(lt).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: Partial<LeaveType>): Promise<LeaveType | null> {
    const { data, error } = await db().from('leave_types').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
};

// ---------------- Entitlements ----------------
export const Entitlements = {
  async byUser(userId: string, year: number = new Date().getFullYear()): Promise<LeaveEntitlement[]> {
    const { data } = await db()
      .from('leave_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year);
    return data ?? [];
  },
  async byId(id: string): Promise<LeaveEntitlement | null> {
    const { data } = await db().from('leave_entitlements').select('*').eq('id', id).maybeSingle();
    return data ?? null;
  },
  async insert(e: Omit<LeaveEntitlement, 'id' | 'created_at'>): Promise<LeaveEntitlement> {
    const { data, error } = await db().from('leave_entitlements').insert(e).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: Partial<LeaveEntitlement>): Promise<LeaveEntitlement | null> {
    const { data, error } = await db().from('leave_entitlements').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
  async upsert(e: Omit<LeaveEntitlement, 'id' | 'created_at'>): Promise<LeaveEntitlement | null> {
    const { data, error } = await db()
      .from('leave_entitlements')
      .upsert(e, { onConflict: 'user_id,leave_type_id,year' })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
};

// ---------------- Applications ----------------
export const Applications = {
  hydrate(a: LeaveApplication): LeaveApplicationWithRelations {
    return a as unknown as LeaveApplicationWithRelations;
  },
  async all(): Promise<LeaveApplicationWithRelations[]> {
    const { data, error } = await db()
      .from('leave_applications')
      .select(APP_SELECT)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as LeaveApplicationWithRelations[];
  },
  async byId(id: string): Promise<LeaveApplicationWithRelations | null> {
    const { data } = await db()
      .from('leave_applications')
      .select(APP_SELECT)
      .eq('id', id)
      .maybeSingle();
    return (data as LeaveApplicationWithRelations) ?? null;
  },
  async byUser(userId: string): Promise<LeaveApplicationWithRelations[]> {
    const { data } = await db()
      .from('leave_applications')
      .select(APP_SELECT)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []) as LeaveApplicationWithRelations[];
  },
  async byDepartment(deptId: string): Promise<LeaveApplicationWithRelations[]> {
    const { data } = await db()
      .from('leave_applications')
      .select(APP_SELECT)
      .eq('department_id', deptId)
      .order('created_at', { ascending: false });
    return (data ?? []) as LeaveApplicationWithRelations[];
  },
  async byStatus(...statuses: string[]): Promise<LeaveApplicationWithRelations[]> {
    const { data } = await db()
      .from('leave_applications')
      .select(APP_SELECT)
      .in('status', statuses)
      .order('created_at', { ascending: false });
    return (data ?? []) as LeaveApplicationWithRelations[];
  },
  async byDepartmentAndStatus(
    deptId: string,
    statuses: string[]
  ): Promise<LeaveApplicationWithRelations[]> {
    const { data } = await db()
      .from('leave_applications')
      .select(APP_SELECT)
      .eq('department_id', deptId)
      .in('status', statuses)
      .order('created_at', { ascending: false });
    return (data ?? []) as LeaveApplicationWithRelations[];
  },
  async insert(
    a: Omit<LeaveApplication, 'id' | 'created_at' | 'updated_at'>
  ): Promise<LeaveApplication> {
    const { data, error } = await db()
      .from('leave_applications')
      .insert({ ...a, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, patch: Partial<LeaveApplication>): Promise<LeaveApplication | null> {
    const { data, error } = await db()
      .from('leave_applications')
      .update({ ...patch, updated_at: nowIso() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
  /** Computed leave balances for a user (active + applicable types, total>0). */
  async leaveBalances(userId: string): Promise<LeaveBalance[]> {
    const user = await Users.byId(userId);
    if (!user) return [];
    const year = new Date().getFullYear();
    const [ents, types] = await Promise.all([
      Entitlements.byUser(userId, year),
      LeaveTypes.active(),
    ]);
    return types
      .filter((lt) => lt.applicable_to === 'both' || lt.applicable_to === user.staff_type)
      .map<LeaveBalance | null>((lt) => {
        const ent = ents.find((e) => e.leave_type_id === lt.id);
        if (!ent || ent.total_days <= 0) return null;
        return {
          leave_type: lt,
          total_days: ent.total_days,
          used_days: ent.used_days,
          remaining_days: ent.total_days - ent.used_days,
        };
      })
      .filter((b): b is LeaveBalance => b !== null);
  },
};

// ---------------- Approvals (audit) ----------------
export const Approvals = {
  async byApplication(appId: string): Promise<LeaveApproval[]> {
    const { data } = await db()
      .from('leave_approvals')
      .select('*')
      .eq('application_id', appId)
      .order('decided_at', { ascending: false });
    return data ?? [];
  },
  async insert(a: Omit<LeaveApproval, 'id' | 'decided_at'>): Promise<LeaveApproval> {
    const { data, error } = await db().from('leave_approvals').insert(a).select().single();
    if (error) throw error;
    return data;
  },
};

// ---------------- Rotas + slots ----------------
export const Rotas = {
  async byDepartment(deptId: string): Promise<LeaveRota[]> {
    const { data } = await db()
      .from('leave_rota')
      .select('*')
      .eq('department_id', deptId)
      .order('period_start', { ascending: false });
    return data ?? [];
  },
  async byId(id: string): Promise<LeaveRota | null> {
    const { data } = await db().from('leave_rota').select('*').eq('id', id).maybeSingle();
    return data ?? null;
  },
  async insert(r: Omit<LeaveRota, 'id' | 'published_at'>): Promise<LeaveRota> {
    const { data, error } = await db().from('leave_rota').insert(r).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<boolean> {
    const { error } = await db().from('leave_rota').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

export const Slots = {
  async byRota(rotaId: string): Promise<RotaSlot[]> {
    const { data } = await db().from('rota_slots').select('*').eq('rota_id', rotaId);
    return data ?? [];
  },
  async byDepartment(deptId: string): Promise<RotaSlot[]> {
    const { data } = await db()
      .from('rota_slots')
      .select('*, rota:leave_rota!inner(department_id)')
      .eq('rota.department_id', deptId);
    return (data ?? []) as unknown as RotaSlot[];
  },
  async insert(slot: Omit<RotaSlot, 'id' | 'created_at'>): Promise<RotaSlot> {
    const { data, error } = await db().from('rota_slots').insert(slot).select().single();
    if (error) throw error;
    return data;
  },
  async remove(id: string): Promise<boolean> {
    const { error } = await db().from('rota_slots').delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};

// ---------------- Notifications ----------------
export const Notifications = {
  async byUser(userId: string): Promise<Notification[]> {
    const { data } = await db()
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data ?? [];
  },
  async unreadCount(userId: string): Promise<number> {
    const { count } = await db()
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    return count ?? 0;
  },
  async insert(n: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await db().from('notifications').insert(n).select().single();
    if (error) throw error;
    return data;
  },
  async markAllRead(userId: string): Promise<void> {
    const { error } = await db()
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },
  async markRead(id: string): Promise<void> {
    const { error } = await db().from('notifications').update({ is_read: true }).eq('id', id);
    if (error) throw error;
  },
};

// ---------------- User approval requests ----------------
const UAR_SELECT =
  '*, user:users!user_id(*), department:departments!requested_department_id(*), reviewer:users!reviewed_by(*)';

export const UAR = {
  async all(): Promise<UserApprovalRequestWithRelations[]> {
    const { data } = await db()
      .from('user_approval_requests')
      .select(UAR_SELECT)
      .order('created_at', { ascending: false });
    return (data ?? []) as UserApprovalRequestWithRelations[];
  },
  async byId(id: string): Promise<UserApprovalRequestWithRelations | null> {
    const { data } = await db()
      .from('user_approval_requests')
      .select(UAR_SELECT)
      .eq('id', id)
      .maybeSingle();
    return (data as UserApprovalRequestWithRelations) ?? null;
  },
  async byStatus(status: 'pending' | 'approved' | 'rejected'): Promise<UserApprovalRequestWithRelations[]> {
    const { data } = await db()
      .from('user_approval_requests')
      .select(UAR_SELECT)
      .eq('status', status)
      .order('created_at', { ascending: false });
    return (data ?? []) as UserApprovalRequestWithRelations[];
  },
  async insert(u: Omit<UserApprovalRequest, 'id' | 'created_at'>): Promise<UserApprovalRequest> {
    const { data, error } = await db().from('user_approval_requests').insert(u).select().single();
    if (error) throw error;
    return data;
  },
  async update(
    id: string,
    patch: Partial<UserApprovalRequest>
  ): Promise<UserApprovalRequest | null> {
    const { data, error } = await db()
      .from('user_approval_requests')
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ?? null;
  },
};
