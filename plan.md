# NAUB LMS — Backend Migration Plan (NextAuth + Supabase)

> Goal: replace the localStorage demo layer (`lib/local/*`) with a real backend — **NextAuth (Auth.js v5)** for authentication and **Supabase (Postgres)** for the database — while keeping the existing UI and types. Demo mode stays as a fallback until the final phase so the app never stops building.

---

## Current state (what we're migrating from)

- **Data:** `lib/local/store.ts` — a localStorage JSON blob with repo objects (`Users`, `Departments`, `LeaveTypes`, `Entitlements`, `Applications`, `Approvals`, `Rotas`, `Slots`, `Notifications`, `UAR`). Reactivity via a version counter + `useSyncExternalStore`.
- **Auth:** `lib/local/auth-store.ts` — staff_id + plaintext password (`NAUB@2026`), session in localStorage + a mirrored cookie for `middleware.ts`.
- **Hooks:** `lib/local/data-hooks.ts` — the only consumer-facing data surface (`useApplications`, `useLeaveBalances`, etc.).
- **Providers:** `AuthProvider`, `DataProvider` wrap the app in `app/layout.tsx`.
- **Dormant Supabase layer (already present, unused):** `lib/supabase/{client,server}.ts`, a Supabase branch in `middleware.ts`, and `supabase/migrations/001_initial_schema.sql` with all 10 tables + RLS.
- **Types:** `types/index.ts` already mirrors the Supabase schema 1:1 (this was the design goal).

---

## Key architectural decisions (read first)

These shape every phase. They are opinionated choices; the rationale is included so they can be revisited.

### 1. NextAuth owns identity; Supabase Auth is NOT used
The existing schema assumes Supabase Auth (`users.id uuid references auth.users(id)`, RLS via `auth.uid()`). **This is incompatible with NextAuth** — NextAuth users don't live in `auth.users`, so `auth.uid()` is always null and that FK can't resolve.

**Decision:** cut the `auth.users` dependency. `public.users.id` becomes a plain app-generated `uuid`. NextAuth's Credentials provider authenticates by **staff_id + bcrypt-hashed password** stored in a new `public.user_credentials` table.

### 2. All DB access is server-side via the service-role client; authorization lives in the app layer
Because there's no Supabase Auth session, the browser anon client can't satisfy `auth.uid()`-based RLS. So:
- **Reads** happen in Server Components (or route handlers) using the service-role client.
- **Writes** happen in Server Actions using the service-role client, with zod validation + role authorization taken from the NextAuth session.
- **RLS is disabled** (or left inert) — it can't help under this model, and app-layer authz is clearer. This is documented as an accepted trade-off.

This means the client-side hooks model (`useApplications`, etc.) is replaced by **Server Components fetching data + passing it as props to the existing `*-client.tsx` islands**, and mutations become **Server Action calls**.

### 3. IDs become uuids
localStorage used string ids (`user-staff-1`, `dept-cs`). Supabase uses uuids. The seed moves to a TypeScript seed script (`scripts/seed.ts`) that inserts deterministic uuids + bcrypt-hashed default passwords. Any code holding hardcoded string ids (e.g. the topbar demo switcher) moves to staff_id-based lookups or is removed.

### 4. Demo mode stays until Phase 7
`isDemoMode()` already gates the Supabase clients. We keep the `lib/local/*` path working throughout, so the app is always runnable without env vars. Phase 7 removes it.

---

## Phase 0 — Project setup & dependencies

**Goal:** get the Supabase project created and the new packages installed.

- Create a Supabase project; copy **URL**, **anon key**, **service role key** into `.env.local` (template already in `.env.example`).
- Install: `next-auth@beta` (Auth.js v5), `bcryptjs`, and `@types/bcryptjs`.
- Add to `.env.example`:
  - `AUTH_SECRET=` (generate with `openssl rand -base64 32`)
  - `AUTH_TRUST_HOST=true` (for local/proxy deploys)
  - Set `NEXT_PUBLIC_DEMO_MODE=false` only when ready (Phase 7).

**Verify:** `npm run build` still green; deps installed.

---

## Phase 1 — Schema revision for NextAuth

**Goal:** make the database schema match the NextAuth architecture.

Edit `supabase/migrations/001_initial_schema.sql` (and add a new `002_*.sql` migration rather than editing `001` if the project is already deployed):

1. **`public.users`** — drop the `auth.users` FK; make `id uuid primary key default gen_random_uuid()` (no FK). Keep all other columns incl. `staff_grade`, `staff_type`.
2. **New table `public.user_credentials`**:
   ```sql
   create table public.user_credentials (
     user_id uuid primary key references public.users(id) on delete cascade,
     password_hash text not null,
     updated_at timestamptz not null default now()
   );
   ```
3. **RLS:** either `revoke`/disable it, or leave the policies (they're inert under the service role). Recommendation: disable RLS on all tables and centralise authz in Server Actions. Document it.
4. **Triggers:** keep `set_updated_at` on `users` and `leave_applications`; add the same for `user_credentials`.
5. Fix the seed block at the bottom of the migration: remove the "create user via Supabase Auth" instructions; the seed script (Phase 8) handles users + hashed passwords.

**Verify:** migration applies cleanly on a fresh Supabase project (`supabase db reset` or SQL editor).

---

## Phase 2 — NextAuth configuration

**Goal:** working login by staff_id + password, session exposing role/staff_id/department.

New files:
- `auth.config.ts` — edge-safe config (providers split, `pages: { signIn: '/login' }`, callbacks).
- `auth.ts` — exports `handlers`, `auth`, `signIn`, `signOut`. Uses `next-auth` Credentials provider:
  ```ts
  authorize(credentials) {
    // 1. find user by staff_id (service client)
    // 2. reject if !is_approved || !is_active
    // 3. fetch user_credentials.password_hash, bcrypt.compare
    // 4. return { id, role, staff_id, department_id, full_name, staff_type, staff_grade }
  }
  ```
  - Session strategy: **JWT** (required for Credentials).
  - `jwt` callback: stash role/staff_id/department_id/is_approved onto the token.
  - `session` callback: copy those onto `session.user`.
- `app/api/auth/[...nextauth]/route.ts` — `export { GET, POST } = handlers`.

Env: `AUTH_SECRET`, `AUTH_TRUST_HOST`.

Wrap the app in `<SessionProvider>` (client) where needed — but prefer reading the session on the server via `auth()`.

**Verify:** `curl` the credentials sign-in returns a session cookie; an invalid password is rejected.

---

## Phase 3 — Auth UI cutover

**Goal:** the whole sign-in / route-guard / profile flow runs on NextAuth.

- `app/(auth)/login/page.tsx` — call the `signIn` server action with staff_id + password; on success redirect to the role dashboard (`dashboardPathFor(session.user.role)`).
- `middleware.ts` — replace the demo-cookie branch with NextAuth's `auth()`. Rules:
  - unauthenticated → `/login?redirect=...`
  - authenticated but `is_approved === false` → `/pending-approval`
  - role mismatch on a `/dashboard/<role>/*` path → redirect to own dashboard
  - drop the Supabase `auth.getUser()` branch (we're not using Supabase Auth).
- `app/dashboard/profile/profile-client.tsx` — change-password becomes a Server Action: bcrypt-verify old, bcrypt-hash new, update `user_credentials`.
- `components/dashboard/topbar.tsx` — logout via `signOut`; remove the "demo switch user" UI (or gate it behind `NODE_ENV !== 'production'`).
- `app/dashboard/layout.tsx` — read the session on the server (`await auth()`); redirect if missing.

**Verify:** full login → dashboard → logout loop works against real Supabase.

---

## Phase 4 — Data Access Layer (DAL)

**Goal:** a server-only mirror of `lib/local/store.ts` backed by Supabase, reusing the existing types.

New: `lib/db/` (server-only):
- `lib/db/client.ts` — thin wrapper over the service-role client getter (already in `lib/supabase/server.ts`).
- `lib/db/users.ts`, `departments.ts`, `leaveTypes.ts`, `entitlements.ts`, `applications.ts`, `approvals.ts`, `rotas.ts`, `notifications.ts`, `uar.ts` — repo functions mirroring the `store.ts` API (`Users.byId`, `Applications.byDepartment`, `Applications.leaveBalances`, etc.), returning the same hydrated relation shapes (`LeaveApplicationWithRelations`, etc.).
- `lib/entitlements.ts` — **shared** (move `lib/local/entitlements.ts` here, decoupled from the store; `annualLeaveDays`, `provisionEntitlementsForUser`, `resyncAnnualEntitlement` now read/write via the DAL).
- `lib/authz.ts` — helpers like `requireRole(session, ...roles)`, `requireSameDepartment(session, deptId)` used by Server Actions.

Pattern: every read accepts the service client (or fetches it); every function is `async`; relations are joined with `.select('..., applicant:users!applicant_id(...), leave_type:leave_types(...), ...')`.

**Verify:** unit-ish smoke test — call each repo from a scratch server component and print results.

---

## Phase 5 — Server Actions (mutations)

**Goal:** every write goes through an authorized, validated Server Action. This replaces the inline `Applications.insert(...)` / `Notifications.insert(...)` calls currently scattered across `*-client.tsx`.

New: `app/actions/` (one file per domain):
- `leave.ts` — `applyLeave`, `cancelLeave`.
- `approvals.ts` — `hodDecision`, `registrarDecision` (deduct entitlement + audit + notifications + email, in a transactional RPC or sequential writes with compensation).
- `admin.ts` — `approveUser` (provisions entitlements), `rejectUser`, `createStaff` (insert user + hashed default password + provision entitlements), `updateStaffRole`, `updateStaffGrade` (resync annual), `toggleStaffActive`, `adjustEntitlement`, CRUD for departments/leave-types.
- `rota.ts` — `publishRota`, `addRotaSlot`.
- `notifications.ts` — `markRead`, `markAllRead`.

Each action:
1. `await auth()` → get session; `requireRole(...)` / `requireSameDepartment(...)`.
2. zod-validate input.
3. perform writes via the DAL; fan out notifications + `lib/email.ts` (now actually sending via Resend when `RESEND_API_KEY` is set).
4. `revalidatePath(...)` so Server Components refetch.

**Verify:** each action callable from a temporary button; DB reflects the change; unauthorized roles get rejected.

---

## Phase 6 — Migrate pages to Server Components + client islands

**Goal:** swap the data source from hooks to the DAL, page by page, keeping the build green throughout. Do it **role by role**: staff → hod → registrar → admin.

For each page:
- `page.tsx` becomes an **async Server Component** that `await auth()` and fetches via the DAL, then renders the existing `*-client.tsx` with data as props.
- The `*-client.tsx` components keep their UI but:
  - receive data via props instead of `useApplications()` / `useLeaveBalances()`;
  - call the new Server Actions (with `useTransition`) instead of the local store;
  - keep dialogs, forms, FullCalendar, etc. as client behaviour.
- Remove `AuthProvider`/`DataProvider` wrappers; the session comes from `auth()` (server) / `useSession()` (client islands).
- `components/dashboard/{sidebar,topbar,dashboard-layout}.tsx` and `components/notifications/notification-bell.tsx` switch to session/props.

Reactivity: rely on `revalidatePath` after mutations. (Realtime is optional in Phase 7.) The notification bell can poll every 30s via a tiny client fetch.

**Verify per role:** sign in as that role; every screen renders real data; every mutation persists to Supabase and updates the UI.

---

## Phase 7 — Realtime (optional), cleanup, remove demo mode

**Goal:** ship.

- **Realtime (optional):** subscribe to `notifications` and `leave_applications` changes on the bell + dashboards for live updates. Skip if not needed; `revalidatePath` already keeps data fresh on action.
- **Remove demo mode:** delete `lib/local/*` (store, auth-store, data-hooks, seed, constants, routes), the `isDemoMode()` branches in `lib/supabase/*` and `middleware.ts`, and `NEXT_PUBLIC_DEMO_MODE`. Remove `lib/utils.isDemoMode`/`isSupabaseConfigured`.
- **Seed script:** `scripts/seed.ts` (run via `npx tsx scripts/seed.ts`) inserts departments, leave types, users (deterministic uuids), `user_credentials` with **bcrypt hashes of `NAUB@2026`**, entitlements (annual driven by grade), sample applications/rotas/notifications. Replaces the SQL seed block.
- Update `.env.example` to drop demo-mode copy.
- Update `README` with setup steps.

**Verify:** cold install on a fresh Supabase project → seed → log in → full leave lifecycle works end-to-end.

---

## Cross-cutting concerns

- **Working-days logic** (`lib/utils.ts → workingDaysInclusive`) and **types** (`types/index.ts`) are already backend-agnostic — no change.
- **Email** (`lib/email.ts`) already has a Resend wrapper + demo-log fallback; Server Actions just call it.
- **Security:** bcrypt-hashed passwords (never plaintext), `AUTH_SECRET` rotation plan, service-role key never shipped to the browser, all writes authorized by session role + department.
- **Transactions:** multi-step writes (e.g., registrar approval = status update + entitlement deduction + audit + notifications) should be a Postgres function (`rpc`) or use `BEGIN`/`COMMIT` via the service client to stay atomic.

---

## Risks & fallbacks

| Risk | Mitigation |
|---|---|
| NextAuth Credentials + JWT can't be edge-authoritative for long sessions | Keep JWT TTL short; refresh on activity. Acceptable for an internal tool. |
| Disabling RLS feels unsafe | All access is server-side service-role + app authz; add an audit log table if compliance demands. Can re-enable RLS later with a `request.jwt.claims` pattern if desired. |
| Big-bang page rewrite breaks the app | Phase 6 is role-by-role; demo mode remains a fallback until Phase 7, so `NEXT_PUBLIC_DEMO_MODE=true` always recovers a working app. |
| bcryptjs performance | Pure-JS bcryptjs is fine for this user volume; swap to `@node-rs/bcrypt` only if needed. |

---

## Verification checklist (end-to-end, after Phase 7)

1. Fresh Supabase project + `supabase db reset`; `npm run seed`.
2. `npm run build` — zero errors.
3. Sign in as `NAUB/ADM/SN001` + `NAUB@2026` → admin dashboard; notifications bell works.
4. Approve a pending staff → entitlements auto-provisioned (visible in registrar entitlements).
5. Sign in as `NAUB/CS/010` (Samuel) → apply for leave (5-step wizard, cover staff, working days) → persists to Supabase.
6. HOD approves → Registrar final-approves → entitlement `used_days` increments; applicant + cover staff get notifications; emails sent (or logged).
7. Create a junior non-academic staff via admin → annual entitlement = 21; promote to senior → re-syncs to 30.
8. Logout/login, route guards, pending-approval gate all behave.
9. `grep -r "lib/local" app components lib` → zero references.
