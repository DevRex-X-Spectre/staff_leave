/**
 * Centralised application types. Keep narrow: only what the UI consumes.
 * Source-of-truth table shapes live in supabase/migrations/001_initial_schema.sql.
 */

export type UserRole = 'admin' | 'hod' | 'hr_manager' | 'staff';
export type StaffType = 'academic' | 'non_academic';
/** Refinement for non-academic staff. Null for academic staff. Drives annual
 *  leave entitlement (senior = 30, junior = 21 working days). */
export type StaffGrade = 'senior' | 'junior';
export type LeaveStatus =
  | 'pending'
  | 'hod_approved'
  | 'approved'
  | 'hod_rejected'
  | 'rejected'
  | 'cancelled';

export type LeaveTypeApplicable = 'academic' | 'non_academic' | 'both';

export type ApprovalDecision = 'approved' | 'rejected' | 'forwarded';

export type NotificationType =
  | 'leave_submitted'
  | 'leave_approved'
  | 'leave_rejected'
  | 'rota_published'
  | 'account_approved'
  | 'general';

export type ApprovalRequestStatus = 'pending' | 'approved' | 'rejected';

export type Department = {
  id: string;
  name: string;
  hod_id: string | null;
  created_at: string;
};

export type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  staff_id: string | null;
  role: UserRole;
  staff_type: StaffType;
  /** Senior/junior level for non-academic staff. Null when academic. Drives
   *  the 30/21-day annual entitlement. */
  staff_grade: StaffGrade | null;
  /** Job title / academic rank (e.g. "Lecturer II", "Professor",
   *  "Assistant Registrar"). Snapshotted onto leave_applications.applicant_rank
   *  at apply time so historical applications retain the rank held then. */
  rank: string | null;
  department_id: string | null;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UserWithRelations = User & {
  department?: Department | null;
};

export type LeaveType = {
  id: string;
  name: string;
  applicable_to: LeaveTypeApplicable;
  max_days_academic: number | null;
  max_days_non_academic: number | null;
  requires_document: boolean;
  is_active: boolean;
  created_at: string;
};

export type LeaveEntitlement = {
  id: string;
  user_id: string;
  leave_type_id: string;
  year: number;
  total_days: number;
  used_days: number;
  created_at: string;
};

export type LeaveApplication = {
  id: string;
  applicant_id: string;
  leave_type_id: string;
  department_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  supporting_doc_url: string | null;
  status: LeaveStatus;
  rota_conflict: boolean;
  /** Staff nominated to cover the applicant's duties during this leave. */
  cover_staff_id: string | null;
  // FORM 1A + applicant-context snapshots, captured at apply time so the PDF
  // stays accurate even if the user later changes rank/department/name.
  /** FORM 1A Part I field 4: location during leave. Required for casual leave. */
  destination: string | null;
  /** Snapshot of users.rank at apply time (Registrar requires this). */
  applicant_rank: string | null;
  /** Snapshot of users.staff_id at apply time (Registrar requires this). */
  applicant_staff_id: string | null;
  /** Snapshot of users.full_name at apply time (for the FORM 1A PDF). */
  applicant_name: string | null;
  created_at: string;
  updated_at: string;
};

export type LeaveApplicationWithRelations = LeaveApplication & {
  applicant?: User | null;
  leave_type?: LeaveType | null;
  department?: Department | null;
  cover_staff?: User | null;
};

export type LeaveApproval = {
  id: string;
  application_id: string;
  approver_id: string;
  approver_role: UserRole;
  decision: ApprovalDecision;
  comment: string | null;
  /** FORM 1A finance decision (casual leave only).
   *  HOD records 'department' | 'applicant'; Registrar records 'university' | 'applicant'. */
  how_financed: 'department' | 'applicant' | 'university' | null;
  decided_at: string;
};

export type LeaveRota = {
  id: string;
  department_id: string;
  title: string;
  period_start: string;
  period_end: string;
  max_concurrent: number;
  published_by: string;
  published_at: string;
  notes: string | null;
};

export type RotaSlot = {
  id: string;
  rota_id: string;
  user_id: string;
  slot_start: string;
  slot_end: string;
  leave_type_id: string | null;
  created_at: string;
};

export type RotaSlotWithUser = RotaSlot & {
  user?: User | null;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_application_id: string | null;
  created_at: string;
};

export type UserApprovalRequest = {
  id: string;
  user_id: string;
  requested_role: UserRole;
  requested_department_id: string | null;
  status: ApprovalRequestStatus;
  admin_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type UserApprovalRequestWithRelations = UserApprovalRequest & {
  user?: User | null;
  department?: Department | null;
  reviewer?: User | null;
};

/** Row type used in the entitlements table UI. */
export type EntitlementRow = LeaveEntitlement & {
  user?: User | null;
  leave_type?: LeaveType | null;
};

/** Aggregated leave balance used on staff dashboards. */
export type LeaveBalance = {
  leave_type: LeaveType;
  total_days: number;
  used_days: number;
  remaining_days: number;
};

export type LeaveTrendPoint = {
  month: string; // YYYY-MM
  count: number;
};

export type ReportFilters = {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  staffType?: StaffType;
  leaveTypeId?: string;
  status?: LeaveStatus;
};

export type FormState<T = unknown> = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  data?: T;
};