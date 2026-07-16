/**
 * Pure helpers and constants for the leave-document upload flow.
 * No 'server-only' — the client uses `documentLabelFor` to render the wizard.
 */

export const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_DOC_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALLOWED_DOC_EXT = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx'] as const;

/** User-facing label for the required document, derived from leave-type name. */
export function documentLabelFor(leaveTypeName: string | undefined | null): string {
  const n = (leaveTypeName ?? '').toLowerCase();
  if (n.includes('paternity') || n.includes('maternity')) return 'Hospital prescribed document';
  if (n.includes('study')) return 'Admission letter';
  if (n.includes('sick')) return 'Medical certificate';
  return 'Supporting document';
}

/** Storage path inside the private "leave-documents" bucket. ext excludes the dot. */
export function docStoragePath(applicationId: string, ext: string): string {
  return `${applicationId}/${crypto.randomUUID()}.${ext}`;
}

/** Lowercased extension without the dot, or '' if none. */
export function extOf(fileName: string): string {
  const m = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}
