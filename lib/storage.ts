import 'server-only';
import { db } from '@/lib/db/client';

/**
 * Supabase Storage wrappers for the private "leave-documents" bucket.
 * Reuses the single service-role client from `db()` — never instantiate a
 * second Supabase client here. All access is server-mediated; the browser
 * never gets a public URL, only a short-lived signed URL via
 * `getSupportingDocUrlAction` (app/actions/leave-docs.ts).
 */

const BUCKET = 'leave-documents';

export async function uploadDoc(path: string, file: File): Promise<void> {
  const { error } = await db().storage
    .from(BUCKET)
    .upload(path, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (error) throw error;
}

export async function removeDoc(path: string): Promise<void> {
  const { error } = await db().storage.from(BUCKET).remove([path]);
  // Treat "not found" as success so cancel/delete is idempotent.
  if (error && !/not found/i.test(error.message)) throw error;
}

/** Mints a short-lived signed download URL. Default 60s. */
export async function signedDocUrl(path: string, expiresIn = 60): Promise<string> {
  const { data, error } = await db().storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn, { download: true });
  if (error || !data?.signedUrl) {
    throw error ?? new Error('Could not create download URL.');
  }
  return data.signedUrl;
}
