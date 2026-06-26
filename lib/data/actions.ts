'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
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
import { getSupabaseServiceClient, getSupabaseServerClient } from '@/lib/supabase/server';
import { isDemoMode, uid } from '@/lib/utils';
import { requireRole, requireUser } from '@/lib/auth';
import {
  sendAccountApproved,
  sendAccountRejected,
  sendHrDecision,
  sendHodDecision,
  sendLeaveSubmittedToHod,
  sendRotaPublished,
} from '@/lib/email';
import type {
  ApprovalDecision,
  LeaveStatus,
  UserRole,
} from '@/types';

/* ============================================================
   Auth — register
   ============================================================ */

const RegisterSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(7).optional(),
  staff_id: z.string().min(2),
  staff_type: z.enum(['academic', 'non_academic']),
  department_id: z.string().uuid().or(z.string().min(1)),
  requested_role: z.enum(['staff', 'hod', 'hr_manager']),
});

export type RegisterState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function registerAction(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  if (isDemoMode()) {
    if (Users.byEmail(data.email)) {
      return { message: 'An account with that email already exists.' };
    }
    const newUserId = `user-${uid()}`;
    const now = new Date().toISOString();
    Users.insert({
      id: newUserId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone ?? null,
      staff_id: data.staff_id,
      role: data.requested_role,
      staff_type: data.staff_type,
      department_id: data.department_id,
      is_approved: false,
      is_active: true,
      created_at: now,
      updated_at: now,
    });
    UAR.insert({
      user_id: newUserId,
      requested_role: data.requested_role,
      requested_department_id: data.department_id,
      status: 'pending',
      admin_comment: null,
      reviewed_by: null,
      reviewed_at: null,
    });
    return { ok: true, message: 'Account submitted for admin approval.' };
  }

  const sb = await getSupabaseServiceClient();
  const { data: created, error } = await sb.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  });
  if (error || !created?.user) {
    return { message: error?.message ?? 'Failed to create account.' };
  }
  const userId = created.user.id;
  await sb.from('users').insert({
    id: userId,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone ?? null,
    staff_id: data.staff_id,
    role: data.requested_role,
    staff_type: data.staff_type,
    department_id: data.department_id,
    is_approved: false,
    is_active: true,
  });
  await sb.from('user_approval_requests').insert({
    user_id: userId,
    requested_role: data.requested_role,
    requested_department_id: data.department_id,
  });
  return { ok: true, message: 'Account submitted for admin approval.' };
}

/* ============================================================
   Admin — approve / reject user
   ============================================================ */
export async function approveUserAction(formData: FormData) {
  const admin = await requireRole('admin');
  const requestId = String(formData.get('request_id') ?? '');
  const comment = String(formData.get('comment') ?? '') || null;

  if (isDemoMode()) {
    const req = UAR.byId(requestId);
    if (!req) throw new Error('Request not found');
    UAR.update(requestId, {
      status: 'approved',
      admin_comment: comment,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    });
    Users.update(req.user_id, { is_approved: true });
    const u = Users.byId(req.user_id);
    if (u) {
      Notifications.insert({
        user_id: u.id,
        title: 'Account approved',
        message: 'Your NAUB LMS account has been approved. You can now log in.',
        type: 'account_approved',
        is_read: false,
        related_application_id: null,
      });
      await sendAccountApproved(u.email, u.full_name);
    }
  } else {
    const sb = await getSupabaseServiceClient();
    const { data: req } = await sb
      .from('user_approval_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (!req) throw new Error('Request not found');
    await sb
      .from('user_approval_requests')
      .update({
        status: 'approved',
        admin_comment: comment,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
    await sb.from('users').update({ is_approved: true }).eq('id', req.user_id);
    const { data: u } = await sb.from('users').select('*').eq('id', req.user_id).single();
    if (u) {
      await sb.from('notifications').insert({
        user_id: u.id,
        title: 'Account approved',
        message: 'Your NAUB LMS account has been approved. You can now log in.',
        type: 'account_approved',
        is_read: false,
        related_application_id: null,
      });
      await sendAccountApproved(u.email, u.full_name);
    }
  }
  revalidatePath('/dashboard/admin/approvals');
}

export async function rejectUserAction(formData: FormData) {
  const admin = await requireRole('admin');
  const requestId = String(formData.get('request_id') ?? '');
  const comment = String(formData.get('comment') ?? '').trim();
  if (!comment) throw new Error('Rejection comment is required');

  if (isDemoMode()) {
    const req = UAR.byId(requestId);
    if (!req) throw new Error('Request not found');
    UAR.update(requestId, {
      status: 'rejected',
      admin_comment: comment,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    });
    const u = Users.byId(req.user_id);
    if (u) {
      Notifications.insert({
        user_id: u.id,
        title: 'Account not approved',
        message: comment,
        type: 'account_approved',
        is_read: false,
        related_application_id: null,
      });
      await sendAccountRejected(u.email, u.full_name, comment);
    }
  } else {
    const sb = await getSupabaseServiceClient();
    const { data: req } = await sb
      .from('user_approval_requests')
      .select('*')
      .eq('id', requestId)
      .single();
    if (!req) throw new Error('Request not found');
    await sb
      .from('user_approval_requests')
      .update({
        status: 'rejected',
        admin_comment: comment,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', requestId);
    const { data: u } = await sb.from('users').select('*').eq('id', req.user_id).single();
    if (u) {
      await sendAccountRejected(u.email, u.full_name, comment);
    }
  }
  revalidatePath('/dashboard/admin/approvals');
}

/* ============================================================
   Staff — apply for leave
   ============================================================ */
const ApplySchema = z.object({
  leave_type_id: z.string().min(1),
  start_date: z.string().min(10),
  end_date: z.string().min(10),
  reason: z.string().min(5),
});

export async function applyForLeaveAction(formData: FormData) {
  const user = await requireRole('staff', 'hod', 'hr_manager', 'admin');
  if (!user.department_id) throw new Error('User is not assigned to a department');

  const parsed = ApplySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const data = parsed.data;
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  const days = Math.round((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / 86400000) + 1;
  if (days <= 0) throw new Error('End date must be on or after start date');

  const leaveType = isDemoMode()
    ? LeaveTypes.byId(data.leave_type_id)
    : null;

  // Rota conflict detection (demo only — Supabase would use a SQL query)
  let rotaConflict = false;
  if (isDemoMode()) {
    const deptRotas = Rotas.byDepartment(user.department_id);
    for (const r of deptRotas) {
      if (
        data.start_date <= r.period_end &&
        data.end_date >= r.period_start
      ) {
        const slots = Slots.byRota(r.id).filter(
          (s) =>
            s.user_id !== user.id &&
            !(s.slot_end < data.start_date || s.slot_start > data.end_date)
        );
        if (slots.length >= r.max_concurrent) {
          rotaConflict = true;
          break;
        }
      }
    }
  }

  const appId = isDemoMode() ? `app-${uid()}` : '';

  if (isDemoMode()) {
    Applications.insert({
      id: appId,
      applicant_id: user.id,
      leave_type_id: data.leave_type_id,
      department_id: user.department_id,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: days,
      reason: data.reason,
      supporting_doc_url: null,
      status: 'pending',
      rota_conflict: rotaConflict,
    });
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('leave_applications').insert({
      applicant_id: user.id,
      leave_type_id: data.leave_type_id,
      department_id: user.department_id,
      start_date: data.start_date,
      end_date: data.end_date,
      total_days: days,
      reason: data.reason,
      supporting_doc_url: null,
      status: 'pending',
      rota_conflict: rotaConflict,
    });
  }

  // Notify HOD(s) in the applicant's department
  if (isDemoMode()) {
    const dept = Departments.byId(user.department_id);
    const hodUser = dept?.hod_id ? Users.byId(dept.hod_id) : null;
    const lt = LeaveTypes.byId(data.leave_type_id);
    if (hodUser && lt) {
      Notifications.insert({
        user_id: hodUser.id,
        title: 'New leave request',
        message: `${user.full_name} applied for ${lt.name} (${data.start_date} → ${data.end_date}).`,
        type: 'leave_submitted',
        is_read: false,
        related_application_id: appId,
      });
      await sendLeaveSubmittedToHod({
        hod: hodUser,
        applicant: user,
        leaveType: lt,
        application: {
          id: appId,
          applicant_id: user.id,
          leave_type_id: data.leave_type_id,
          department_id: user.department_id,
          start_date: data.start_date,
          end_date: data.end_date,
          total_days: days,
          reason: data.reason,
          supporting_doc_url: null,
          status: 'pending',
          rota_conflict: rotaConflict,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }
  }

  revalidatePath('/dashboard/staff/my-leaves');
  revalidatePath('/dashboard/hod/requests');
}

/* ============================================================
   HOD — approve / reject leave (first gate)
   ============================================================ */
export async function hodDecisionAction(formData: FormData) {
  const user = await requireRole('hod');
  const applicationId = String(formData.get('application_id') ?? '');
  const decision = String(formData.get('decision') ?? '') as ApprovalDecision;
  const comment = String(formData.get('comment') ?? '') || null;
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new Error('Invalid decision');
  }

  const nextStatus: LeaveStatus = decision === 'approved' ? 'hod_approved' : 'hod_rejected';

  if (isDemoMode()) {
    const app = Applications.byId(applicationId);
    if (!app) throw new Error('Application not found');
    if (app.department_id !== user.department_id) throw new Error('Forbidden');
    Applications.update(applicationId, { status: nextStatus });
    Approvals.insert({
      application_id: applicationId,
      approver_id: user.id,
      approver_role: 'hod',
      decision,
      comment,
    });
    const applicant = Users.byId(app.applicant_id);
    const lt = LeaveTypes.byId(app.leave_type_id);
    if (applicant && lt) {
      Notifications.insert({
        user_id: applicant.id,
        title: decision === 'approved' ? 'HOD approved your leave' : 'HOD rejected your leave',
        message:
          decision === 'approved'
            ? 'Your leave has been forwarded to HR for final approval.'
            : comment ?? 'Your HOD did not approve the leave.',
        type: decision === 'approved' ? 'leave_approved' : 'leave_rejected',
        is_read: false,
        related_application_id: applicationId,
      });
      // Notify HR Managers in parallel
      const hrs = Users.all().filter((u) => u.role === 'hr_manager' && u.is_active);
      hrs.forEach((hr) => {
        Notifications.insert({
          user_id: hr.id,
          title: 'Leave awaiting HR review',
          message: `${applicant.full_name}'s ${lt.name} request needs final approval.`,
          type: 'leave_submitted',
          is_read: false,
          related_application_id: applicationId,
        });
      });
      await sendHodDecision({
        applicant,
        hr: hrs[0] ?? null,
        application: { ...app, status: nextStatus },
        leaveType: lt,
        approved: decision === 'approved',
        comment,
      });
    }
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('leave_applications').update({ status: nextStatus }).eq('id', applicationId);
    await sb.from('leave_approvals').insert({
      application_id: applicationId,
      approver_id: user.id,
      approver_role: 'hod',
      decision,
      comment,
    });
  }

  revalidatePath('/dashboard/hod/requests');
  revalidatePath('/dashboard/hod/all-requests');
  revalidatePath('/dashboard/hr/requests');
  revalidatePath('/dashboard/staff/my-leaves');
}

/* ============================================================
   HR — final approve / reject leave
   ============================================================ */
export async function hrDecisionAction(formData: FormData) {
  const user = await requireRole('hr_manager', 'admin');
  const applicationId = String(formData.get('application_id') ?? '');
  const decision = String(formData.get('decision') ?? '') as ApprovalDecision;
  const comment = String(formData.get('comment') ?? '') || null;
  if (decision !== 'approved' && decision !== 'rejected') {
    throw new Error('Invalid decision');
  }

  const nextStatus: LeaveStatus = decision === 'approved' ? 'approved' : 'rejected';

  if (isDemoMode()) {
    const app = Applications.byId(applicationId);
    if (!app) throw new Error('Application not found');
    Applications.update(applicationId, { status: nextStatus });
    Approvals.insert({
      application_id: applicationId,
      approver_id: user.id,
      approver_role: 'hr_manager',
      decision,
      comment,
    });
    // Deduct from entitlement on approval
    if (decision === 'approved') {
      const year = new Date(app.start_date).getFullYear();
      const ent = Entitlements.byUser(app.applicant_id, year).find(
        (e) => e.leave_type_id === app.leave_type_id
      );
      if (ent) {
        Entitlements.update(ent.id, {
          used_days: ent.used_days + app.total_days,
        });
      }
    }
    const applicant = Users.byId(app.applicant_id);
    const lt = LeaveTypes.byId(app.leave_type_id);
    const dept = Departments.byId(app.department_id);
    const hod = dept?.hod_id ? Users.byId(dept.hod_id) : null;
    if (applicant && lt) {
      Notifications.insert({
        user_id: applicant.id,
        title:
          decision === 'approved' ? 'Leave approved' : 'Leave rejected',
        message:
          decision === 'approved'
            ? `Your ${lt.name} request has been fully approved.`
            : comment ?? 'HR did not approve the leave.',
        type: decision === 'approved' ? 'leave_approved' : 'leave_rejected',
        is_read: false,
        related_application_id: applicationId,
      });
      if (hod) {
        Notifications.insert({
          user_id: hod.id,
          title:
            decision === 'approved'
              ? 'Leave fully approved'
              : 'Leave rejected at HR',
          message: `${applicant.full_name}'s ${lt.name} was ${nextStatus}.`,
          type: 'leave_approved',
          is_read: false,
          related_application_id: applicationId,
        });
      }
      await sendHrDecision({
        applicant,
        hod: hod ?? applicant,
        application: { ...app, status: nextStatus },
        leaveType: lt,
        approved: decision === 'approved',
        comment,
      });
    }
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('leave_applications').update({ status: nextStatus }).eq('id', applicationId);
    await sb.from('leave_approvals').insert({
      application_id: applicationId,
      approver_id: user.id,
      approver_role: 'hr_manager',
      decision,
      comment,
    });
  }

  revalidatePath('/dashboard/hr/requests');
  revalidatePath('/dashboard/hr/all-applications');
  revalidatePath('/dashboard/staff/my-leaves');
}

/* ============================================================
   Staff — cancel pending application
   ============================================================ */
export async function cancelApplicationAction(formData: FormData) {
  const user = await requireUser();
  const applicationId = String(formData.get('application_id') ?? '');
  if (isDemoMode()) {
    const app = Applications.byId(applicationId);
    if (!app) throw new Error('Application not found');
    if (app.applicant_id !== user.id) throw new Error('Forbidden');
    if (app.status !== 'pending' && app.status !== 'hod_approved') {
      throw new Error('Cannot cancel at this stage');
    }
    Applications.update(applicationId, { status: 'cancelled' });
  } else {
    const sb = await getSupabaseServerClient();
    await sb
      .from('leave_applications')
      .update({ status: 'cancelled' })
      .eq('id', applicationId)
      .eq('applicant_id', user.id);
  }
  revalidatePath('/dashboard/staff/my-leaves');
}

/* ============================================================
   HOD — publish rota
   ============================================================ */
const PublishRotaSchema = z.object({
  title: z.string().min(2),
  period_start: z.string().min(10),
  period_end: z.string().min(10),
  max_concurrent: z.coerce.number().int().min(1).max(50),
  notes: z.string().optional(),
});

export async function publishRotaAction(formData: FormData) {
  const user = await requireRole('hod');
  if (!user.department_id) throw new Error('No department assigned');

  const parsed = PublishRotaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join(', '));
  }
  const data = parsed.data;
  const slotsRaw = String(formData.get('slots') ?? '[]');
  let slots: Array<{ user_id: string; slot_start: string; slot_end: string; leave_type_id: string | null }> = [];
  try {
    slots = JSON.parse(slotsRaw);
  } catch {
    slots = [];
  }

  if (isDemoMode()) {
    const rota = Rotas.insert({
      department_id: user.department_id,
      title: data.title,
      period_start: data.period_start,
      period_end: data.period_end,
      max_concurrent: data.max_concurrent,
      published_by: user.id,
      notes: data.notes ?? null,
    });
    slots.forEach((s) =>
      Slots.insert({
        rota_id: rota.id,
        user_id: s.user_id,
        slot_start: s.slot_start,
        slot_end: s.slot_end,
        leave_type_id: s.leave_type_id ?? null,
      })
    );
    const dept = Departments.byId(user.department_id);
    const deptStaff = Users.all().filter(
      (u) => u.department_id === user.department_id && u.role === 'staff' && u.is_active
    );
    deptStaff.forEach((s) =>
      Notifications.insert({
        user_id: s.id,
        title: 'Departmental rota published',
        message: `${data.title} (${data.period_start} → ${data.period_end})`,
        type: 'rota_published',
        is_read: false,
        related_application_id: null,
      })
    );
    await sendRotaPublished({
      staff: deptStaff,
      rotaTitle: data.title,
      department: dept?.name ?? '',
      periodStart: data.period_start,
      periodEnd: data.period_end,
    });
  } else {
    const sb = await getSupabaseServiceClient();
    const { data: rota } = await sb
      .from('leave_rota')
      .insert({
        department_id: user.department_id,
        title: data.title,
        period_start: data.period_start,
        period_end: data.period_end,
        max_concurrent: data.max_concurrent,
        published_by: user.id,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (rota) {
      const rows = slots.map((s) => ({
        rota_id: rota.id,
        user_id: s.user_id,
        slot_start: s.slot_start,
        slot_end: s.slot_end,
        leave_type_id: s.leave_type_id ?? null,
      }));
      if (rows.length) await sb.from('rota_slots').insert(rows);
    }
  }
  revalidatePath('/dashboard/hod/rota');
  revalidatePath('/dashboard/staff/rota');
}

/* ============================================================
   Notifications — mark read
   ============================================================ */
export async function markNotificationReadAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (isDemoMode()) {
    Notifications.markRead(id);
  } else {
    const sb = await getSupabaseServerClient();
    await sb.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id);
  }
  revalidatePath('/dashboard');
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  if (isDemoMode()) {
    Notifications.markAllRead(user.id);
  } else {
    const sb = await getSupabaseServerClient();
    await sb.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  }
  revalidatePath('/dashboard');
}

/* ============================================================
   Admin — staff management mutations
   ============================================================ */
export async function toggleUserActiveAction(formData: FormData) {
  await requireRole('admin');
  const userId = String(formData.get('user_id') ?? '');
  const target = String(formData.get('is_active') ?? '');
  const next = target === 'true' ? false : true;
  if (isDemoMode()) {
    Users.update(userId, { is_active: next });
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('users').update({ is_active: next }).eq('id', userId);
  }
  revalidatePath('/dashboard/admin/staff');
}

export async function changeUserRoleAction(formData: FormData) {
  await requireRole('admin');
  const userId = String(formData.get('user_id') ?? '');
  const role = String(formData.get('role') ?? '') as UserRole;
  if (!['admin', 'hod', 'hr_manager', 'staff'].includes(role)) {
    throw new Error('Invalid role');
  }
  if (isDemoMode()) {
    Users.update(userId, { role });
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('users').update({ role }).eq('id', userId);
  }
  revalidatePath('/dashboard/admin/staff');
}

/* ============================================================
   Admin — department CRUD
   ============================================================ */
export async function createDepartmentAction(formData: FormData) {
  await requireRole('admin');
  const name = String(formData.get('name') ?? '').trim();
  const hod_id = String(formData.get('hod_id') ?? '') || null;
  if (!name) throw new Error('Department name is required');
  if (isDemoMode()) {
    Departments.insert({ name, hod_id });
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('departments').insert({ name, hod_id });
  }
  revalidatePath('/dashboard/admin/departments');
}

export async function updateDepartmentAction(formData: FormData) {
  await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const hod_id = String(formData.get('hod_id') ?? '') || null;
  if (isDemoMode()) {
    Departments.update(id, { name, hod_id });
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('departments').update({ name, hod_id }).eq('id', id);
  }
  revalidatePath('/dashboard/admin/departments');
}

export async function deleteDepartmentAction(formData: FormData) {
  await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  if (isDemoMode()) {
    Departments.remove(id);
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('departments').delete().eq('id', id);
  }
  revalidatePath('/dashboard/admin/departments');
}

/* ============================================================
   Admin — leave types
   ============================================================ */
export async function createLeaveTypeAction(formData: FormData) {
  await requireRole('admin');
  const name = String(formData.get('name') ?? '').trim();
  const applicable_to = String(formData.get('applicable_to') ?? 'both') as
    | 'academic'
    | 'non_academic'
    | 'both';
  const max_days_academic = formData.get('max_days_academic')
    ? Number(formData.get('max_days_academic'))
    : null;
  const max_days_non_academic = formData.get('max_days_non_academic')
    ? Number(formData.get('max_days_non_academic'))
    : null;
  const requires_document = formData.get('requires_document') === 'on';
  if (!name) throw new Error('Name is required');
  if (isDemoMode()) {
    LeaveTypes.insert({
      name,
      applicable_to,
      max_days_academic,
      max_days_non_academic,
      requires_document,
      is_active: true,
    });
  } else {
    const sb = await getSupabaseServiceClient();
    await sb.from('leave_types').insert({
      name,
      applicable_to,
      max_days_academic,
      max_days_non_academic,
      requires_document,
      is_active: true,
    });
  }
  revalidatePath('/dashboard/admin/leave-types');
}

export async function toggleLeaveTypeActiveAction(formData: FormData) {
  await requireRole('admin');
  const id = String(formData.get('id') ?? '');
  const current = String(formData.get('is_active') ?? '');
  if (isDemoMode()) {
    const lt = LeaveTypes.byId(id);
    if (lt) LeaveTypes.update(id, { is_active: !lt.is_active });
  } else {
    const sb = await getSupabaseServiceClient();
    const { data } = await sb.from('leave_types').select('is_active').eq('id', id).single();
    if (data) await sb.from('leave_types').update({ is_active: !data.is_active }).eq('id', id);
  }
  revalidatePath('/dashboard/admin/leave-types');
}

/* ============================================================
   HR — adjust entitlement
   ============================================================ */
export async function adjustEntitlementAction(formData: FormData) {
  await requireRole('hr_manager', 'admin');
  const id = String(formData.get('id') ?? '');
  const delta = Number(formData.get('delta') ?? 0);
  if (!id || !Number.isFinite(delta) || delta === 0) {
    throw new Error('Invalid adjustment');
  }
  if (isDemoMode()) {
    const ent = Entitlements.byId(id);
    if (!ent) throw new Error('Entitlement not found');
    Entitlements.update(id, {
      total_days: Math.max(0, ent.total_days + delta),
    });
  } else {
    const sb = await getSupabaseServiceClient();
    const { data: ent } = await sb
      .from('leave_entitlements')
      .select('total_days')
      .eq('id', id)
      .single();
    if (ent) {
      await sb
        .from('leave_entitlements')
        .update({ total_days: Math.max(0, ent.total_days + delta) })
        .eq('id', id);
    }
  }
  revalidatePath('/dashboard/hr/entitlements');
}

/* ============================================================
   Demo — switch session user (top-bar role switcher)
   ============================================================ */
export async function switchDemoUserAction(formData: FormData) {
  const userId = String(formData.get('user_id') ?? '');
  const role = String(formData.get('role') ?? '');
  const { setDemoSession } = await import('@/lib/mock/session');
  await setDemoSession(userId);
  const { cookies } = await import('next/headers');
  const c = await cookies();
  c.set('naub-demo-role', role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  const target =
    role === 'admin'
      ? '/dashboard/admin'
      : role === 'hod'
      ? '/dashboard/hod'
      : role === 'hr_manager'
      ? '/dashboard/hr'
      : '/dashboard/staff';
  redirect(target);
}

export async function signOutDemoAction() {
  const { clearDemoSession } = await import('@/lib/mock/session');
  await clearDemoSession();
  const { cookies } = await import('next/headers');
  const c = await cookies();
  c.delete('naub-demo-role');
  redirect('/login');
}