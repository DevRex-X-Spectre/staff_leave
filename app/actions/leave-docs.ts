'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Applications, LeaveTypes } from '@/lib/db';
import { uploadDoc, removeDoc, signedDocUrl } from '@/lib/storage';
import {
  MAX_DOC_BYTES,
  ALLOWED_DOC_MIME,
  ALLOWED_DOC_EXT,
  extOf,
  docStoragePath,
} from '@/lib/leave-docs';
import type { LeaveApplicationWithRelations } from '@/types';

type Result = { ok: true } | { ok: false; message: string };

type DocAuthz =
  | { ok: true; app: LeaveApplicationWithRelations; ext: string }
  | { ok: false; message: string };

/** Shared validation + ownership check for an upload op on a pending app. */
async function authorizeForDoc(
  applicationId: string,
  file: File | null
): Promise<DocAuthz> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { ok: false, message: 'Not authenticated.' };

  const app = await Applications.byId(applicationId);
  if (!app || app.applicant_id !== user.id) {
    return { ok: false, message: 'Application not found.' };
  }
  if (app.status !== 'pending') {
    return { ok: false, message: 'Document can only be changed while the application is pending.' };
  }

  const lt = await LeaveTypes.byId(app.leave_type_id);
  if (!lt?.requires_document) {
    return { ok: false, message: 'This leave type does not require a document.' };
  }

  if (!file || file.size === 0) return { ok: false, message: 'Select a file to upload.' };
  if (file.size > MAX_DOC_BYTES) return { ok: false, message: 'File is larger than 10 MB.' };

  const ext = extOf(file.name);
  if (!(ALLOWED_DOC_EXT as readonly string[]).includes(ext)) {
    return { ok: false, message: 'File type not allowed.' };
  }
  if (file.type && !(ALLOWED_DOC_MIME as readonly string[]).includes(file.type)) {
    return { ok: false, message: 'File type not allowed.' };
  }

  return { ok: true, app, ext };
}

/**
 * Upload (or replace) the supporting doc on a pending, doc-required application.
 * Used for the Edit/Replace control in the my-leaves detail dialog, and as
 * the inner upload step at apply time (which writes the path back onto the row).
 */
export async function uploadSupportingDocAction(formData: FormData) {
  const applicationId = String(formData.get('application_id') ?? '');
  const file = formData.get('file');
  if (!(file instanceof File)) return { ok: false as const, message: 'No file provided.' };

  const authz = await authorizeForDoc(applicationId, file);
  if (!authz.ok) return authz;

  // Replace: remove previous object first (best-effort — orphaned-but-still-tracked
  // is worse than a missing object).
  if (authz.app.supporting_doc_url) {
    try {
      await removeDoc(authz.app.supporting_doc_url);
    } catch {
      /* best-effort cleanup; continue with new upload */
    }
  }

  const path = docStoragePath(applicationId, authz.ext);
  await uploadDoc(path, file);
  await Applications.update(applicationId, {
    supporting_doc_url: path,
    supporting_doc_name: file.name,
  });
  revalidatePath('/dashboard/staff/my-leaves');
  return { ok: true as const, url: path, name: file.name };
}

/** Delete the supporting doc on a pending app (owner only). */
export async function deleteSupportingDocAction(applicationId: string): Promise<Result> {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { ok: false, message: 'Not authenticated.' };

  const app = await Applications.byId(applicationId);
  if (!app || app.applicant_id !== user.id) {
    return { ok: false, message: 'Application not found.' };
  }
  if (app.status !== 'pending') {
    return { ok: false, message: 'Document can only be changed while the application is pending.' };
  }

  if (app.supporting_doc_url) {
    try {
      await removeDoc(app.supporting_doc_url);
    } catch {
      /* best-effort */
    }
  }
  await Applications.update(applicationId, {
    supporting_doc_url: null,
    supporting_doc_name: null,
  });
  revalidatePath('/dashboard/staff/my-leaves');
  return { ok: true };
}

/** Mint a short-lived signed URL for VIEW/DOWNLOAD.
 *  Authorization: applicant (owner), OR HOD of the applicant's department,
 *  OR Registrar (`hr_manager`). */
export async function getSupportingDocUrlAction(applicationId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id) return { ok: false as const, message: 'Not authenticated.' };

  const app = await Applications.byId(applicationId);
  if (!app) return { ok: false as const, message: 'Application not found.' };
  if (!app.supporting_doc_url) {
    return { ok: false as const, message: 'No document on this application.' };
  }

  const isOwner = app.applicant_id === user.id;
  const isHod = user.role === 'hod' && app.department_id === user.departmentId;
  const isRegistrar = user.role === 'hr_manager';
  if (!isOwner && !isHod && !isRegistrar) {
    return { ok: false as const, message: 'You cannot view this document.' };
  }

  const url = await signedDocUrl(app.supporting_doc_url, 60);
  return { ok: true as const, url, name: app.supporting_doc_name };
}
