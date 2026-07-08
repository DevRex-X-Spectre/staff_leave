import type {
  Department,
  LeaveApplication,
  LeaveApproval,
  LeaveEntitlement,
  LeaveRota,
  LeaveType,
  Notification,
  RotaSlot,
  User,
  UserApprovalRequest,
} from '@/types';
import { DEFAULT_PASSWORD } from './constants';

/**
 * Seed dataset for the localStorage store. Mirrors `lib/mock/data.ts` exactly
 * so the eventual Supabase migration is a 1:1 swap.
 *
 * `passwords` is keyed by user id (not email) and assigns every seeded user
 * the same default password - changeable from each user's profile.
 */

export type SeedData = {
  users: User[];
  departments: Department[];
  leaveTypes: LeaveType[];
  leaveEntitlements: LeaveEntitlement[];
  leaveApplications: LeaveApplication[];
  leaveApprovals: LeaveApproval[];
  leaveRotas: LeaveRota[];
  rotaSlots: RotaSlot[];
  notifications: Notification[];
  userApprovalRequests: UserApprovalRequest[];
};

const departments: Department[] = [
  { id: 'dept-cs', name: 'Computer Science', hod_id: 'user-hod-cs', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dept-admin', name: 'Administration', hod_id: 'user-hod-admin', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dept-registry', name: 'Registry', hod_id: 'user-hod-registry', created_at: '2026-01-04T08:00:00Z' },
  { id: 'dept-maths', name: 'Mathematics', hod_id: null, created_at: '2026-01-04T08:00:00Z' },
  { id: 'dept-physics', name: 'Physics', hod_id: null, created_at: '2026-01-04T08:00:00Z' },
];

const users: User[] = [
  {
    id: 'user-admin',
    full_name: 'System Administrator',
    email: 'admin@naub.edu.ng',
    phone: '+234 800 000 0001',
    staff_id: 'NAUB/ADM/001',
    role: 'admin',
    staff_type: 'non_academic',
    department_id: 'dept-admin',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-01T08:00:00Z',
    updated_at: '2026-01-01T08:00:00Z',
  },
  {
    id: 'user-hr',
    full_name: 'Amina Bello',
    email: 'hr@naub.edu.ng',
    phone: '+234 800 000 0002',
    staff_id: 'NAUB/REG/001',
    role: 'hr_manager',
    staff_type: 'non_academic',
    department_id: 'dept-admin',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-02T08:00:00Z',
    updated_at: '2026-01-02T08:00:00Z',
  },
  {
    id: 'user-hod-cs',
    full_name: 'Dr. Chukwuma Okeke',
    email: 'hod.cs@naub.edu.ng',
    phone: '+234 800 000 0003',
    staff_id: 'NAUB/CS/001',
    role: 'hod',
    staff_type: 'academic',
    department_id: 'dept-cs',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-03T08:00:00Z',
    updated_at: '2026-01-03T08:00:00Z',
  },
  {
    id: 'user-hod-admin',
    full_name: 'Mrs. Funke Adeyemi',
    email: 'hod.admin@naub.edu.ng',
    phone: '+234 800 000 0004',
    staff_id: 'NAUB/ADM/002',
    role: 'hod',
    staff_type: 'non_academic',
    department_id: 'dept-admin',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-03T08:00:00Z',
    updated_at: '2026-01-03T08:00:00Z',
  },
  {
    id: 'user-hod-registry',
    full_name: 'Mr. Bashir Mohammed',
    email: 'hod.registry@naub.edu.ng',
    phone: '+234 800 000 0005',
    staff_id: 'NAUB/REG/001',
    role: 'hod',
    staff_type: 'non_academic',
    department_id: 'dept-registry',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-03T08:00:00Z',
    updated_at: '2026-01-03T08:00:00Z',
  },
  {
    id: 'user-staff-1',
    full_name: 'Engr. Samuel Adekunle',
    email: 'staff1@naub.edu.ng',
    phone: '+234 800 000 0010',
    staff_id: 'NAUB/CS/010',
    role: 'staff',
    staff_type: 'academic',
    department_id: 'dept-cs',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-04T08:00:00Z',
    updated_at: '2026-01-04T08:00:00Z',
  },
  {
    id: 'user-staff-2',
    full_name: 'Ms. Halima Yusuf',
    email: 'staff2@naub.edu.ng',
    phone: '+234 800 000 0011',
    staff_id: 'NAUB/CS/011',
    role: 'staff',
    staff_type: 'academic',
    department_id: 'dept-cs',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-04T08:00:00Z',
    updated_at: '2026-01-04T08:00:00Z',
  },
  {
    id: 'user-staff-3',
    full_name: 'Mr. Tunde Bakare',
    email: 'staff3@naub.edu.ng',
    phone: '+234 800 000 0012',
    staff_id: 'NAUB/ADM/010',
    role: 'staff',
    staff_type: 'non_academic',
    department_id: 'dept-admin',
    is_approved: true,
    is_active: true,
    created_at: '2026-01-04T08:00:00Z',
    updated_at: '2026-01-04T08:00:00Z',
  },
  {
    id: 'user-staff-pending',
    full_name: 'New Staff Applicant',
    email: 'new.applicant@naub.edu.ng',
    phone: '+234 800 000 0020',
    staff_id: 'NAUB/CS/099',
    role: 'staff',
    staff_type: 'academic',
    department_id: 'dept-cs',
    is_approved: false,
    is_active: true,
    created_at: '2026-06-20T08:00:00Z',
    updated_at: '2026-06-20T08:00:00Z',
  },
];

const leaveTypes: LeaveType[] = [
  { id: 'lt-annual', name: 'Annual Leave', applicable_to: 'both', max_days_academic: 21, max_days_non_academic: 21, requires_document: false, is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 'lt-sick', name: 'Sick Leave', applicable_to: 'both', max_days_academic: 14, max_days_non_academic: 14, requires_document: true, is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 'lt-casual', name: 'Casual Leave', applicable_to: 'both', max_days_academic: 7, max_days_non_academic: 7, requires_document: false, is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 'lt-maternity', name: 'Maternity Leave', applicable_to: 'non_academic', max_days_academic: null, max_days_non_academic: 90, requires_document: true, is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 'lt-paternity', name: 'Paternity Leave', applicable_to: 'both', max_days_academic: 7, max_days_non_academic: 7, requires_document: false, is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 'lt-study', name: 'Study Leave', applicable_to: 'academic', max_days_academic: 365, max_days_non_academic: null, requires_document: true, is_active: true, created_at: '2026-01-01T08:00:00Z' },
  { id: 'lt-compassionate', name: 'Compassionate Leave', applicable_to: 'both', max_days_academic: 7, max_days_non_academic: 7, requires_document: false, is_active: true, created_at: '2026-01-01T08:00:00Z' },
];

const CURRENT_YEAR = 2026;

const leaveEntitlements: LeaveEntitlement[] = [
  { id: 'ent-1', user_id: 'user-staff-1', leave_type_id: 'lt-annual', year: CURRENT_YEAR, total_days: 21, used_days: 5, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-2', user_id: 'user-staff-1', leave_type_id: 'lt-sick', year: CURRENT_YEAR, total_days: 14, used_days: 0, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-3', user_id: 'user-staff-1', leave_type_id: 'lt-casual', year: CURRENT_YEAR, total_days: 7, used_days: 2, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-4', user_id: 'user-staff-1', leave_type_id: 'lt-study', year: CURRENT_YEAR, total_days: 365, used_days: 0, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-5', user_id: 'user-staff-1', leave_type_id: 'lt-paternity', year: CURRENT_YEAR, total_days: 7, used_days: 0, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-6', user_id: 'user-staff-1', leave_type_id: 'lt-compassionate', year: CURRENT_YEAR, total_days: 7, used_days: 0, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-7', user_id: 'user-staff-2', leave_type_id: 'lt-annual', year: CURRENT_YEAR, total_days: 21, used_days: 10, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-8', user_id: 'user-staff-2', leave_type_id: 'lt-sick', year: CURRENT_YEAR, total_days: 14, used_days: 2, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-9', user_id: 'user-staff-2', leave_type_id: 'lt-casual', year: CURRENT_YEAR, total_days: 7, used_days: 1, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-10', user_id: 'user-staff-3', leave_type_id: 'lt-annual', year: CURRENT_YEAR, total_days: 21, used_days: 7, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-11', user_id: 'user-staff-3', leave_type_id: 'lt-sick', year: CURRENT_YEAR, total_days: 14, used_days: 0, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-12', user_id: 'user-staff-3', leave_type_id: 'lt-casual', year: CURRENT_YEAR, total_days: 7, used_days: 3, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-13', user_id: 'user-staff-3', leave_type_id: 'lt-maternity', year: CURRENT_YEAR, total_days: 90, used_days: 0, created_at: '2026-01-04T08:00:00Z' },
  { id: 'ent-14', user_id: 'user-hod-cs', leave_type_id: 'lt-annual', year: CURRENT_YEAR, total_days: 21, used_days: 3, created_at: '2026-01-03T08:00:00Z' },
  { id: 'ent-15', user_id: 'user-hod-admin', leave_type_id: 'lt-annual', year: CURRENT_YEAR, total_days: 21, used_days: 0, created_at: '2026-01-03T08:00:00Z' },
];

const leaveApplications: LeaveApplication[] = [
  { id: 'app-1', applicant_id: 'user-staff-1', leave_type_id: 'lt-annual', department_id: 'dept-cs', start_date: '2026-07-15', end_date: '2026-07-19', total_days: 5, reason: 'Annual family vacation.', supporting_doc_url: null, status: 'approved', rota_conflict: false, created_at: '2026-05-10T08:00:00Z', updated_at: '2026-05-15T10:00:00Z' },
  { id: 'app-2', applicant_id: 'user-staff-2', leave_type_id: 'lt-casual', department_id: 'dept-cs', start_date: '2026-07-08', end_date: '2026-07-08', total_days: 1, reason: 'Personal errand.', supporting_doc_url: null, status: 'hod_approved', rota_conflict: false, created_at: '2026-06-20T08:00:00Z', updated_at: '2026-06-22T11:00:00Z' },
  { id: 'app-3', applicant_id: 'user-staff-1', leave_type_id: 'lt-casual', department_id: 'dept-cs', start_date: '2026-07-02', end_date: '2026-07-03', total_days: 2, reason: 'Medical appointment.', supporting_doc_url: null, status: 'pending', rota_conflict: false, created_at: '2026-06-24T08:00:00Z', updated_at: '2026-06-24T08:00:00Z' },
  { id: 'app-4', applicant_id: 'user-staff-2', leave_type_id: 'lt-sick', department_id: 'dept-cs', start_date: '2026-05-04', end_date: '2026-05-05', total_days: 2, reason: 'Flu.', supporting_doc_url: null, status: 'approved', rota_conflict: false, created_at: '2026-05-04T07:00:00Z', updated_at: '2026-05-05T15:00:00Z' },
  { id: 'app-5', applicant_id: 'user-staff-3', leave_type_id: 'lt-casual', department_id: 'dept-admin', start_date: '2026-06-30', end_date: '2026-07-01', total_days: 2, reason: 'Family event.', supporting_doc_url: null, status: 'pending', rota_conflict: false, created_at: '2026-06-25T08:00:00Z', updated_at: '2026-06-25T08:00:00Z' },
];

const leaveApprovals: LeaveApproval[] = [
  { id: 'appr-1', application_id: 'app-1', approver_id: 'user-hod-cs', approver_role: 'hod', decision: 'approved', comment: 'Approved. Enjoy your leave.', decided_at: '2026-05-11T09:00:00Z' },
  { id: 'appr-2', application_id: 'app-1', approver_id: 'user-hr', approver_role: 'hr_manager', decision: 'approved', comment: 'Confirmed.', decided_at: '2026-05-15T10:00:00Z' },
  { id: 'appr-3', application_id: 'app-2', approver_id: 'user-hod-cs', approver_role: 'hod', decision: 'approved', comment: 'OK.', decided_at: '2026-06-22T11:00:00Z' },
  { id: 'appr-4', application_id: 'app-4', approver_id: 'user-hod-cs', approver_role: 'hod', decision: 'approved', comment: 'Get well.', decided_at: '2026-05-04T10:00:00Z' },
  { id: 'appr-5', application_id: 'app-4', approver_id: 'user-hr', approver_role: 'hr_manager', decision: 'approved', comment: null, decided_at: '2026-05-05T15:00:00Z' },
];

const leaveRotas: LeaveRota[] = [
  { id: 'rota-1', department_id: 'dept-cs', title: 'Q3 2026 Departmental Rota', period_start: '2026-07-01', period_end: '2026-09-30', max_concurrent: 2, published_by: 'user-hod-cs', published_at: '2026-06-15T10:00:00Z', notes: 'Maximum of 2 staff on leave at any time during the quarter.' },
];

const rotaSlots: RotaSlot[] = [
  { id: 'slot-1', rota_id: 'rota-1', user_id: 'user-staff-1', slot_start: '2026-07-15', slot_end: '2026-07-19', leave_type_id: 'lt-annual', created_at: '2026-06-15T10:00:00Z' },
  { id: 'slot-2', rota_id: 'rota-1', user_id: 'user-staff-2', slot_start: '2026-08-04', slot_end: '2026-08-08', leave_type_id: 'lt-annual', created_at: '2026-06-15T10:00:00Z' },
];

const notifications: Notification[] = [
  { id: 'notif-1', user_id: 'user-staff-1', title: 'Leave approved', message: 'Your annual leave request has been fully approved.', type: 'leave_approved', is_read: false, related_application_id: 'app-1', created_at: '2026-05-15T10:00:00Z' },
  { id: 'notif-2', user_id: 'user-hod-cs', title: 'New leave request', message: 'Engr. Samuel Adekunle applied for casual leave.', type: 'leave_submitted', is_read: false, related_application_id: 'app-3', created_at: '2026-06-24T08:00:00Z' },
  { id: 'notif-3', user_id: 'user-staff-1', title: 'Rota published', message: 'Q3 2026 Departmental Rota has been published.', type: 'rota_published', is_read: true, related_application_id: null, created_at: '2026-06-15T10:00:00Z' },
  { id: 'notif-4', user_id: 'user-admin', title: 'New account request', message: 'New Staff Applicant is awaiting your approval.', type: 'account_approved', is_read: false, related_application_id: null, created_at: '2026-06-20T08:00:00Z' },
];

const userApprovalRequests: UserApprovalRequest[] = [
  { id: 'uar-1', user_id: 'user-staff-pending', requested_role: 'staff', requested_department_id: 'dept-cs', status: 'pending', admin_comment: null, reviewed_by: null, reviewed_at: null, created_at: '2026-06-20T08:00:00Z' },
];

/**
 * Default seed. Every seeded user gets the same default password.
 * A `passwords` map is returned alongside the data; both go to localStorage.
 */
export function getSeed(): SeedData {
  return {
    users: structuredClone(users),
    departments: structuredClone(departments),
    leaveTypes: structuredClone(leaveTypes),
    leaveEntitlements: structuredClone(leaveEntitlements),
    leaveApplications: structuredClone(leaveApplications),
    leaveApprovals: structuredClone(leaveApprovals),
    leaveRotas: structuredClone(leaveRotas),
    rotaSlots: structuredClone(rotaSlots),
    notifications: structuredClone(notifications),
    userApprovalRequests: structuredClone(userApprovalRequests),
  };
}

/**
 * Default password map keyed by user id. Seeded users all share the same
 * default password; each can change theirs from /dashboard/profile.
 */
export function getSeedPasswords(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const u of users) {
    out[u.id] = DEFAULT_PASSWORD;
  }
  return out;
}