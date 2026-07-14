'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { Departments, Entitlements, LeaveTypes, Notifications, UAR, Users, Credentials } from '@/lib/db';
import { provisionEntitlementsForUser, resyncAnnualEntitlement } from '@/lib/entitlements';
import { DEFAULT_PASSWORD } from '@/lib/constants';
import type { StaffGrade, StaffType, UserRole } from '@/types';

export async function approveUserAction(uarId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  const req = await UAR.byId(uarId);
  if (!req || req.status !== 'pending') return { ok: false as const, message: 'Request not found.' };

  await UAR.update(uarId, {
    status: 'approved',
    admin_comment: null,
    reviewed_by: session.user.id,
    reviewed_at: new Date().toISOString(),
  });
  await Users.update(req.user_id, { is_approved: true });

  const approvedUser = await Users.byId(req.user_id);
  let created = 0;
  if (approvedUser) {
    created = await provisionEntitlementsForUser(approvedUser);
  }
  await Notifications.insert({
    user_id: req.user_id,
    title: 'Account approved',
    message: 'Your NAUB LMS account has been approved. You can now log in.',
    type: 'account_approved',
    is_read: false,
    related_application_id: null,
  });

  revalidatePath('/dashboard/admin/approvals');
  revalidatePath('/dashboard/admin/staff');
  return { ok: true as const, created };
}

export async function rejectUserAction(uarId: string, comment: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  if (!comment.trim()) return { ok: false as const, message: 'Provide a rejection reason.' };
  const req = await UAR.byId(uarId);
  if (!req || req.status !== 'pending') return { ok: false as const, message: 'Request not found.' };

  await UAR.update(uarId, {
    status: 'rejected',
    admin_comment: comment.trim(),
    reviewed_by: session.user.id,
    reviewed_at: new Date().toISOString(),
  });
  await Notifications.insert({
    user_id: req.user_id,
    title: 'Account not approved',
    message: comment.trim(),
    type: 'general',
    is_read: false,
    related_application_id: null,
  });
  revalidatePath('/dashboard/admin/approvals');
  return { ok: true as const };
}

export type CreateStaffInput = {
  full_name: string;
  email: string;
  phone: string;
  staff_id: string;
  staff_type: StaffType;
  staff_grade: StaffGrade;
  /** Job title / academic rank (e.g. "Lecturer II", "Senior Lecturer",
   *  "Professor", "Assistant Registrar"). */
  rank: string;
  department_id: string;
  role: Exclude<UserRole, 'admin'>;
};

export async function createStaffAction(input: CreateStaffInput) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  if (!input.full_name.trim() || !/\S+@\S+\.\S+/.test(input.email) || !input.staff_id.trim() || !input.department_id) {
    return { ok: false as const, message: 'Fill all required fields with a valid email.' };
  }
  if (!input.rank.trim()) {
    return { ok: false as const, message: 'Rank is required.' };
  }
  if (await Users.byStaffId(input.staff_id)) {
    return { ok: false as const, message: 'A user with that staff ID already exists.' };
  }
  if (await Users.byEmail(input.email)) {
    return { ok: false as const, message: 'A user with that email already exists.' };
  }
  const dept = await Departments.byId(input.department_id);
  if (!dept) return { ok: false as const, message: 'Department not found.' };

  const created = await Users.insert({
    full_name: input.full_name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    staff_id: input.staff_id.trim(),
    role: input.role,
    staff_type: input.staff_type,
    staff_grade: input.staff_type === 'academic' ? null : input.staff_grade,
    rank: input.rank.trim(),
    department_id: input.department_id,
    is_approved: true,
    is_active: true,
  });
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  await Credentials.set(created.id, hash);
  const provisioned = await provisionEntitlementsForUser(created);

  revalidatePath('/dashboard/admin/staff');
  return { ok: true as const, provisioned };
}

export async function updateStaffRoleAction(userId: string, role: UserRole) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  await Users.update(userId, { role });
  revalidatePath('/dashboard/admin/staff');
  return { ok: true as const };
}

export async function updateStaffCategoryAction(
  userId: string,
  staffType: StaffType,
  staffGrade: StaffGrade
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  const u = await Users.byId(userId);
  if (!u) return { ok: false as const, message: 'User not found.' };
  const nextGrade: StaffGrade | null = staffType === 'academic' ? null : staffGrade;
  await Users.update(userId, { staff_type: staffType, staff_grade: nextGrade });
  await resyncAnnualEntitlement({ ...u, staff_type: staffType, staff_grade: nextGrade });
  revalidatePath('/dashboard/admin/staff');
  revalidatePath('/dashboard/registrar/entitlements');
  return { ok: true as const };
}

export async function toggleStaffActiveAction(userId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  const u = await Users.byId(userId);
  if (!u) return { ok: false as const, message: 'User not found.' };
  await Users.update(userId, { is_active: !u.is_active });
  revalidatePath('/dashboard/admin/staff');
  return { ok: true as const };
}

export async function adjustEntitlementAction(entitlementId: string, delta: number) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'hr_manager') {
    return { ok: false as const, message: 'Only the Registrar can do this.' };
  }
  const ent = await Entitlements.byId(entitlementId);
  if (!ent) return { ok: false as const, message: 'Entitlement not found.' };
  await Entitlements.update(entitlementId, {
    total_days: Math.max(0, ent.total_days + delta),
  });
  revalidatePath('/dashboard/registrar/entitlements');
  return { ok: true as const };
}

// ---------------- Departments (admin CRUD) ----------------

export async function createDepartmentAction(input: { name: string; hodId: string | null }) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  if (!input.name.trim()) return { ok: false as const, message: 'Department name is required.' };
  await Departments.insert({ name: input.name.trim(), hod_id: input.hodId || null });
  revalidatePath('/dashboard/admin/departments');
  revalidatePath('/dashboard/admin/staff');
  return { ok: true as const };
}

export async function deleteDepartmentAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  await Departments.remove(id);
  revalidatePath('/dashboard/admin/departments');
  revalidatePath('/dashboard/admin/staff');
  return { ok: true as const };
}

// ---------------- Leave types (admin CRUD) ----------------

export async function createLeaveTypeAction(input: {
  name: string;
  applicableTo: 'both' | 'academic' | 'non_academic';
  maxDaysAcademic: number | null;
  maxDaysNonAcademic: number | null;
  requiresDocument: boolean;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  if (!input.name.trim()) return { ok: false as const, message: 'Name is required.' };
  await LeaveTypes.insert({
    name: input.name.trim(),
    applicable_to: input.applicableTo,
    max_days_academic: input.maxDaysAcademic,
    max_days_non_academic: input.maxDaysNonAcademic,
    requires_document: input.requiresDocument,
    is_active: true,
  });
  revalidatePath('/dashboard/admin/leave-types');
  return { ok: true as const };
}

export async function toggleLeaveTypeAction(id: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'admin') {
    return { ok: false as const, message: 'Only an admin can do this.' };
  }
  const lt = await LeaveTypes.byId(id);
  if (!lt) return { ok: false as const, message: 'Leave type not found.' };
  await LeaveTypes.update(id, { is_active: !lt.is_active });
  revalidatePath('/dashboard/admin/leave-types');
  return { ok: true as const };
}
