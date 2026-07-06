# NAUB Staff Leave Management System — Master Build Prompt

---

## 🔴 CRITICAL: READ BEFORE WRITING A SINGLE LINE OF CODE

Before doing anything else, you MUST:

1. Read the design skill file at:
   `C:\Users\MY PC\Desktop\staff_leave_management_system\design_skill\cal.com.md`
   Follow every instruction in it **strictly**. It governs all UI decisions — spacing, typography, colors, component style, dark/light mode, animations, and layout. Do not deviate from it.

2. After reading the design skill, acknowledge what you have read and summarize the key design rules you will follow, before writing any code.

3. Work in clearly labeled phases. At the start of each phase, print:
   `=== PHASE X: [PHASE NAME] — STARTING ===`
   At the end of each phase, print:
   `=== PHASE X: [PHASE NAME] — COMPLETE ✓ ===`
   and give a brief summary of what was built and what comes next.

4. Maintain a running checklist in a file called `PROGRESS.md` at the root of the project. Update it at the end of every phase with what is done, what is pending, and any decisions made.

---

## PROJECT OVERVIEW

**App Name:** NAUB Staff Leave Management System
**Institution:** Nigerian Army University, Biu (NAUB)
**Stack:** Next.js 14+ (App Router) + Supabase (Auth, Database, Storage) + TypeScript
**UI:** Follow the design skill file strictly (light/dark toggle required)
**Goal:** A fully professional, production-ready web-based leave management system for NAUB staff

Next.js has already been installed. You will install all other dependencies as needed during the appropriate phase.

---

## SYSTEM ROLES

There are 4 roles. Each role has its own scoped dashboard and permissions:

| Role | Description |
|------|-------------|
| `admin` | Super admin. Manages all users, departments, leave types, and system config. Must approve every new user account before they can access the system — including HODs and HR Managers. |
| `hod` | Head of Department. First approval gate for leave requests in their department. Publishes and manages the departmental leave rota. |
| `hr_manager` | Second and final approval gate. Manages leave entitlements, generates reports. |
| `staff` | Regular employee. Applies for leave, tracks their own request, views departmental rota calendar (read-only). |

---

## PHASE 1 — PROJECT SETUP & SUPABASE CONFIGURATION

### 1.1 Install Dependencies

Install the following (do not install anything not listed here unless the design skill requires it):

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# UI & Styling (check design skill first — install only what it requires)
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn@latest init

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Date handling
npm install date-fns

# Calendar (for leave rota visual)
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction

# Excel & PDF export (for HR reports)
npm install xlsx jspdf jspdf-autotable

# Email notifications
npm install resend react-email @react-email/components

# Icons
npm install lucide-react
```

### 1.2 Environment Variables

Create `.env.local` with placeholders and document each variable:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.example` as a copy with empty values (for version control).

### 1.3 Supabase Project Setup

Provide step-by-step instructions for:
- Creating a new Supabase project at supabase.com
- Where to find and copy the URL and API keys
- Enabling email auth in the Supabase Auth settings
- Disabling "confirm email" (admin will manually approve users instead)

### 1.4 Database Schema

Create a single SQL migration file `supabase/migrations/001_initial_schema.sql` with ALL of the following tables. Include full RLS (Row Level Security) policies for every table.

```sql
-- USERS (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  staff_id TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'hod', 'hr_manager', 'staff')),
  staff_type TEXT NOT NULL CHECK (staff_type IN ('academic', 'non_academic')),
  department_id UUID REFERENCES public.departments(id),
  is_approved BOOLEAN DEFAULT FALSE, -- Admin must approve before login works
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DEPARTMENTS
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  hod_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAVE TYPES
CREATE TABLE public.leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  applicable_to TEXT NOT NULL CHECK (applicable_to IN ('academic', 'non_academic', 'both')),
  max_days_academic INT,
  max_days_non_academic INT,
  requires_document BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAVE ENTITLEMENTS (per user, per leave type, per year)
CREATE TABLE public.leave_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id),
  year INT NOT NULL,
  total_days INT NOT NULL,
  used_days INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, leave_type_id, year)
);

-- LEAVE APPLICATIONS
CREATE TABLE public.leave_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES public.users(id),
  leave_type_id UUID NOT NULL REFERENCES public.leave_types(id),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INT NOT NULL,
  reason TEXT NOT NULL,
  supporting_doc_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'hod_approved', 'approved', 'hod_rejected', 'rejected', 'cancelled')),
  rota_conflict BOOLEAN DEFAULT FALSE, -- flagged if dates conflict with published rota
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAVE APPROVALS (audit trail of every decision)
CREATE TABLE public.leave_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.leave_applications(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.users(id),
  approver_role TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'forwarded')),
  comment TEXT,
  decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAVE ROTA (published per department per period)
CREATE TABLE public.leave_rota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id),
  title TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  max_concurrent INT NOT NULL DEFAULT 2,
  published_by UUID NOT NULL REFERENCES public.users(id),
  published_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ROTA SLOTS (individual entries on the calendar for the rota)
CREATE TABLE public.rota_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rota_id UUID NOT NULL REFERENCES public.leave_rota(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  slot_start DATE NOT NULL,
  slot_end DATE NOT NULL,
  leave_type_id UUID REFERENCES public.leave_types(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leave_submitted', 'leave_approved', 'leave_rejected', 'rota_published', 'account_approved', 'general')),
  is_read BOOLEAN DEFAULT FALSE,
  related_application_id UUID REFERENCES public.leave_applications(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- USER APPROVAL REQUESTS (for admin to approve new accounts)
CREATE TABLE public.user_approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL,
  requested_department_id UUID REFERENCES public.departments(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Seed the database with:
- Default leave types matching the entitlement table in the system spec
- One default admin account (document credentials clearly)
- 3 sample departments: Computer Science, Administration, Registry

### 1.5 Supabase Auth Middleware

Create `middleware.ts` at the project root using `@supabase/ssr`. It must:
- Protect all `/dashboard` routes — redirect unauthenticated users to `/login`
- Check `is_approved` on the user record — redirect unapproved users to `/pending-approval` page
- Attach the user's role to the request so layouts can use it without extra fetches

---

## PHASE 2 — AUTHENTICATION & ONBOARDING

### 2.1 Pages to Build

`/login` — Email + password login form. Clean, branded with NAUB name. Dark/light toggle in the top right corner. Show the NAUB logo placeholder (use initials "NAUB" in a styled box until a real logo is provided).

`/register` — New staff registration form. Fields: Full Name, Email, Password, Phone, Staff ID, Staff Type (Academic / Non-Academic), Department (dropdown from DB), Requested Role. On submit: create Supabase auth user + insert into `users` table with `is_approved = false` + insert into `user_approval_requests`. Show a clear success message: *"Your account has been submitted for admin approval. You will be notified by email once approved."*

`/pending-approval` — A holding page for logged-in but unapproved users. Shows their submission details and a waiting status indicator.

`/forgot-password` and `/reset-password` — Standard Supabase password reset flow.

### 2.2 Auth Logic Rules

- A user who is registered but NOT approved (`is_approved = false`) must be redirected to `/pending-approval` after every login attempt — they must NOT see any dashboard.
- When admin approves a user, send them an email notification via Resend: *"Your NAUB LMS account has been approved. You can now log in."*
- When admin rejects a user, send a rejection email with the admin's comment.
- Role is stored in the `users` table, NOT in Supabase auth metadata (avoids sync issues).

---

## PHASE 3 — ADMIN DASHBOARD

Build the admin dashboard at `/dashboard/admin`. Include a persistent sidebar with navigation and a top bar with user avatar, notifications bell, and dark/light toggle.

### Pages:

**User Approval Queue** (`/dashboard/admin/approvals`)
- Table of all pending `user_approval_requests`
- Columns: Name, Email, Staff ID, Requested Role, Department, Submitted Date, Actions
- Actions: Approve (with optional comment) | Reject (with required comment)
- On approve: set `users.is_approved = true`, update request status, send email notification
- Filter by: pending / approved / rejected

**Staff Management** (`/dashboard/admin/staff`)
- Full list of all staff with search, filter by department and role
- Ability to: deactivate/reactivate account, change role, change department
- View individual staff profile with leave history summary

**Departments** (`/dashboard/admin/departments`)
- Create, edit, delete departments
- Assign HOD to each department (dropdown of approved users with `hod` role)

**Leave Types** (`/dashboard/admin/leave-types`)
- Create, edit, deactivate leave types
- Set max days per academic vs non-academic staff
- Toggle: requires supporting document

**System Settings** (`/dashboard/admin/settings`)
- Update institution name/branding
- Default leave entitlement rules
- Email notification templates preview

**Notifications** (`/dashboard/admin/notifications`)
- View all system notifications sent

---

## PHASE 4 — STAFF DASHBOARD

Build the staff dashboard at `/dashboard/staff`.

### Pages:

**Overview / Home** (`/dashboard/staff`)
- Welcome card with staff name, department, staff type
- Leave balance cards — one per leave type they are entitled to (total days, used, remaining) — use a visual progress bar per type
- Recent leave applications with status badges (Pending / HOD Approved / Approved / Rejected / Cancelled)
- Quick action button: "Apply for Leave"

**Apply for Leave** (`/dashboard/staff/apply`)
- Step-by-step form (use a stepper UI):
  - Step 1: Select leave type (only shows types applicable to their staff_type)
  - Step 2: Select start date and end date (date picker). Auto-calculate total working days. Show remaining balance for selected type. Show a **warning banner** (not a block) if dates conflict with the published departmental rota.
  - Step 3: Enter reason. Upload supporting document (if leave type requires it) — upload to Supabase Storage.
  - Step 4: Review summary and submit.
- On submit: create `leave_applications` record, create in-app notification for HOD, send email to HOD.

**My Leave History** (`/dashboard/staff/my-leaves`)
- Table of all leave applications by this staff member
- Columns: Leave Type, Start Date, End Date, Days, Status, Submitted Date, Actions
- Status badge color coding: Pending (yellow), HOD Approved (blue), Approved (green), Rejected (red), Cancelled (grey)
- Click any row to open a **Leave Tracking Drawer/Modal** showing:
  - Full application details
  - Live progress tracker: `Submitted → HOD Review → HR Review → Final Decision` (show which step is done, current, or pending — like a stepper)
  - Full approval history with comments and timestamps
- Ability to cancel a pending application

**Leave Rota Calendar** (`/dashboard/staff/rota`)
- Read-only FullCalendar view (month view default)
- Shows the published rota for their department only
- Color coding: their own scheduled leave vs colleagues' scheduled slots
- Shows the max concurrent limit as a note per rota period
- Staff cannot see names of colleagues on leave — only "X staff on leave" counts per day to protect privacy

---

## PHASE 5 — HOD DASHBOARD

Build at `/dashboard/hod`.

### Pages:

**Overview** (`/dashboard/hod`)
- Summary cards: Pending approvals count, Staff currently on leave, Upcoming leave this week
- Quick access to pending requests

**Leave Requests** (`/dashboard/hod/requests`)
- Table of all leave applications from staff in their department with status `pending`
- Columns: Staff Name, Leave Type, Start Date, End Date, Days, Reason, Rota Conflict (flag icon if true), Submitted Date
- Click to open a detail panel with full application info
- Actions: Approve (with optional comment) | Reject (with required comment)
- On approve: update status to `hod_approved`, insert into `leave_approvals`, create in-app + email notification for HR Manager and the staff member
- On reject: update status to `hod_rejected`, notify staff member via in-app + email

**All Department Requests** (`/dashboard/hod/all-requests`)
- Full history of all requests from the department across all statuses
- Filter by: status, leave type, date range, staff member

**Leave Rota** (`/dashboard/hod/rota`)
- Publish a new rota: set title, period start/end, max concurrent staff, add individual rota slots per staff member
- FullCalendar view of the published rota for their department
- Edit or delete an existing rota
- When a rota is published: send in-app notification to all staff in the department; send email to all staff

**Department Calendar** (`/dashboard/hod/calendar`)
- Full FullCalendar view showing: published rota slots, approved leave applications, HOD-approved (pending HR) applications — all color coded
- Staff names visible to HOD (unlike the staff view)

---

## PHASE 6 — HR MANAGER DASHBOARD

Build at `/dashboard/hr`.

### Pages:

**Overview** (`/dashboard/hr`)
- Summary cards: Awaiting HR approval, Total staff on leave today, Leave requests this month
- Charts: Leave usage by department (bar chart), Leave type distribution (pie/donut chart)

**Pending Approvals** (`/dashboard/hr/requests`)
- Table of all applications with status `hod_approved`
- Same detail panel as HOD with full history visible
- Actions: Approve (final) | Reject (with required comment)
- On final approve: update status to `approved`, deduct from `leave_entitlements.used_days`, notify staff + HOD via in-app + email
- On reject: update status to `rejected`, notify staff + HOD

**Leave Entitlements** (`/dashboard/hr/entitlements`)
- View all staff leave balances for the current year
- Filter by: department, staff type, leave type
- Ability to manually adjust a staff member's balance (with a reason field — audited)
- Auto-initialize entitlements for all staff at the start of a new year (trigger or button)

**Reports** (`/dashboard/hr/reports`)

Build a full reporting dashboard with these report types:

1. **Leave Usage Summary** — total leave days used per department, per leave type, per period
2. **Staff Leave Balance Report** — remaining vs used days per staff per leave type
3. **Leave Trend Report** — month-by-month leave applications over the year (line chart)
4. **Currently On Leave** — live list of all staff currently on approved leave
5. **High Absence Report** — staff who have used more than 80% of their annual leave entitlement

Every report must have:
- Date range filter
- Department filter
- Export to Excel button (using SheetJS)
- Export to PDF button (using jsPDF + autotable)

**All Applications** (`/dashboard/hr/all-applications`)
- Full system-wide view of all leave applications across all departments
- Full filter + search capability

---

## PHASE 7 — NOTIFICATIONS SYSTEM

### In-App Notifications
- Bell icon in every dashboard top bar showing unread count badge
- Dropdown panel showing latest 10 notifications with timestamp and read/unread state
- "Mark all as read" button
- Link to a full notifications page per role
- All notification inserts go into the `notifications` table

### Email Notifications (via Resend)

Build React Email templates for each event:

| Event | Recipients |
|-------|-----------|
| New user registered | Admin |
| Account approved | Staff/HOD/HR |
| Account rejected | Staff/HOD/HR |
| Leave application submitted | HOD of department |
| HOD approved leave | Staff + HR Manager |
| HOD rejected leave | Staff |
| HR final approved leave | Staff + HOD |
| HR rejected leave | Staff + HOD |
| Rota published | All staff in department |

All emails must be branded with "Nigerian Army University, Biu (NAUB)" and use the same light/dark-compatible color scheme as the app.

### SMS Notifications — COMING SOON
- Add a `sms_notifications_enabled` flag in settings (defaulting to `false`)
- In the notification service, add a clearly commented placeholder:
  ```ts
  // SMS NOTIFICATION — COMING SOON
  // Integrate Termii API here when SMS feature is enabled
  // See: https://developers.termii.com
  ```
- Show a "SMS Notifications: Coming Soon" badge in the admin settings panel

---

## PHASE 8 — SHARED COMPONENTS & POLISH

### Components to Build (reusable across all dashboards):

- `<DashboardLayout>` — sidebar + topbar + main content wrapper, role-aware
- `<Sidebar>` — collapsible, with role-based nav items, NAUB branding, dark/light aware
- `<TopBar>` — notifications bell, user avatar dropdown (profile, logout), dark/light toggle
- `<LeaveStatusBadge>` — color-coded status pill
- `<LeaveTracker>` — reusable multi-step progress component for application status
- `<DataTable>` — reusable sortable/filterable table built on TanStack Table
- `<ConfirmDialog>` — reusable confirmation modal for destructive actions
- `<NotificationBell>` — real-time bell using Supabase Realtime subscriptions
- `<StatCard>` — dashboard summary card with icon, value, trend
- `<EmptyState>` — friendly empty state for tables/lists with illustration

### Real-time Updates
Use Supabase Realtime to subscribe to:
- New notifications for the logged-in user (bell updates without refresh)
- Leave application status changes (staff tracker updates live)
- New pending approvals (HOD and HR dashboards update count live)

### Responsive Design
- Every page must be fully responsive (mobile, tablet, desktop)
- Sidebar collapses to a hamburger menu on mobile
- Tables scroll horizontally on small screens
- Follow the design skill file for all breakpoint behavior

---

## PHASE 9 — TESTING & FINAL CHECKS

Before declaring the build complete, verify the following:

### Auth & Access Control
- [ ] Unregistered user cannot access any dashboard route
- [ ] Registered but unapproved user is always redirected to `/pending-approval`
- [ ] Staff cannot access HOD, HR, or Admin routes
- [ ] HOD cannot access HR or Admin routes
- [ ] HR cannot access Admin routes
- [ ] Admin can access all routes

### Leave Workflow
- [ ] Staff can apply, and HOD receives notification
- [ ] HOD approval moves to HR queue and notifies staff + HR
- [ ] HR approval deducts from leave balance and notifies staff + HOD
- [ ] Rejection at any stage notifies the staff member with the comment
- [ ] Staff can cancel a pending application
- [ ] Leave balance correctly reflects used days after approval

### Rota System
- [ ] HOD can publish a rota with slots and max concurrent limit
- [ ] All department staff receive notification when rota is published
- [ ] Staff applying on a conflicting date see the warning
- [ ] Staff calendar shows rota but not colleague names (only counts)
- [ ] HOD calendar shows full detail

### Reports
- [ ] All 5 report types render correctly with data
- [ ] Excel export works and downloads a valid .xlsx file
- [ ] PDF export works and downloads a valid .pdf file

### Notifications
- [ ] In-app bell updates in real time via Supabase Realtime
- [ ] All email triggers send correctly via Resend
- [ ] SMS placeholder is visible in settings but not functional

---

## ADDITIONAL RULES FOR THE AI

1. **Never skip steps.** If a step seems small, still do it properly.
2. **TypeScript everywhere.** No `any` types — define proper interfaces for all data models in a `/types` folder.
3. **Server components by default.** Only use `"use client"` when you genuinely need interactivity or browser APIs.
4. **Server Actions for mutations.** Use Next.js Server Actions (not API routes) for all form submissions and data mutations.
5. **Error handling.** Every async operation must have proper error handling with user-facing toast messages (use Sonner or the design skill's preferred toast library).
6. **Loading states.** Every data fetch must show a skeleton loader, never a blank screen.
7. **Supabase RLS.** Every table must have RLS enabled and policies that match the role permissions described above. Never disable RLS.
8. **PROGRESS.md.** Update this file at the end of every phase. It is your memory across sessions.
9. **Comments.** Every non-obvious function must have a JSDoc comment explaining what it does and why.
10. **Follow the design skill strictly.** It overrides any default choices you would otherwise make about UI.

---

## START COMMAND

Begin with Phase 1. Read the design skill file first. Acknowledge what you have read. Then proceed step by step.
