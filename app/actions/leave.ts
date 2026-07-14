'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { workingDaysInclusive } from '@/lib/utils';
import { Applications, LeaveTypes, Notifications, Slots, Users } from '@/lib/db';

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export type ApplyLeaveInput = {
  leave_type_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  cover_staff_id: string | null;
  /** FORM 1A Part I field 4 - required for casual leave, optional otherwise. */
  destination?: string | null;
};

export async function applyLeaveAction(input: ApplyLeaveInput) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { ok: false as const, message: 'Not authenticated.' };
  if (!user.departmentId) return { ok: false as const, message: 'You have no department assigned.' };

  const start = input.start_date;
  const end = input.end_date;
  if (!start || !end || start > end) {
    return { ok: false as const, message: 'Select a valid date range.' };
  }
  if ((input.reason ?? '').trim().length < 5) {
    return { ok: false as const, message: 'Provide a reason (min 5 characters).' };
  }
  if (!input.cover_staff_id) {
    return { ok: false as const, message: 'Select a staff member to cover you.' };
  }

  const total_days = workingDaysInclusive(start, end);
  if (total_days <= 0) {
    return { ok: false as const, message: 'The selected range contains no working days.' };
  }

  // FORM 1A: casual leave requires a destination (Part I field 4).
  const lt = await LeaveTypes.byId(input.leave_type_id);
  const isCasual = lt?.name?.toLowerCase() === 'casual leave';
  const destination = (input.destination ?? '').trim();
  if (isCasual && !destination) {
    return { ok: false as const, message: 'Destination is required for casual leave (FORM 1A).' };
  }

  // Truthful rota-conflict detection against published departmental slots.
  const slots = await Slots.byDepartment(user.departmentId);
  const rota_conflict = slots.some((s) =>
    rangesOverlap(start, end, s.slot_start, s.slot_end)
  );

  const inserted = await Applications.insert({
    applicant_id: user.id,
    leave_type_id: input.leave_type_id,
    department_id: user.departmentId,
    start_date: start,
    end_date: end,
    total_days,
    reason: input.reason.trim(),
    supporting_doc_url: null,
    status: 'pending',
    rota_conflict,
    cover_staff_id: input.cover_staff_id,
    // FORM 1A + applicant-context snapshots.
    destination: isCasual ? destination : (destination || null),
    applicant_rank: user.rank ?? null,
    applicant_staff_id: user.staffId ?? null,
    applicant_name: user.name ?? null,
  });

  // Notify the department HOD.
  const deptUsers = await Users.byDepartment(user.departmentId);
  const hod = deptUsers.find((u) => u.role === 'hod' && u.is_active);
  const cover = deptUsers.find((u) => u.id === input.cover_staff_id);
  if (hod) {
    await Notifications.insert({
      user_id: hod.id,
      title: 'New leave request',
      message: `${user.name ?? 'A staff member'} applied for ${lt?.name ?? 'leave'}${cover ? ` - covered by ${cover.full_name}` : ''}.`,
      type: 'leave_submitted',
      is_read: false,
      related_application_id: inserted.id,
    });
  }
  if (cover) {
    await Notifications.insert({
      user_id: cover.id,
      title: 'You are covering for a colleague',
      message: `${user.name ?? 'A colleague'} nominated you to cover their leave from ${start} to ${end}.`,
      type: 'leave_submitted',
      is_read: false,
      related_application_id: inserted.id,
    });
  }

  revalidatePath('/dashboard/staff/my-leaves');
  revalidatePath('/dashboard/hod/requests');
  return { ok: true as const, id: inserted.id };
}

export async function cancelLeaveAction(applicationId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { ok: false as const, message: 'Not authenticated.' };

  const app = await Applications.byId(applicationId);
  if (!app || app.applicant_id !== user.id) {
    return { ok: false as const, message: 'Application not found.' };
  }
  if (app.status !== 'pending' && app.status !== 'hod_approved') {
    return { ok: false as const, message: 'This application can no longer be cancelled.' };
  }
  await Applications.update(applicationId, { status: 'cancelled' });
  revalidatePath('/dashboard/staff/my-leaves');
  return { ok: true as const };
}
