'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { workingDaysInclusive } from '@/lib/utils';
import { Applications, LeaveTypes, Notifications, Slots, Users } from '@/lib/db';
import { uploadDoc, removeDoc } from '@/lib/storage';
import {
  MAX_DOC_BYTES,
  ALLOWED_DOC_MIME,
  ALLOWED_DOC_EXT,
  extOf,
  docStoragePath,
} from '@/lib/leave-docs';

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

/**
 * Apply for leave. Accepts FormData so a supporting document can be uploaded
 * in the same atomic round-trip when the leave type requires one.
 *
 * Form fields:
 *   leave_type_id, start_date, end_date, reason, destination, cover_staff_id,
 *   file (only meaningful when leave_type.requires_document = true)
 */
export async function applyLeaveAction(formData: FormData) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { ok: false as const, message: 'Not authenticated.' };
  if (!user.departmentId) return { ok: false as const, message: 'You have no department assigned.' };

  const start = String(formData.get('start_date') ?? '');
  const end = String(formData.get('end_date') ?? '');
  const reason = String(formData.get('reason') ?? '');
  const cover_staff_id = String(formData.get('cover_staff_id') ?? '') || null;
  const destination = String(formData.get('destination') ?? '').trim() || null;
  const leave_type_id = String(formData.get('leave_type_id') ?? '');
  const fileRaw = formData.get('file');

  if (!start || !end || start > end) {
    return { ok: false as const, message: 'Select a valid date range.' };
  }
  if (reason.trim().length < 5) {
    return { ok: false as const, message: 'Provide a reason (min 5 characters).' };
  }
  if (!cover_staff_id) {
    return { ok: false as const, message: 'Select a staff member to cover you.' };
  }

  const total_days = workingDaysInclusive(start, end);
  if (total_days <= 0) {
    return { ok: false as const, message: 'The selected range contains no working days.' };
  }

  // FORM 1A: casual leave requires a destination (Part I field 4).
  const lt = await LeaveTypes.byId(leave_type_id);
  const isCasual = lt?.name?.toLowerCase() === 'casual leave';
  if (isCasual && !destination) {
    return { ok: false as const, message: 'Destination is required for casual leave (FORM 1A).' };
  }

  // Hard-require a valid file when the leave type demands a supporting document.
  let file: File | null = null;
  if (lt?.requires_document) {
    if (!(fileRaw instanceof File) || fileRaw.size === 0) {
      return { ok: false as const, message: 'A supporting document is required for this leave type.' };
    }
    if (fileRaw.size > MAX_DOC_BYTES) {
      return { ok: false as const, message: 'Document is larger than 10 MB.' };
    }
    const ext = extOf(fileRaw.name);
    if (!(ALLOWED_DOC_EXT as readonly string[]).includes(ext)) {
      return { ok: false as const, message: 'Document type not allowed.' };
    }
    if (
      fileRaw.type &&
      !(ALLOWED_DOC_MIME as readonly string[]).includes(fileRaw.type)
    ) {
      return { ok: false as const, message: 'Document type not allowed.' };
    }
    file = fileRaw;
  }

  // Truthful rota-conflict detection against published departmental slots.
  const slots = await Slots.byDepartment(user.departmentId);
  const rota_conflict = slots.some((s) =>
    rangesOverlap(start, end, s.slot_start, s.slot_end)
  );

  const inserted = await Applications.insert({
    applicant_id: user.id,
    leave_type_id,
    department_id: user.departmentId,
    start_date: start,
    end_date: end,
    total_days,
    reason: reason.trim(),
    supporting_doc_url: null, // filled below once we've uploaded to storage
    supporting_doc_name: null,
    status: 'pending',
    rota_conflict,
    cover_staff_id,
    // FORM 1A + applicant-context snapshots.
    destination: isCasual ? destination : destination,
    applicant_rank: user.rank ?? null,
    applicant_staff_id: user.staffId ?? null,
    applicant_name: user.name ?? null,
  });

  // Upload the doc (if required) AFTER insert — the path encodes the application id.
  if (file) {
    const path = docStoragePath(inserted.id, extOf(file.name));
    await uploadDoc(path, file);
    await Applications.update(inserted.id, {
      supporting_doc_url: path,
      supporting_doc_name: file.name,
    });
  }

  // Notify the department HOD.
  const deptUsers = await Users.byDepartment(user.departmentId);
  const hod = deptUsers.find((u) => u.role === 'hod' && u.is_active);
  const cover = deptUsers.find((u) => u.id === cover_staff_id);
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

  // Remove the stored supporting doc (best-effort) and null the columns so a
  // re-applied doc-required leave must upload fresh.
  if (app.supporting_doc_url) {
    try {
      await removeDoc(app.supporting_doc_url);
    } catch {
      /* best-effort */
    }
  }

  await Applications.update(applicationId, {
    status: 'cancelled',
    supporting_doc_url: null,
    supporting_doc_name: null,
  });
  revalidatePath('/dashboard/staff/my-leaves');
  return { ok: true as const };
}
