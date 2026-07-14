-- ============================================================================
-- 002_nextauth_schema.sql
-- Adapts the schema to the NextAuth architecture.
-- Run AFTER 001_initial_schema.sql on a fresh project, OR on an existing one.
--
-- Key changes:
--   1. public.users no longer references auth.users - NextAuth owns identity.
--      id becomes a plain app-generated uuid.
--   2. New public.user_credentials table holds bcrypt password hashes
--      (NextAuth Credentials provider).
--   3. Row Level Security disabled - all access is server-side via the
--      service role + app-layer authorization (see lib/authz.ts). auth.uid()
--      is meaningless under NextAuth, so RLS keyed on it cannot work.
-- ============================================================================

-- 1) Detach public.users from auth.users.
alter table public.users drop constraint if exists users_id_fkey;
alter table public.users alter column id set default gen_random_uuid();

-- 2) Credentials table (bcrypt hashes; never plaintext).
create table if not exists public.user_credentials (
  user_id uuid primary key references public.users(id) on delete cascade,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

create index if not exists credentials_user_idx on public.user_credentials(user_id);

drop trigger if exists credentials_set_updated_at on public.user_credentials;
create trigger credentials_set_updated_at
  before update on public.user_credentials
  for each row execute function public.set_updated_at();

-- 3) Disable Row Level Security across the board.
--    All data access is server-side (service role) with authorization enforced
--    in Next.js Server Actions (lib/authz.ts + the NextAuth session).
alter table public.users disable row level security;
alter table public.departments disable row level security;
alter table public.leave_types disable row level security;
alter table public.leave_entitlements disable row level security;
alter table public.leave_applications disable row level security;
alter table public.leave_approvals disable row level security;
alter table public.leave_rota disable row level security;
alter table public.rota_slots disable row level security;
alter table public.notifications disable row level security;
alter table public.user_approval_requests disable row level security;
alter table public.user_credentials disable row level security;

-- Helpful read indexes for the approval / dashboard queries.
create index if not exists apps_cover_staff_idx on public.leave_applications(cover_staff_id);
create index if not exists approvals_approver_idx on public.leave_approvals(approver_id);
create index if not exists entitlements_type_year_idx on public.leave_entitlements(leave_type_id, year);
