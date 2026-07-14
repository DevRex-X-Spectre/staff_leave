'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Applications, Approvals, Departments, Entitlements, LeaveTypes, Notifications, Users } from '@/lib/db';
import type { ApprovalDecision, LeaveStatus } from '@/types';

async function notifyApplicantAndApprovers(args: {
  appId: string;
  applicantId: string;
  deptId: string;
  title: string;
  message: string;
  type: 'leave_approved' | 'leave_rejected' | 'leave_submitted';
  fanOutTo?: 'registrars' | 'hod';
}) {
  await Notifications.insert({
    user_id: args.applicantId,
    title: args.title,
    message: args.message,
    type: args.type,
    is_read: false,
    related_application_id: args.appId,
  });
  if (args.fanOutTo === 'registrars') {
    const registrars = (await Users.all()).filter((u) => u.role === 'hr_manager' && u.is_active);
    await Promise.all(
      registrars.map((r) =>
        Notifications.insert({
          user_id: r.id,
          title: 'Leave awaiting Registrar review',
          message: args.message,
          type: 'leave_submitted',
          is_read: false,
          related_application_id: args.appId,
        })
      )
    );
  }
  if (args.fanOutTo === 'hod') {
    const dept = await Departments.byId(args.deptId);
    if (dept?.hod_id) {
      await Notifications.insert({
        user_id: dept.hod_id,
        title: 'Registrar decision recorded',
        message: args.message,
        type: args.type,
        is_read: false,
        related_application_id: args.appId,
      });
    }
  }
}

/** HOD approve -> forward to Registrar. HOD reject -> terminal. */
export async function hodDecisionAction(args: {
  applicationId: string;
  decision: 'approve' | 'reject';
  comment: string;
  /** FORM 1A Part II - 'department' | 'applicant'. Casual leave only. */
  howFinanced?: 'department' | 'applicant' | null;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== 'hod') {
    return { ok: false as const, message: 'Only an HOD can do this.' };
  }

  const app = await Applications.byId(args.applicationId);
  if (!app) return { ok: false as const, message: 'Application not found.' };
  if (app.department_id !== user.departmentId) {
    return { ok: false as const, message: 'This application is outside your department.' };
  }
  if (args.decision === 'reject' && !args.comment.trim()) {
    return { ok: false as const, message: 'Please provide a rejection reason.' };
  }

  const decisionValue: ApprovalDecision = args.decision === 'approve' ? 'approved' : 'rejected';
  const nextStatus: LeaveStatus = args.decision === 'approve' ? 'hod_approved' : 'hod_rejected';
  const lt = await LeaveTypes.byId(app.leave_type_id);
  const isCasual = lt?.name?.toLowerCase() === 'casual leave';

  await Applications.update(args.applicationId, { status: nextStatus });
  await Approvals.insert({
    application_id: args.applicationId,
    approver_id: user.id,
    approver_role: 'hod',
    decision: decisionValue,
    comment: args.comment.trim() || null,
    how_financed: isCasual && args.decision === 'approve' ? (args.howFinanced ?? null) : null,
  });

  await notifyApplicantAndApprovers({
    appId: args.applicationId,
    applicantId: app.applicant_id,
    deptId: app.department_id,
    title: args.decision === 'approve' ? 'HOD approved your leave' : 'HOD rejected your leave',
    message:
      args.decision === 'approve'
        ? `Your ${lt?.name ?? 'leave'} has been forwarded to the Registrar for final approval.`
        : args.comment.trim() || 'Your HOD did not approve the leave.',
    type: args.decision === 'approve' ? 'leave_approved' : 'leave_rejected',
    fanOutTo: args.decision === 'approve' ? 'registrars' : undefined,
  });

  revalidatePath('/dashboard/hod/requests');
  revalidatePath('/dashboard/hod/all-requests');
  revalidatePath('/dashboard/staff/my-leaves');
  revalidatePath('/dashboard/registrar/requests');
  return { ok: true as const };
}

/** Registrar final decision. Approval deducts the leave entitlement. */
export async function registrarDecisionAction(args: {
  applicationId: string;
  decision: 'approve' | 'reject';
  comment: string;
  /** FORM 1A Part III - 'university' | 'applicant'. Casual leave only. */
  howFinanced?: 'university' | 'applicant' | null;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== 'hr_manager') {
    return { ok: false as const, message: 'Only the Registrar can do this.' };
  }

  const app = await Applications.byId(args.applicationId);
  if (!app) return { ok: false as const, message: 'Application not found.' };
  if (app.status !== 'hod_approved') {
    return { ok: false as const, message: 'Only HOD-approved applications can be finalised.' };
  }
  if (args.decision === 'reject' && !args.comment.trim()) {
    return { ok: false as const, message: 'Please provide a rejection reason.' };
  }

  const decisionValue: ApprovalDecision = args.decision === 'approve' ? 'approved' : 'rejected';
  const nextStatus: LeaveStatus = args.decision === 'approve' ? 'approved' : 'rejected';
  const lt = await LeaveTypes.byId(app.leave_type_id);
  const isCasual = lt?.name?.toLowerCase() === 'casual leave';

  await Applications.update(args.applicationId, { status: nextStatus });
  await Approvals.insert({
    application_id: args.applicationId,
    approver_id: user.id,
    approver_role: 'hr_manager',
    decision: decisionValue,
    comment: args.comment.trim() || null,
    how_financed: isCasual && args.decision === 'approve' ? (args.howFinanced ?? null) : null,
  });

  // Deduct entitlement on final approval.
  if (args.decision === 'approve') {
    const year = new Date(app.start_date).getFullYear();
    const ents = await Entitlements.byUser(app.applicant_id, year);
    const ent = ents.find((e) => e.leave_type_id === app.leave_type_id);
    if (ent) {
      await Entitlements.update(ent.id, { used_days: ent.used_days + app.total_days });
    }
  }

  await notifyApplicantAndApprovers({
    appId: args.applicationId,
    applicantId: app.applicant_id,
    deptId: app.department_id,
    title: args.decision === 'approve' ? 'Leave fully approved' : 'Leave rejected',
    message:
      args.decision === 'approve'
        ? `Your ${lt?.name ?? 'leave'} request has been fully approved.`
        : args.comment.trim() || 'The Registrar did not approve the leave.',
    type: args.decision === 'approve' ? 'leave_approved' : 'leave_rejected',
    fanOutTo: 'hod',
  });

  revalidatePath('/dashboard/registrar/requests');
  revalidatePath('/dashboard/registrar/all-applications');
  revalidatePath('/dashboard/registrar/entitlements');
  revalidatePath('/dashboard/staff/my-leaves');
  return { ok: true as const };
}
