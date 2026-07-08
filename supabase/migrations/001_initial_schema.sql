-- ============================================================================
-- NAUB Staff Leave Management System - Initial Schema
-- Apply via Supabase SQL editor or `supabase db push`.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  hod_id uuid,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- USERS (extends Supabase auth.users)
-- ============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  staff_id text unique,
  role text not null check (role in ('admin', 'hod', 'hr_manager', 'staff')),
  staff_type text not null check (staff_type in ('academic', 'non_academic')),
  department_id uuid references public.departments(id),
  is_approved boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add FK from departments.hod_id → users.id now that both tables exist
alter table public.departments
  drop constraint if exists departments_hod_id_fkey;
alter table public.departments
  add constraint departments_hod_id_fkey
  foreign key (hod_id) references public.users(id) on delete set null;

create index if not exists users_dept_idx on public.users(department_id);
create index if not exists users_role_idx on public.users(role);

-- ============================================================================
-- LEAVE TYPES
-- ============================================================================
create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  applicable_to text not null check (applicable_to in ('academic', 'non_academic', 'both')),
  max_days_academic int,
  max_days_non_academic int,
  requires_document boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- LEAVE ENTITLEMENTS
-- ============================================================================
create table if not exists public.leave_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id),
  year int not null,
  total_days int not null,
  used_days int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, leave_type_id, year)
);

create index if not exists entitlements_user_idx on public.leave_entitlements(user_id);

-- ============================================================================
-- LEAVE APPLICATIONS
-- ============================================================================
create table if not exists public.leave_applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.users(id),
  leave_type_id uuid not null references public.leave_types(id),
  department_id uuid not null references public.departments(id),
  start_date date not null,
  end_date date not null,
  total_days int not null,
  reason text not null,
  supporting_doc_url text,
  status text not null default 'pending'
    check (status in ('pending', 'hod_approved', 'approved', 'hod_rejected', 'rejected', 'cancelled')),
  rota_conflict boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists apps_applicant_idx on public.leave_applications(applicant_id);
create index if not exists apps_dept_idx on public.leave_applications(department_id);
create index if not exists apps_status_idx on public.leave_applications(status);

-- ============================================================================
-- LEAVE APPROVALS (audit trail)
-- ============================================================================
create table if not exists public.leave_approvals (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.leave_applications(id) on delete cascade,
  approver_id uuid not null references public.users(id),
  approver_role text not null,
  decision text not null check (decision in ('approved', 'rejected', 'forwarded')),
  comment text,
  decided_at timestamptz not null default now()
);

create index if not exists approvals_app_idx on public.leave_approvals(application_id);

-- ============================================================================
-- LEAVE ROTA
-- ============================================================================
create table if not exists public.leave_rota (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  title text not null,
  period_start date not null,
  period_end date not null,
  max_concurrent int not null default 2,
  published_by uuid not null references public.users(id),
  published_at timestamptz not null default now(),
  notes text
);

create table if not exists public.rota_slots (
  id uuid primary key default gen_random_uuid(),
  rota_id uuid not null references public.leave_rota(id) on delete cascade,
  user_id uuid not null references public.users(id),
  slot_start date not null,
  slot_end date not null,
  leave_type_id uuid references public.leave_types(id),
  created_at timestamptz not null default now()
);

create index if not exists slots_rota_idx on public.rota_slots(rota_id);

-- ============================================================================
-- NOTIFICATIONS
-- ============================================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('leave_submitted', 'leave_approved', 'leave_rejected', 'rota_published', 'account_approved', 'general')),
  is_read boolean not null default false,
  related_application_id uuid references public.leave_applications(id),
  created_at timestamptz not null default now()
);

create index if not exists notif_user_idx on public.notifications(user_id, is_read);

-- ============================================================================
-- USER APPROVAL REQUESTS (admin queue)
-- ============================================================================
create table if not exists public.user_approval_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  requested_role text not null,
  requested_department_id uuid references public.departments(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_comment text,
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists apps_set_updated_at on public.leave_applications;
create trigger apps_set_updated_at
  before update on public.leave_applications
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_entitlements enable row level security;
alter table public.leave_applications enable row level security;
alter table public.leave_approvals enable row level security;
alter table public.leave_rota enable row level security;
alter table public.rota_slots enable row level security;
alter table public.notifications enable row level security;
alter table public.user_approval_requests enable row level security;

-- USERS policies
create policy "users_select_self_or_admin" on public.users
  for select using (
    auth.uid() = id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('hod', 'hr_manager'))
  );

create policy "users_update_admin_only" on public.users
  for update using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "users_insert_admin_only" on public.users
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- DEPARTMENTS policies
create policy "departments_read_all" on public.departments for select using (true);
create policy "departments_admin_write" on public.departments
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- LEAVE TYPES policies
create policy "leave_types_read_all" on public.leave_types for select using (true);
create policy "leave_types_admin_write" on public.leave_types
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- LEAVE ENTITLEMENTS policies
create policy "entitlements_self_or_admin_hr" on public.leave_entitlements
  for select using (
    auth.uid() = user_id
    or exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'hr_manager'))
  );

create policy "entitlements_admin_hr_write" on public.leave_entitlements
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'hr_manager'))
  );

-- LEAVE APPLICATIONS policies
create policy "apps_self_or_staff_chain" on public.leave_applications
  for select using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          u.role = 'admin'
          or (u.role = 'hod' and u.department_id = leave_applications.department_id)
          or u.role = 'hr_manager'
        )
    )
  );

create policy "apps_self_insert" on public.leave_applications
  for insert with check (auth.uid() = applicant_id);

create policy "apps_self_update_or_approver" on public.leave_applications
  for update using (
    auth.uid() = applicant_id
    or exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          u.role = 'admin'
          or (u.role = 'hod' and u.department_id = leave_applications.department_id)
          or u.role = 'hr_manager'
        )
    )
  );

-- LEAVE APPROVALS policies
create policy "approvals_read_authorized" on public.leave_approvals
  for select using (
    exists (
      select 1 from public.leave_applications a
      where a.id = leave_approvals.application_id
        and (
          a.applicant_id = auth.uid()
          or exists (
            select 1 from public.users u
            where u.id = auth.uid()
              and (
                u.role = 'admin'
                or (u.role = 'hod' and u.department_id = a.department_id)
                or u.role = 'hr_manager'
              )
          )
        )
    )
  );

create policy "approvals_insert_approver" on public.leave_approvals
  for insert with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and u.role in ('admin', 'hod', 'hr_manager')
    )
  );

-- LEAVE ROTA policies
create policy "rota_read_all" on public.leave_rota for select using (true);
create policy "rota_hod_admin_write" on public.leave_rota
  for all using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (
          u.role = 'admin'
          or (u.role = 'hod' and u.department_id = leave_rota.department_id)
        )
    )
  );

create policy "rota_slots_read_all" on public.rota_slots for select using (true);
create policy "rota_slots_hod_admin_write" on public.rota_slots
  for all using (
    exists (
      select 1 from public.leave_rota r
      join public.users u on u.id = auth.uid()
      where r.id = rota_slots.rota_id
        and (u.role = 'admin' or (u.role = 'hod' and u.department_id = r.department_id))
    )
  );

-- NOTIFICATIONS policies
create policy "notif_self" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notif_self_update" on public.notifications
  for update using (auth.uid() = user_id);

create policy "notif_insert_authorized" on public.notifications
  for insert with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role in ('admin', 'hod', 'hr_manager'))
  );

-- USER APPROVAL REQUESTS policies
create policy "uar_admin_read" on public.user_approval_requests
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

create policy "uar_admin_write" on public.user_approval_requests
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ============================================================================
-- SEED DATA - leave types, departments, default admin
-- ============================================================================

-- Departments
insert into public.departments (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Computer Science'),
  ('22222222-2222-2222-2222-222222222222', 'Administration'),
  ('33333333-3333-3333-3333-333333333333', 'Registry')
on conflict (id) do nothing;

-- Leave types
insert into public.leave_types (id, name, applicable_to, max_days_academic, max_days_non_academic, requires_document) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Annual Leave',     'both',         21,  21,  false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sick Leave',       'both',         14,  14,  true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Casual Leave',     'both',         7,   7,   false),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Maternity Leave',  'non_academic', null,90,  true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Paternity Leave',  'both',         7,   7,   false),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Study Leave',      'academic',     365, null,true),
  ('99999999-9999-9999-9999-999999999999', 'Compassionate Leave','both',       7,   7,   false)
on conflict do nothing;

-- Default admin (password: Admin@NAUB2026) - see README to log in.
-- Note: this row references auth.users - to actually log in you must
-- first create the matching user via Supabase Auth (Auth → Users → Add user).
-- Once created, run:
--   insert into public.users (id, full_name, email, role, staff_type, department_id, is_approved, is_active, staff_id)
--   values (
--     '<auth-user-id>',
--     'System Administrator',
--     'admin@naub.edu.ng',
--     'admin',
--     'non_academic',
--     '22222222-2222-2222-2222-222222222222',
--     true,
--     true,
--     'NAUB/ADM/001'
--   );