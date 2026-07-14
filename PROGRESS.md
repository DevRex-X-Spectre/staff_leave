# NAUB LMS — Build Progress

> Last updated: 2026-07-14

## Status: PHASE 8 COMPLETE — NextAuth + Supabase migration, clean ranked seed, FORM 1A casual-leave workflow, full approval breakdown, and approved-leave PDFs implemented. Runtime verification still requires a configured Supabase project.

---

## Phase 8 — FORM 1A casual leave + rank-aware approvals ✅ COMPLETE
- [x] `supabase/migrations/003_form1a_and_rank.sql` — adds `users.rank`, application snapshots (`applicant_name`, `applicant_staff_id`, `applicant_rank`), casual-only `destination`, and approval-level `how_financed`.
- [x] `User`, `LeaveApplication`, `LeaveApproval`, and NextAuth session types extended with rank and FORM 1A fields.
- [x] Staff apply flow snapshots name, staff ID, and rank automatically; casual leave requires destination.
- [x] HOD and Registrar approval dialogs show complete breakdown: applicant, Staff ID, rank, department, leave type, dates, days, reason, cover staff, destination, and rota conflicts.
- [x] Casual approval records HOD financing (`Department`/`Applicant`) and Registrar financing (`University`/`Applicant`).
- [x] Approved leave PDF download added to Staff history and Registrar all-applications. Casual leaves render FORM 1A; other leave types render an approval letter.
- [x] Admin staff creation requires rank and shows rank in the staff table.
- [x] `scripts/seed.ts` now removes deterministic mock transactions and seeds only ranked users, departments, leave types, entitlements, and credentials; senior/junior non-academic levels are represented.

### Verification
- [x] `npx tsc --noEmit` clean.
- [x] `npm run build` green (29 routes). Only existing Cal Sans font fallback warning remains.
- [ ] Apply migrations 001 + 002 + 003 to a configured Supabase project.
- [ ] Run `npm run seed` with real Supabase credentials and drive the full staff → HOD → Registrar flow.

---

## Phase 7 — Seed script + remove demo mode ✅ COMPLETE
- [x] **`scripts/seed.ts`** — idempotent seed using deterministic UUIDs (upsert on PK; entitlements on `user_id,leave_type_id,year`); inserts departments, 7 leave types, 9 users, `user_credentials` (bcrypt hash of `NAUB@2026`), 15 grade-driven entitlements, 5 sample applications + 5 approvals, 1 rota + 2 slots, 4 notifications, 1 pending UAR. Handles the departments↔users circular FK by inserting departments with `hod_id=null` first, then back-filling HODs once users exist. Entitlement year is `new Date().getFullYear()` so balances always show for the current year.
- [x] **`npm run seed`** script added; **`tsx` installed** as a dev dependency.
- [x] **`.env.example` rewritten** — added `AUTH_SECRET` + `AUTH_TRUST_HOST`, dropped the `NEXT_PUBLIC_DEMO_MODE` copy.
- [x] **`.env.local`** — generated `AUTH_SECRET` + `AUTH_TRUST_HOST=true`; removed `NEXT_PUBLIC_DEMO_MODE`.
- [x] **`supabase/migrations/001_initial_schema.sql`** — removed the inline SQL seed block (departments/leave types); the TypeScript seed script now owns ALL seed data.
- [x] **Deleted `lib/local/*`** (store, auth-store, data-hooks, seed, constants, entitlements, routes) — confirmed zero references remain in `app/`, `components/`, `lib/`, `scripts/`.
- [x] **`README.md` rewritten** with real setup steps (env, migration order, `npm run seed`, seeded test accounts).

## Phase 7 — Seed script + remove demo mode ✅ COMPLETE
- [x] **`scripts/seed.ts`** — idempotent seed using deterministic UUIDs (upsert on PK; entitlements on `user_id,leave_type_id,year`); inserts departments, 7 leave types, 9 users, `user_credentials` (bcrypt hash of `NAUB@2026`), 15 grade-driven entitlements, 5 sample applications + 5 approvals, 1 rota + 2 slots, 4 notifications, 1 pending UAR. Handles the departments↔users circular FK by inserting departments with `hod_id=null` first, then back-filling HODs once users exist. Entitlement year is `new Date().getFullYear()` so balances always show for the current year.
- [x] **`npm run seed`** script added; **`tsx`** installed as a dev dependency.
- [x] **`.env.example`** rewritten — added `AUTH_SECRET` + `AUTH_TRUST_HOST`, dropped the `NEXT_PUBLIC_DEMO_MODE` copy.
- [x] **`.env.local`** — generated `AUTH_SECRET` + `AUTH_TRUST_HOST=true`; removed `NEXT_PUBLIC_DEMO_MODE`.
- [x] **`supabase/migrations/001_initial_schema.sql`** — removed the inline SQL seed block (departments/leave types); the TypeScript seed script now owns ALL seed data.
- [x] **Deleted `lib/local/*`** (store, auth-store, data-hooks, seed, constants, entitlements, routes) — confirmed zero references remain in `app/`, `components/`, `lib/`, `scripts/`.
- [x] **`README.md`** rewritten with real setup steps (env, migration order, `npm run seed`, seeded test accounts).

### Verification
- [x] `npm run build` green — 29 routes; all `/dashboard/*` are `ƒ` (Dynamic); proxy detected.
- [x] `npx tsc --noEmit` clean.
- [x] `grep "@/lib/local" app components lib scripts` → **0** references.
- [x] `lib/local/` directory removed; `lib/` now contains only `authz.ts`, `constants.ts`, `db/`, `email.ts`, `email/`, `entitlements.ts`, `supabase/`, `utils.ts`.

### To run end-to-end (your steps)
1. Create a Supabase project; paste URL + anon key + service role key into `.env.local`.
2. Run `001_initial_schema.sql` then `002_nextauth_schema.sql` in the Supabase SQL editor.
3. `npm run seed` → `npm run dev` → sign in with `NAUB/ADM/SN001` / `NAUB@2026`.

---

## Phase 0-2 — NextAuth + Supabase foundation ✅ COMPLETE
- [x] Deps: `next-auth@beta`, `bcryptjs`, `@types/bcryptjs` installed
- [x] `auth.ts` (Node) + `auth.config.ts` (edge-safe) — Credentials provider authenticates by **staff_id + bcrypt-hashed password** (looked up in `public.user_credentials`); JWT strategy; role/staff_id/staff_type/staff_grade/department_id/is_approved stashed on the token and surfaced on `session.user`
- [x] `app/api/auth/[...nextauth]/route.ts` mounts the handlers
- [x] `types/next-auth.d.ts` augments Session/User/JWT with the NAUB fields
- [x] `supabase/migrations/001_initial_schema.sql` + `002_nextauth_schema.sql` — `public.users.id` is now a plain app uuid (no `auth.users` FK), RLS disabled, `public.user_credentials` table added, `set_updated_at` triggers retained

## Phase 3 — Auth UI cutover ✅ COMPLETE
- [x] `app/(auth)/login/page.tsx` — NextAuth `signIn('credentials', …)`; quick-login buttons for the seeded accounts; wrapped in `<Suspense>` so it prerenders statically (useSearchParams requirement)
- [x] `proxy.ts` (was `middleware.ts`) — NextAuth `authorized` callback routes unauthenticated -> `/login?redirect=...` and logged-in users on `/` or `/login` -> their role dashboard. **Next.js 16 renamed `middleware` to `proxy`**; the auth handler is `const { auth: authHandler } = NextAuth(authConfig)` then `export { authHandler as proxy }` (a destructured `export const { auth: proxy }` is NOT recognised by Next's proxy-file static analysis)
- [x] `app/dashboard/layout.tsx` — async Server Component; `await auth()`, redirect to `/login` if unauthenticated and `/pending-approval` if `!isApproved`; fetches department + notifications + unread count via the DAL and passes them to `DashboardShell`
- [x] `app/dashboard/profile/*` — change-password is the `changePasswordAction` Server Action (bcrypt-verify old, bcrypt-hash new, update `user_credentials`)
- [x] `components/providers/session-provider.tsx` — wraps the app in NextAuth `<SessionProvider>` so client islands can `useSession()`. Old `AuthProvider`/`DataProvider` deleted.

## Phase 4 — Data Access Layer (DAL) ✅ COMPLETE
- [x] `lib/db/client.ts` — server-only Supabase **service-role** client (`'server-only'` guard so it can't ship to the browser)
- [x] `lib/db/index.ts` — async repo objects mirroring the old localStorage API: `Users`, `Credentials`, `Departments`, `LeaveTypes`, `Entitlements`, `Applications` (with `leaveBalances`, `byDepartment`, `byDepartmentAndStatus`, `byStatus`, `byUser`, hydrated relation selects), `Approvals`, `Rotas`, `Slots`, `Notifications`, `UAR`
- [x] `lib/entitlements.ts` — shared, server-only: `annualLeaveDays`, `provisionEntitlementsForUser`, `resyncAnnualEntitlement` (grade-driven: academic=30, non-academic senior=30, junior=21)
- [x] `lib/authz.ts` — `getSessionUser`, `requireUser`, `requireRole`, `requireSameDepartment`
- [x] `lib/constants.ts` — `DEFAULT_PASSWORD = 'NAUB@2026'` (shared, demo-free)

## Phase 5 — Server Actions ✅ COMPLETE
`app/actions/` (each `await auth()`, authorises by role, mutates via the DAL, fans out notifications, and `revalidatePath`s):
- [x] `leave.ts` — `applyLeaveAction` (authoritative rota-conflict detection, notifies HOD + cover staff), `cancelLeaveAction`
- [x] `approvals.ts` — `hodDecisionAction` (HOD approve -> forward to Registrar / HOD reject -> terminal), `registrarDecisionAction` (final approve deducts entitlement + notifies applicant + HOD)
- [x] `admin.ts` — `approveUserAction` (auto-provisions entitlements), `rejectUserAction`, `createStaffAction` (insert user + bcrypt default password + provision entitlements), `updateStaffRoleAction`, `updateStaffCategoryAction` (re-syncs annual), `toggleStaffActiveAction`, `adjustEntitlementAction`, plus department CRUD (`createDepartmentAction`, `deleteDepartmentAction`) and leave-type CRUD (`createLeaveTypeAction`, `toggleLeaveTypeAction`)
- [x] `rota.ts` — `publishRotaAction` (inserts rota + all slots + notifies dept staff), `addRotaSlotAction`, `removeRotaSlotAction`
- [x] `notifications.ts` — `markNotificationReadAction`, `markAllNotificationsReadAction`
- [x] `auth.ts` — `changePasswordAction`

## Phase 6 — Migrate pages to Server Components + client islands ✅ COMPLETE
Every dashboard page is now an **async Server Component** that `await auth()` + fetches via the DAL and passes typed props to the existing `*-client.tsx` island; the islands keep their UI but receive data as props and call Server Actions via `useTransition` (no more `useAuth`/`useApplications`/localStorage).

- [x] **Staff** — dashboard, apply (5-step wizard), my-leaves (cancel via action), rota (privacy-preserving calendar)
- [x] **HOD** — dashboard, requests (`hodDecisionAction`), all-requests, calendar, rota (publish rota + slots via `publishRotaAction`)
- [x] **Registrar** — dashboard, requests (`registrarDecisionAction`), entitlements (`adjustEntitlementAction`), all-applications, reports (Excel/PDF export unchanged)
- [x] **Admin** — dashboard, approvals (`approveUserAction`/`rejectUserAction`), staff (`createStaffAction`/role/category/grade/toggle actions), departments (CRUD actions), leave-types (CRUD actions), notifications
- [x] **Shared chrome** — `DashboardShell`/`TopBar`/`Sidebar`/`NotificationBell` all driven by session-derived props + Server Actions

### Verification
- [x] **`npm run build` green** — 29 routes compile; all `/dashboard/*` routes are `ƒ` (Dynamic, server-rendered on demand); `/login`, `/register`, `/pending-approval` are `○` (Static); proxy detected.
- [x] **Zero `@/lib/local` references** in `app/` and `components/` (`grep -r "@/lib/local" app components` -> 0).
- [x] **Zero demo-hook usage** (`useAuth`, `useApplications`, `useLeaveBalances`, `useApprovalRequests`, …) in `app/` and `components/`.
- [x] `middleware.ts` removed; `proxy.ts` present (required by Next.js 16 — `middleware.ts` now fails the build).

---

## Phase 1 — Project Setup & Supabase Configuration ✅ COMPLETE
- [x] Dependencies installed (`@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `@fullcalendar/*`, `xlsx`, `jspdf`, `jspdf-autotable`, `resend`, `@react-email/components`, `lucide-react`, `sonner`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@tanstack/react-table`)
- [x] `.env.example` and `.env.local` created
- [x] Full Supabase SQL migration with RLS policies (all 9 tables)
- [x] Supabase client + server clients with demo-mode fallback
- [x] `middleware.ts` (auth proxy) — kept on the `middleware` convention per master prompt

## Phase 2 — Authentication & Onboarding ✅ COMPLETE
- [x] `/login` — **staff_id + password** with demo quick-login buttons
- [x] ~~`/register`~~ — removed in Phase 11 (staff-ID accounts are HR/admin-provisioned, not self-signup); old URL now `redirect('/login')`
- [x] `/pending-approval` — holding page for unapproved users
- [x] Demo user-switcher in topbar

## Phase 3 — Admin Dashboard ✅ COMPLETE
- [x] `DashboardLayout` (client) with collapsible sidebar + topbar
- [x] Admin overview, User Approval Queue, Staff Management, Departments, Leave Types, System Settings, Notifications — all wired to localStorage store

## Phase 4 — Staff Dashboard ✅ COMPLETE
- [x] Staff overview, Apply for Leave (4-step wizard), My Leave History, Leave Rota Calendar — all on localStorage

## Phase 5 — HOD Dashboard ✅ COMPLETE
- [x] HOD overview, Leave Requests, All Department Requests, Leave Rota (publish with slots + staff picker), Department Calendar — all on localStorage

## Phase 6 — HR Manager Dashboard ✅ COMPLETE
- [x] HR overview, Pending Approvals, Leave Entitlements (with adjustments), Reports (Excel + PDF), All Applications — all on localStorage

## Phase 7 — Notifications System ✅ COMPLETE
- [x] `NotificationBell` — bell with dropdown, mark-read / mark-all-read
- [x] Email templates via Resend (`lib/email.ts`) — all 9 event types

## Phase 8 — Shared Components, Polish & Landing Page ✅ COMPLETE
- [x] `Button` (pill variants), `Card`, `Input`/`Textarea`/`Select`/`FormField`, `Badge`/`StatusBadge`/`RoleBadge`, `Dialog`, `StatCard`/`ProgressBar`/`EmptyState`/`Skeleton`/`PageHeader`
- [x] `Sidebar` — role-aware collapsible nav + mobile hamburger drawer
- [x] `TopBar` — notifications, theme toggle, demo user-switcher
- [x] `LeaveTracker` — 4-step approval progress stepper
- [x] FullCalendar integration — HOD calendar + Staff rota
- [x] **Landing page** (`app/_components/landing/`) — full Cal.com-style marketing page (header, hero, mockup, features, approval flow, roles, how-it-works, FAQ, CTA, footer) — Phase 11 trimmed to remove signup CTAs
- [x] **Design polish** — Cal Sans headings, Inter body (300 weight, -0.19px tracking), `Reveal` scroll-in animation, prefers-reduced-motion respected

## Phase 9 — Testing & Final Checks ✅ COMPLETE
- [x] **Production build green**
- [x] Auth routing verified — unapproved users → `/pending-approval`; role-based route protection via `middleware.ts`
- [x] Role-based access verified across all four roles
- [x] Leave workflow end-to-end in demo mode — apply → HOD decision → HR decision → entitlement deduction
- [x] Rota publishing + calendar rendering verified for both HOD and Staff views
- [x] Excel/PDF export handlers wired (`xlsx`, `jspdf`)
- [x] Dark mode verified via `.dark` class + CSS custom property cascade
- [x] Mobile responsiveness — slide-in sidebar, responsive tables, fluid hero type

## Phase 10 — Client-Side localStorage Migration ✅ COMPLETE
Goal: every feature works on localStorage before backend (Supabase) integration.

### Data layer (`lib/local/`)
- [x] `constants.ts` — DATA_KEY, PASSWORDS_KEY, CURRENT_USER_KEY, DEMO_COOKIE_NAME, DEMO_ROLE_COOKIE_NAME, **DEFAULT_PASSWORD = `NAUB@2026`**
- [x] `seed.ts` — same 9 users, 5 departments, 7 leave types, 15 entitlements, 5 applications, 5 approval audits, 1 rota + 2 slots, 4 notifications, 1 pending UAR as the previous demo seed
- [x] `store.ts` — single JSON blob + parallel passwords map; repo objects `Users`, `Departments`, `LeaveTypes`, `Entitlements`, `Applications`, `Approvals`, `Rotas`, `Slots`, `Notifications`, `UAR`, `Passwords`, `Session`; module-level `version` counter; `hydrateStore()` auto-seeds on first read; `resetDemoData()` helper
- [x] `auth-store.ts` — `loginWithStaffId`, `changePassword`, `getCurrentUser`, `logout`, `switchUser`, `registerNewUser` *(still exported; only used if a future admin-driven "create account" UI calls it; the public `/register` route that used it is gone)*
- [x] `data-hooks.ts` — 15 React hooks that subscribe to the store version via `useSyncExternalStore`
- [x] `routes.ts` — `dashboardPathFor(role)`

### React providers (`components/providers/`)
- [x] `AuthProvider` (`useAuth()`) — `currentUser`, `ready`, `login`, `logout`, `changePassword`, `switchUser`, `refresh`
- [x] `DataProvider` — triggers `hydrateStore()`
- [x] `app/layout.tsx` — wraps children in `<ThemeProvider><AuthProvider><DataProvider>`

### Auth flow changes
- [x] **Login by staff_id + password** — demo quick-buttons: `NAUB/ADM/001`, `NAUB/CS/001`, `NAUB/HR/001`, `NAUB/CS/010` with `NAUB@2026`
- [x] **Default password `NAUB@2026`** assigned to every seeded user
- [x] **Change password in dashboard** — `/dashboard/profile` accessible from sidebar "Account" group + topbar user menu
- [x] **Cookie mirror** for middleware — `naub-demo-user` + `naub-demo-role`

### Page conversions (all client-side, all reading from localStorage)
- [x] All 25 dashboard pages, dashboard chrome, notification bell, topbar, sidebar, login, dashboard layout — full coverage

### Deleted (obsolete server-side data layer)
- [x] `lib/auth.ts`, `lib/data/dal.ts`, `lib/data/actions.ts`, `lib/mock/{store,data,session,session-constants}.ts`, `app/test/page.tsx`

## Phase 11 — Remove Public Signup + Accessibility Pass ✅ COMPLETE
Two goals: (1) drop the public `/register` flow since auth is staff-ID driven; (2) fix poor contrast on text/bg combinations end-to-end so all foreground/background pairs meet WCAG AA (4.5:1 normal text, 3:1 large text).

### Removed public signup
- [x] `app/(auth)/register/page.tsx` → now a Server Component that calls `redirect('/login')` (so old links still resolve)
- [x] `app/(auth)/register/register-client.tsx` — deleted (no longer needed)
- [x] `middleware.ts` — `/register` removed from `PUBLIC_ROUTES`; the `/register || '/' || '/login'` redirect rule simplified
- [x] `app/(auth)/login/page.tsx` — "Register as staff" link removed; replaced with informational copy: *"Staff accounts are provisioned by your HR / admin. If you already have credentials, sign in above."*
- [x] `app/_components/landing/landing-page.tsx` — every "Get started" CTA pointing to `/register` removed:
  - Header CTA → single "Sign in" button
  - Hero primary CTA → "Sign in"; secondary CTA → "See features" anchor
  - Final CTA section → "Sign in" + "See how it works" anchor; copy updated to *"Sign in with your staff ID to access the NAUB leave management system. Accounts are provisioned by your HR / admin team."*
- [x] "How it works" 3 steps reworded:
  - 1. Account provisioned (HR creates your account)
  - 2. Sign in & personalise (change the default password)
  - 3. Apply & track (unchanged)
- [x] FAQ expanded with a new entry: *"How do I get a staff ID and account?"*

### Contrast fix (WCAG AA across the board)

`app/globals.css` was the root cause — `--text-tertiary`, `--text-secondary`, `--accent`, and several status colors all failed AA on light backgrounds; dark-mode `--text-tertiary` failed AA on dark backgrounds. The full token set was rewritten so every foreground/background combination passes AA:

**Light mode — on `#f4f4f4` page / `#ffffff` card backgrounds:**
- `--text-primary #1f2937` (slate-800) → **13.5:1** ✓ AAA  *(was `#242424` ≈14:1, kept dark)*
- `--text-secondary #475569` (slate-600) → **7.04:1** ✓ AA  *(was `#6b7280` ≈4.25:1, borderline AA)*
- `--text-tertiary #646464` → **5.36:1** ✓ AA  *(was `#898989` 3.16:1 — **FAILING AA**)*
- `--bg-subtle #ebebeb` darkened from `#f4f4f4` so it reads as a separator
- `--border-default #c7c9cd` slightly darker than `#d1d5db` for better definition
- `--accent #0c6cc7` (brand blue, for text) → **5.74:1** ✓ AA  *(was `#0099ff` 3.0:1 — **FAILING AA**)*
- `--color-action-blue #0c6cc7` (Tailwind utility) → matches new `--accent`
- `--success #15803d` on `#f0fdf4` → **4.66:1** ✓ AA  *(was `#16a34a` 3.06:1)*
- `--warning #a16207` on `#fefce8` → **4.83:1** ✓ AA  *(was `#ca8a04` 2.73:1)*
- `--danger #b91c1c` on `#fef2f2` → **6.79:1** ✓ AA  *(was `#dc2626` 4.51:1 borderline)*

**Dark mode — on `#0a0a0a` page / `#161616` card / `#1c1c1c` elevated:**
- `--text-primary #fafafa` → **19.0:1** ✓ AAA  *(was `#f5f5f5` 18:1)*
- `--text-secondary #d4d4d8` (zinc-300) → **12.5:1** ✓ AAA  *(was `#a1a1aa` 4.4:1 borderline)*
- `--text-tertiary #a3a3a3` → **8.04:1** ✓ AA  *(was `#71717a` 3.0:1 — **FAILING AA**)*
- `--bg-subtle #1f1f1f` lifted from `#1c1c1c` for visible card separation
- `--border-default #3f3f46` lifted from `#3a3a3a`
- `--accent #60a5fa` → **8.15:1** ✓ AA  *(was `#3ea8ff` 6.06:1 still passes, brightened for parity)*
- `--success #4ade80` → **10.5:1** ✓ AA
- `--warning #facc15` → **14.6:1** ✓ AAA
- `--danger #f87171` → **6.51:1** ✓ AA

### Touched components
- [x] `app/_components/landing/landing-page.tsx` — CTA buttons reworded (see "Removed public signup" above)
- [x] `app/(auth)/login/page.tsx` — "Register as staff" link removed
- [x] `app/dashboard/hod/calendar/hod-calendar-client.tsx` — `EVENT_COLORS` palette updated to AA-safe values (white text now passes on every event background):
  - rota → `#475569` (slate-600, 6.12:1)
  - approved → `#1f2937` (slate-800, 14.9:1)
  - hod_approved → `#0c6cc7` (brand blue, 5.74:1)
- [x] `app/globals.css` — `--ink` fallback updated `#101010` → `#0a0a0a` (in `::selection` + FullCalendar overrides)
- [x] `components/ui/dialog.tsx`, `components/ui/button.tsx`, `components/ui/badge.tsx` — rechecked; all color combos now pass AA against the new tokens

---

## Phase 13 — HR → Registrar Rename + Em Dash Removal ✅ COMPLETE

All user-facing references to "HR" / "HR Manager" replaced with "Registrar" throughout the application. Internal technical identifiers preserved (`hr_manager` role value, `user-hr` ID, `app/dashboard/hr/` route, `NAUB/HR/001` staff ID).

### HR → Registrar replacements
- `components/dashboard/topbar.tsx` — `ROLE_LABEL['hr_manager'] = 'Registrar'`
- `components/ui/badge.tsx` — `RoleBadge` label for `hr_manager` → 'Registrar'
- `app/(auth)/login/page.tsx` — demo account role 'HR Manager' → 'Registrar'; copy "HR / admin" → "Registrar / admin"
- `app/dashboard/profile/profile-client.tsx` — `ROLE_LABEL` map
- `app/dashboard/hr/hr-dashboard-client.tsx` — title, stat labels, card titles, empty states
- `app/dashboard/hr/requests/hr-requests-client.tsx` — page header, card title, empty state, notification titles/messages
- `app/dashboard/hod/hod-dashboard-client.tsx` — stat card "Awaiting HR approval" → "Awaiting Registrar approval"
- `app/dashboard/hod/requests/hod-requests-client.tsx` — notification messages, toast success messages, comment
- `app/dashboard/staff/staff-dashboard-client.tsx` — "Contact HR" → "Contact your Registrar"
- `app/dashboard/staff/apply/apply-client.tsx` — document reminder copy
- `app/dashboard/staff/rota/staff-rota-client.tsx` — empty state description
- `app/dashboard/admin/staff/staff-client.tsx` — role filter/select options
- `app/dashboard/admin/settings/page.tsx` — email event label
- `app/dashboard/hod/calendar/hod-calendar-client.tsx` — calendar legend comment + label
- `components/leave/leave-tracker.tsx` — stepper label + JSDoc comment
- `middleware.ts` — public signup comment
- `app/(auth)/register/page.tsx` — redirect comment
- `lib/email.ts` — all email subject lines and body copy (rejection contact, HOD forwarding, Registrar final approval/rejection)

### Em dash removal
- All em dashes (`—`) replaced with contextually appropriate alternatives: commas, periods, or hyphens across 44+ files
- No em dashes remain in any application source files

---

## Design System — Cal.com Style (now AA-compliant) ✅ APPLIED
- [x] Monochrome palette: Ink `#0a0a0a`, Graphite `#1f2937`, Slate-600 `#475569`, Stone `#646464`, Paper `#f4f4f4`, White `#ffffff`
- [x] Action Blue `#0c6cc7` for secondary links only (5.74:1 on white — AA)
- [x] Dark mode via `.dark` class + CSS custom properties (light + dark shadow channels)
- [x] Typography: Cal Sans UI (body, 300 weight), Cal Sans (headings, 600)
- [x] Pill buttons (9999px), 12px card radius, 8px input radius
- [x] Subtle shadow elevation — no borders on cards (adaptive `rgba()` shadows per mode)
- [x] Page max-width 1200px, compact density, 96px section gap on landing

---

## Key Decisions Made
1. **localStorage-first** — all data lives in `localStorage`; the eventual Supabase backend is a contained swap to `lib/local/*`
2. **Client components by default for dashboard** — `'use client'` everywhere; `useSyncExternalStore` provides reactivity on every store mutation
3. **No server actions** — mutations are direct calls to `Users.update`, `Applications.insert`, etc.
4. **Staff-ID + default password auth** — every seeded user gets `NAUB@2026`; changeable from `/dashboard/profile`
5. **No public signup** — accounts are HR-provisioned; `/register` redirects to `/login` so any bookmarked/stale URL still resolves cleanly
6. **WCAG AA everywhere** — every foreground/background pair in the app now measures ≥4.5:1 (normal text) or ≥3:1 (large text) in both light and dark modes
7. **Passwords in a separate parallel map** — keyed by `user_id`, not on the `User` object; matches the design split used by the eventual Supabase `auth.users` table
8. **Cookie mirror for middleware** — `middleware.ts` continues to gate `/dashboard/*` by reading the `naub-demo-user` cookie that the client login handler writes via `document.cookie`
9. **`middleware.ts` kept** — Next.js 16 deprecates it in favour of `proxy.ts`, but the master prompt requires `middleware.ts`; the deprecation warning is harmless

---

## Known Issues / Future Work
- Real-time notifications via Supabase Realtime subscriptions not yet wired (notifications are poll-on-render via the version counter)
- Print stylesheet for HR/PDF exports — minor polish item
- Audit log table — not yet in Supabase migrations
- Cal Sans via `next/font/google` emits a harmless "font override values" build warning (no font-metrics fallback); visual output unaffected
- Password hashing — current implementation is plaintext-equality; the Supabase phase will swap to `@supabase/ssr`'s `signInWithPassword` and bcrypt-hashed credentials
- "Reset demo data" button — helper `resetDemoData()` exists in `lib/local/store.ts` but is not yet wired to a UI button
- HOD `apply-client.tsx` has a simplified rota-conflict check (the `Slots.byDepartment` filter is a stub); the full implementation lives in the HOD rota view
- Admin "create staff account" UI is a logical next step now that public signup is gone — `registerNewUser()` already exists in `lib/local/auth-store.ts` for this

---

## Phase 1 — Project Setup & Supabase Configuration ✅ COMPLETE
- [x] Dependencies installed (`@supabase/supabase-js`, `@supabase/ssr`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `@fullcalendar/*`, `xlsx`, `jspdf`, `jspdf-autotable`, `resend`, `@react-email/components`, `lucide-react`, `sonner`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@tanstack/react-table`)
- [x] `.env.example` and `.env.local` created
- [x] Full Supabase SQL migration with RLS policies (all 9 tables)
- [x] Supabase client + server clients with demo-mode fallback
- [x] `middleware.ts` (auth proxy) — kept on the `middleware` convention per master prompt

## Phase 2 — Authentication & Onboarding ✅ COMPLETE
- [x] `/login` — **staff_id + password** with demo quick-login buttons (Phase 10 swap from email+password)
- [x] `/register` — full registration form, default `NAUB@2026` auto-assigned on approval
- [x] `/pending-approval` — holding page for unapproved users
- [x] Demo user-switcher in topbar (Phase 10)

## Phase 3 — Admin Dashboard ✅ COMPLETE
- [x] `DashboardLayout` (client) with collapsible sidebar + topbar
- [x] Admin overview, User Approval Queue, Staff Management, Departments, Leave Types, System Settings, Notifications — all wired to localStorage store

## Phase 4 — Staff Dashboard ✅ COMPLETE
- [x] Staff overview, Apply for Leave (4-step wizard), My Leave History, Leave Rota Calendar — all on localStorage

## Phase 5 — HOD Dashboard ✅ COMPLETE
- [x] HOD overview, Leave Requests, All Department Requests, Leave Rota (publish with slots + staff picker), Department Calendar — all on localStorage

## Phase 6 — HR Manager Dashboard ✅ COMPLETE
- [x] HR overview, Pending Approvals, Leave Entitlements (with adjustments), Reports (Excel + PDF), All Applications — all on localStorage

## Phase 7 — Notifications System ✅ COMPLETE
- [x] `NotificationBell` — bell with dropdown, mark-read / mark-all-read
- [x] Email templates via Resend (`lib/email.ts`) — all 9 event types

## Phase 8 — Shared Components, Polish & Landing Page ✅ COMPLETE
- [x] `Button` (pill variants), `Card`, `Input`/`Textarea`/`Select`/`FormField`, `Badge`/`StatusBadge`/`RoleBadge`, `Dialog`, `StatCard`/`ProgressBar`/`EmptyState`/`Skeleton`/`PageHeader`
- [x] `Sidebar` — role-aware collapsible nav + mobile hamburger drawer
- [x] `TopBar` — notifications, theme toggle, demo user-switcher
- [x] `LeaveTracker` — 4-step approval progress stepper
- [x] FullCalendar integration — HOD calendar + Staff rota
- [x] **Landing page** (`app/_components/landing/`) — full Cal.com-style marketing page (header, hero, mockup, features, approval flow, roles, how-it-works, FAQ, CTA, footer)
- [x] **Design polish** — Cal Sans headings, Inter body (300 weight, -0.19px tracking), `Reveal` scroll-in animation, prefers-reduced-motion respected

## Phase 9 — Testing & Final Checks ✅ COMPLETE
- [x] **Production build green** — `next build` compiles all routes with zero TypeScript errors
- [x] Auth routing verified — unapproved users → `/pending-approval`; role-based route protection via `middleware.ts`
- [x] Role-based access verified across all four roles
- [x] Leave workflow end-to-end in demo mode — apply → HOD decision → HR decision → entitlement deduction
- [x] Rota publishing + calendar rendering verified for both HOD and Staff views
- [x] Excel/PDF export handlers wired (`xlsx`, `jspdf`)
- [x] Dark mode verified via `.dark` class + CSS custom property cascade
- [x] Mobile responsiveness — slide-in sidebar, responsive tables, fluid hero type

## Phase 10 — Client-Side localStorage Migration ✅ COMPLETE
Goal: every feature works on localStorage before backend (Supabase) integration.

### Data layer (`lib/local/`)
- [x] `constants.ts` — DATA_KEY, PASSWORDS_KEY, CURRENT_USER_KEY, DEMO_COOKIE_NAME, DEMO_ROLE_COOKIE_NAME, **DEFAULT_PASSWORD = `NAUB@2026`**
- [x] `seed.ts` — same 9 users, 5 departments, 7 leave types, 15 entitlements, 5 applications, 5 approval audits, 1 rota + 2 slots, 4 notifications, 1 pending UAR as the previous demo seed
- [x] `store.ts` — single JSON blob + parallel passwords map; repo objects `Users`, `Departments`, `LeaveTypes`, `Entitlements`, `Applications`, `Approvals`, `Rotas`, `Slots`, `Notifications`, `UAR`, `Passwords`, `Session`; module-level `version` counter; `hydrateStore()` auto-seeds on first read; `resetDemoData()` helper
- [x] `auth-store.ts` — `loginWithStaffId`, `changePassword`, `getCurrentUser`, `logout`, `switchUser`, `registerNewUser`
- [x] `data-hooks.ts` — `useUsers`, `useUser`, `useDepartments`, `useLeaveTypes`, `useActiveLeaveTypes`, `useLeaveBalances`, `useEntitlementsForUser`, `useApplications(filter)`, `useApplication`, `useApprovalsForApplication`, `useNotifications`, `useUnreadCount`, `useRotasByDepartment`, `useRotaSlotsByDepartment`, `useApprovalRequests`, `useStaffCount` — all subscribe to the store version via `useSyncExternalStore`
- [x] `routes.ts` — `dashboardPathFor(role)` (replaces `lib/auth.ts`)

### React providers (`components/providers/`)
- [x] `auth-provider.tsx` — `AuthProvider` + `useAuth()` exposing `currentUser`, `ready`, `login`, `logout`, `changePassword`, `switchUser`, `refresh`; hydrates the store on mount; gates all dashboard pages
- [x] `data-provider.tsx` — `DataProvider` triggers `hydrateStore()` on mount
- [x] `app/layout.tsx` — wraps body in `<ThemeProvider><AuthProvider><DataProvider>`

### Auth flow changes
- [x] **Login by staff_id + password** — `app/(auth)/login/page.tsx` rewritten; demo quick-buttons use `NAUB/ADM/001`, `NAUB/CS/001`, `NAUB/HR/001`, `NAUB/CS/010`
- [x] **Default password `NAUB@2026`** assigned to every seeded user; auto-assigned on registration
- [x] **Change password in dashboard** — new `/dashboard/profile` route (all four roles) accessible from sidebar "Account" group + topbar user menu
- [x] **Cookie mirror** for middleware — login writes `naub-demo-user` + `naub-demo-role` cookies so `middleware.ts` route guards continue to work
- [x] **Registration** — `app/(auth)/register/*` converted to client; `password` field removed; `registerNewUser` helper inserts `User` + `UAR` + assigns default password; success screen shows the user's staff_id + default password

### Page conversions (all client-side, all reading from localStorage)
- [x] `/dashboard/layout.tsx` — client component, gates on `useAuth().ready` and `currentUser`, redirects to `/login` if not authed
- [x] `/dashboard/{staff,hod,hr,admin}/page.tsx` — thin client wrappers delegating to new `*-dashboard-client.tsx`
- [x] `/dashboard/staff/{apply,my-leaves,rota}/...` — converted; `apply-client` reads balances via `useLeaveBalances`, submits via `Applications.insert` + `Notifications.insert`
- [x] `/dashboard/hod/{requests,all-requests,calendar,rota}/...` — converted; HOD decisions use direct `Applications.update` + `Approvals.insert` + `Notifications.insert`; `rota` page uses a `<Select>` of department staff
- [x] `/dashboard/hr/{requests,entitlements,all-applications,reports}/...` — converted; HR final approval deducts entitlements via `Entitlements.update`
- [x] `/dashboard/admin/{staff,departments,leave-types,notifications,approvals}/...` — converted; admin CRUD writes to store directly
- [x] `/dashboard/staff/my-leaves/my-leaves-client.tsx` — cancel via `Applications.update`
- [x] `components/notifications/notification-bell.tsx` — reads from `useNotifications`; mark-read via `Notifications.markRead`/`markAllRead`
- [x] `components/dashboard/{topbar,dashboard-layout}.tsx` — topbar uses `useAuth().logout/switchUser`; layout reads notifications from hooks
- [x] `components/dashboard/sidebar.tsx` — every role's nav has an "Account" group with "My Profile" → `/dashboard/profile`

### Deleted (obsolete server-side data layer)
- [x] `lib/auth.ts` (server-only requireUser/requireRole)
- [x] `lib/data/dal.ts` (server-side reads)
- [x] `lib/data/actions.ts` (server actions — replaced by direct store mutations)
- [x] `lib/mock/store.ts`, `lib/mock/data.ts`, `lib/mock/session.ts`, `lib/mock/session-constants.ts`
- [x] `app/test/page.tsx` (Phase 1 throwaway)

### Verification
- [x] **Build: green** — `npm run build` → 29 routes compile clean, zero TypeScript errors. All dashboard pages are now prerendered (`○` Static) — much faster than before.
- [x] **Zero stale imports** — no file references `@/lib/auth`, `@/lib/data/*`, or `@/lib/mock/*` anywhere in the project
- [x] **End-to-end smoke** (manual via dev server):
  1. Open `/` → landing renders.
  2. Click "Sign in" → `/login`.
  3. Click demo quick-button `NAUB/ADM/001` → admin dashboard with seeded notification visible in bell.
  4. Switch user to `NAUB/CS/001` (HOD) → `/dashboard/hod`; pending applications table populated.
  5. Approve `app-3` → toast confirms; HOD audit row + notifications for applicant + HRs created.
  6. Switch to `NAUB/HR/001` → `/dashboard/hr`; final-approve the same application; verify Samuel's `used_days` increments on `/dashboard/hr/entitlements`.
  7. Switch to `NAUB/CS/010` (Samuel) → `/dashboard/staff`; apply for a new leave; HOD receives notification; approval flow completes.
  8. Click "My Profile" → `/dashboard/profile`; change password from `NAUB@2026` to `MyNewPass2026` → toast. Sign out. Sign back in with the new password.
  9. DevTools → Application → Local Storage → verify `naub-lms-data`, `naub-lms-passwords`, `naub-lms-current-user`, `naub-demo-user`, `naub-demo-role` keys exist.
  10. `localStorage.clear()` + reload → store re-seeds from `lib/local/seed.ts`; demo accounts work again with `NAUB@2026`.
  11. Incognito window → independent state, fresh seed.
  12. Register from `/register` (no password field); see success screen with the assigned staff_id + default password. Approve via admin `/dashboard/admin/approvals`; sign in as the new user.

---

## Design System — Cal.com Style ✅ APPLIED
- [x] Monochrome palette: Ink `#101010`, Graphite `#242424`, Slate `#6b7280`, Paper `#f4f4f4`, White `#ffffff`
- [x] Action Blue `#0099ff` reserved for secondary accents only
- [x] Dark mode via `.dark` class + CSS custom properties (light + dark shadow channels)
- [x] Typography: Cal Sans UI (body, 300 weight), Cal Sans (headings, 600)
- [x] Pill buttons (9999px), 12px card radius, 8px input radius
- [x] Subtle shadow elevation — no borders on cards (adaptive `rgba()` shadows per mode)
- [x] Page max-width 1200px, compact density, 96px section gap on landing

---

## Key Decisions Made
1. **localStorage-first** — all data lives in `localStorage`; the eventual Supabase backend is a contained swap to `lib/local/*`
2. **Client components by default for dashboard** — `'use client'` everywhere; `useSyncExternalStore` provides reactivity on every store mutation
3. **No server actions** — mutations are direct calls to `Users.update`, `Applications.insert`, etc.
4. **Staff-ID + default password auth** — every seeded user gets `NAUB@2026`; changeable from `/dashboard/profile`
5. **Passwords in a separate parallel map** — keyed by `user_id`, not on the `User` object; matches the design split used by the eventual Supabase `auth.users` table
6. **Cookie mirror for middleware** — `middleware.ts` continues to gate `/dashboard/*` by reading the `naub-demo-user` cookie that the client login handler writes via `document.cookie`
7. **`middleware.ts` kept** — Next.js 16 deprecates it in favour of `proxy.ts`, but the master prompt requires `middleware.ts`; the deprecation warning is harmless

---

## Known Issues / Future Work
- Real-time notifications via Supabase Realtime subscriptions not yet wired (notifications are poll-on-render via the version counter)
- Print stylesheet for HR/PDF exports — minor polish item
- Audit log table — not yet in Supabase migrations
- Cal Sans via `next/font/google` emits a harmless "font override values" build warning (no font-metrics fallback); visual output unaffected
- Password hashing — current implementation is plaintext-equality; the Supabase phase will swap to `@supabase/ssr`'s `signInWithPassword` and bcrypt-hashed credentials
- "Reset demo data" button — helper `resetDemoData()` exists in `lib/local/store.ts` but is not yet wired to a UI button
- HOD `apply-client.tsx` has a simplified rota-conflict check (the `Slots.byDepartment` filter is a stub); the full implementation lives in the HOD rota view