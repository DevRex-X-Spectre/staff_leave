-- ============================================================================
-- 003_form1a_and_rank.sql
-- Adapts the schema for FORM 1A (casual/short leave) replication and the
-- "rank" concept required by NAUB.
-- Run AFTER 001 + 002 on a fresh project, OR on an existing one (idempotent).
--
-- Adds:
--   1. public.users.rank           -- job title / academic rank (free text)
--   2. leave_applications.destination                 -- FORM 1A Part I field 4
--   3. leave_applications.applicant_rank              -- snapshot at apply time
--   4. leave_applications.applicant_staff_id          -- snapshot at apply time
--   5. leave_applications.applicant_name              -- snapshot at apply time
--   6. leave_approvals.how_financed                   -- FORM 1A Part II/III finance
-- ============================================================================

-- 1) users.rank
alter table public.users
  add column if not exists rank text;

comment on column public.users.rank is
  'Job title / academic rank (e.g. "Lecturer II", "Senior Lecturer", "Professor", "Assistant Registrar"). Snapshot onto leave_applications.applicant_rank at apply time so historical applications retain the rank held when applied.';

-- 2-5) leave_applications extensions
alter table public.leave_applications
  add column if not exists destination text,
  add column if not exists applicant_rank text,
  add column if not exists applicant_staff_id text,
  add column if not exists applicant_name text;

comment on column public.leave_applications.destination is
  'FORM 1A Part I field 4: location during leave. Required for casual leave, optional otherwise.';

comment on column public.leave_applications.applicant_name is
  'Snapshot of the applicant''s full name at the time of application, for the FORM 1A PDF.';
comment on column public.leave_applications.applicant_staff_id is
  'Snapshot of the applicant''s staff_id at apply time (Registrar requires this before approving).';
comment on column public.leave_applications.applicant_rank is
  'Snapshot of the applicant''s users.rank at apply time (Registrar requires this before approving).';

create index if not exists apps_applicant_staff_idx
  on public.leave_applications(applicant_staff_id);

-- 6) leave_approvals.how_financed
--    FORM 1A Part II (HOD):  'department' | 'applicant'
--    FORM 1A Part III (Reg):  'university' | 'applicant'
alter table public.leave_approvals
  add column if not exists how_financed text
    check (how_financed is null or how_financed in ('department', 'applicant', 'university'));

comment on column public.leave_approvals.how_financed is
  'FORM 1A finance decision. HOD records department|applicant; Registrar records university|applicant. Set only for casual-leave approvals.';
