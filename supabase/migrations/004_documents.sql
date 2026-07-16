-- ============================================================================
-- 004_documents.sql
-- Supporting-document upload for doc-required leave types (Sick, Maternity,
-- Paternity, Study). Run AFTER 001 + 002 + 003 on a fresh project, OR on an
-- existing one (idempotent).
--
-- Adds:
--   1. public.leave_applications.supporting_doc_name  -- original filename
--   2. Flips Paternity Leave to requires_document = true
--   3. Creates the private "leave-documents" storage bucket
--
-- The supporting_doc_url column already exists from migration 001; only its
-- comment is updated here to reflect its new meaning (storage PATH, not URL).
-- ============================================================================

-- 1) original filename for display next to the stored storage path
alter table public.leave_applications
  add column if not exists supporting_doc_name text;

comment on column public.leave_applications.supporting_doc_url is
  'Storage PATH (not public URL) of the uploaded supporting document inside the private "leave-documents" bucket, e.g. "<application_id>/<uuid>.<ext>". Null when no document.';
comment on column public.leave_applications.supporting_doc_name is
  'Original uploaded filename, for display/download label only. Null when no document.';

-- 2) Paternity Leave now requires a document (seed also updated in scripts/seed.ts)
update public.leave_types
   set requires_document = true
 where name ilike 'Paternity Leave';

-- 3) storage bucket (private). Requires the SQL role to have storage-admin.
--    If this errors in the SQL editor for lack of privilege, create the bucket
--    in the Supabase dashboard instead (Storage -> New bucket -> name:
--    "leave-documents" -> Public = OFF). Either path yields the same bucket.
insert into storage.buckets (id, name, public)
values ('leave-documents', 'leave-documents', false)
on conflict (id) do nothing;
