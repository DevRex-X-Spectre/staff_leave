# NAUB Staff Leave Management System

Leave management for the Nigerian Army University, Biu. Four roles — **Staff**, **HOD**, **Registrar** (`hr_manager`), and **Admin** — with a full approval workflow, entitlement tracking, rota publishing, notifications, and Excel/PDF reports.

Built on **Next.js 16** (App Router, Turbopack), **Auth.js v5 (NextAuth)** credentials auth, **Supabase (Postgres)**, and Tailwind v4.

## Architecture

- **Auth:** NextAuth Credentials provider authenticates by **staff ID + bcrypt-hashed password** (table `public.user_credentials`). Identity is owned by NextAuth — Supabase Auth is not used. Sessions are JWT.
- **Data access:** server-only. Every read runs in a Server Component (or Server Action) through the Supabase **service-role** client in [`lib/db/client.ts`](lib/db/client.ts); every write runs through an authorised, validated Server Action in [`app/actions/`](app/actions/). RLS is disabled and authorization is enforced in the app layer ([`lib/authz.ts`](lib/authz.ts)).
- **Pages:** each dashboard route is an async Server Component that reads `auth()` + fetches via the DAL, then hands typed props to a `*-client.tsx` island. Mutations call Server Actions via `useTransition`.

## Prerequisites

- Node.js 20+
- A Supabase project (cloud at https://supabase.com/dashboard, or local via the Supabase CLI)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment** — copy the template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from your Supabase project's *Project Settings → API*.
   - `AUTH_SECRET` — generate with `openssl rand -base64 32` (on Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`).
   - `AUTH_TRUST_HOST=true`.
   - `RESEND_API_KEY` — optional; if unset, email notifications are logged to the server console instead of sent.

3. **Apply the database schema.** In the Supabase dashboard open the SQL editor and run, in order:
   - [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql)
   - [`supabase/migrations/002_nextauth_schema.sql`](supabase/migrations/002_nextauth_schema.sql)
   - [`supabase/migrations/003_form1a_and_rank.sql`](supabase/migrations/003_form1a_and_rank.sql)

   (Or, with the Supabase CLI: `supabase db push`.)

4. **Seed the demo dataset** (departments, leave types, 9 users with password `NAUB@2026`, grade-driven entitlements, sample applications/rotas/notifications):

   ```bash
   npm run seed
   ```

   The seed is idempotent — re-running refreshes the demo rows without duplicating or wiping admin-added data.

5. **Run the dev server:**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000 and sign in.

## Seeded test accounts

All use the default password **`NAUB@2026`** (change it from *My Profile* after signing in):

| Staff ID          | Role      | Name                    |
|-------------------|-----------|-------------------------|
| `NAUB/ADM/SN001`  | Admin     | System Administrator    |
| `NAUB/CS/001`     | HOD       | Dr. Chukwuma Okeke      |
| `NAUB/REG/SN001`  | Registrar | Amina Bello             |
| `NAUB/CS/010`     | Staff     | Engr. Samuel Adekunle   |

There is also a pending account request (`NAUB/CS/099`) awaiting admin approval in `/dashboard/admin/approvals`.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run seed` — seed/refresh the demo dataset in Supabase
- `npm run lint` — run ESLint

## Notable files

- [`auth.ts`](auth.ts) / [`auth.config.ts`](auth.config.ts) — NextAuth config (Credentials provider, JWT callbacks).
- [`proxy.ts`](proxy.ts) — edge auth guard (Next.js 16 renamed `middleware` to `proxy`).
- [`lib/db/`](lib/db/) — server-only Supabase DAL (repo objects mirroring the schema).
- [`app/actions/`](app/actions/) — authorised, validated Server Actions for every mutation.
- [`lib/entitlements.ts`](lib/entitlements.ts) — grade-driven annual leave policy (academic = 30, non-academic senior = 30, junior = 21 working days).
- [`scripts/seed.ts`](scripts/seed.ts) — the demo dataset seed.
