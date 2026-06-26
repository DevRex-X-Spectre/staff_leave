import 'server-only';
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
import {
  departments as seedDepartments,
  leaveApplications as seedApps,
  leaveApprovals as seedApprovals,
  leaveEntitlements as seedEntitlements,
  leaveRotas as seedRotas,
  leaveTypes as seedLeaveTypes,
  notifications as seedNotifications,
  rotaSlots as seedSlots,
  userApprovalRequests as seedUAR,
  users as seedUsers,
} from './data';

/**
 * In-memory mutable store. One per server process. Lives only for the
 * lifetime of the dev server / serverless instance — perfect for demo mode.
 *
 * Every DAL function in lib/data/* branches on isDemoMode() and uses
 * the read/write helpers below instead of touching Supabase.
 */

type Store = {
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

// On hot-reload the store resets — re-seed each time.
const store: Store = {
  users: structuredClone(seedUsers),
  departments: structuredClone(seedDepartments),
  leaveTypes: structuredClone(seedLeaveTypes),
  leaveEntitlements: structuredClone(seedEntitlements),
  leaveApplications: structuredClone(seedApps),
  leaveApprovals: structuredClone(seedApprovals),
  leaveRotas: structuredClone(seedRotas),
  rotaSlots: structuredClone(seedSlots),
  notifications: structuredClone(seedNotifications),
  userApprovalRequests: structuredClone(seedUAR),
};

// ---------- helpers ----------

let counter = 1000;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ---------- users ----------
export const Users = {
  all: () => store.users.slice(),
  byId: (id: string) => store.users.find((u) => u.id === id) ?? null,
  byEmail: (email: string) =>
    store.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
  insert: (u: User) => {
    store.users.push(u);
    return u;
  },
  update: (id: string, patch: Partial<User>) => {
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    store.users[idx] = { ...store.users[idx], ...patch, updated_at: nowIso() };
    return store.users[idx];
  },
};

// ---------- departments ----------
export const Departments = {
  all: () => store.departments.slice(),
  byId: (id: string) => store.departments.find((d) => d.id === id) ?? null,
  insert: (d: Omit<Department, 'id' | 'created_at'>) => {
    const row: Department = { id: nextId('dept'), created_at: nowIso(), ...d };
    store.departments.push(row);
    return row;
  },
  update: (id: string, patch: Partial<Department>) => {
    const idx = store.departments.findIndex((d) => d.id === id);
    if (idx < 0) return null;
    store.departments[idx] = { ...store.departments[idx], ...patch };
    return store.departments[idx];
  },
  remove: (id: string) => {
    const idx = store.departments.findIndex((d) => d.id === id);
    if (idx < 0) return false;
    store.departments.splice(idx, 1);
    return true;
  },
};

// ---------- leave types ----------
export const LeaveTypes = {
  all: () => store.leaveTypes.slice(),
  active: () => store.leaveTypes.filter((lt) => lt.is_active),
  byId: (id: string) => store.leaveTypes.find((lt) => lt.id === id) ?? null,
  insert: (lt: Omit<LeaveType, 'id' | 'created_at'>) => {
    const row: LeaveType = { id: nextId('lt'), created_at: nowIso(), ...lt };
    store.leaveTypes.push(row);
    return row;
  },
  update: (id: string, patch: Partial<LeaveType>) => {
    const idx = store.leaveTypes.findIndex((lt) => lt.id === id);
    if (idx < 0) return null;
    store.leaveTypes[idx] = { ...store.leaveTypes[idx], ...patch };
    return store.leaveTypes[idx];
  },
};

// ---------- entitlements ----------
export const Entitlements = {
  byUser: (userId: string, year: number = new Date().getFullYear()) =>
    store.leaveEntitlements.filter(
      (e) => e.user_id === userId && e.year === year
    ),
  byId: (id: string) => store.leaveEntitlements.find((e) => e.id === id) ?? null,
  update: (id: string, patch: Partial<LeaveEntitlement>) => {
    const idx = store.leaveEntitlements.findIndex((e) => e.id === id);
    if (idx < 0) return null;
    store.leaveEntitlements[idx] = { ...store.leaveEntitlements[idx], ...patch };
    return store.leaveEntitlements[idx];
  },
  insert: (e: Omit<LeaveEntitlement, 'id' | 'created_at'>) => {
    const row: LeaveEntitlement = {
      id: nextId('ent'),
      created_at: nowIso(),
      ...e,
    };
    store.leaveEntitlements.push(row);
    return row;
  },
  all: () => store.leaveEntitlements.slice(),
};

// ---------- applications ----------
export const Applications = {
  all: () => store.leaveApplications.slice(),
  byId: (id: string) => store.leaveApplications.find((a) => a.id === id) ?? null,
  byUser: (userId: string) =>
    store.leaveApplications.filter((a) => a.applicant_id === userId),
  byDepartment: (deptId: string) =>
    store.leaveApplications.filter((a) => a.department_id === deptId),
  byStatus: (...statuses: string[]) =>
    store.leaveApplications.filter((a) => statuses.includes(a.status)),
  insert: (a: Omit<LeaveApplication, 'id' | 'created_at' | 'updated_at'>) => {
    const row: LeaveApplication = {
      id: nextId('app'),
      created_at: nowIso(),
      updated_at: nowIso(),
      ...a,
    };
    store.leaveApplications.push(row);
    return row;
  },
  update: (id: string, patch: Partial<LeaveApplication>) => {
    const idx = store.leaveApplications.findIndex((a) => a.id === id);
    if (idx < 0) return null;
    store.leaveApplications[idx] = {
      ...store.leaveApplications[idx],
      ...patch,
      updated_at: nowIso(),
    };
    return store.leaveApplications[idx];
  },
};

// ---------- approvals (audit) ----------
export const Approvals = {
  byApplication: (appId: string) =>
    store.leaveApprovals.filter((a) => a.application_id === appId),
  insert: (a: Omit<LeaveApproval, 'id' | 'decided_at'>) => {
    const row: LeaveApproval = {
      id: nextId('appr'),
      decided_at: nowIso(),
      ...a,
    };
    store.leaveApprovals.push(row);
    return row;
  },
};

// ---------- rotas ----------
export const Rotas = {
  all: () => store.leaveRotas.slice(),
  byDepartment: (deptId: string) =>
    store.leaveRotas.filter((r) => r.department_id === deptId),
  byId: (id: string) => store.leaveRotas.find((r) => r.id === id) ?? null,
  insert: (r: Omit<LeaveRota, 'id' | 'published_at'>) => {
    const row: LeaveRota = {
      id: nextId('rota'),
      published_at: nowIso(),
      ...r,
    };
    store.leaveRotas.push(row);
    return row;
  },
  remove: (id: string) => {
    const idx = store.leaveRotas.findIndex((r) => r.id === id);
    if (idx < 0) return false;
    store.leaveRotas.splice(idx, 1);
    return true;
  },
};

export const Slots = {
  byRota: (rotaId: string) => store.rotaSlots.filter((s) => s.rota_id === rotaId),
  byDepartment: (deptId: string) => {
    const rotaIds = store.leaveRotas
      .filter((r) => r.department_id === deptId)
      .map((r) => r.id);
    return store.rotaSlots.filter((s) => rotaIds.includes(s.rota_id));
  },
  insert: (s: Omit<RotaSlot, 'id' | 'created_at'>) => {
    const row: RotaSlot = {
      id: nextId('slot'),
      created_at: nowIso(),
      ...s,
    };
    store.rotaSlots.push(row);
    return row;
  },
};

// ---------- notifications ----------
export const Notifications = {
  all: () => store.notifications.slice(),
  byUser: (userId: string) =>
    store.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  unreadCount: (userId: string) =>
    store.notifications.filter((n) => n.user_id === userId && !n.is_read).length,
  insert: (n: Omit<Notification, 'id' | 'created_at'>) => {
    const row: Notification = {
      id: nextId('notif'),
      created_at: nowIso(),
      ...n,
    };
    store.notifications.push(row);
    return row;
  },
  markAllRead: (userId: string) => {
    store.notifications.forEach((n) => {
      if (n.user_id === userId) n.is_read = true;
    });
  },
  markRead: (id: string) => {
    const n = store.notifications.find((n) => n.id === id);
    if (n) n.is_read = true;
  },
};

// ---------- user approval requests ----------
export const UAR = {
  all: () => store.userApprovalRequests.slice(),
  byId: (id: string) =>
    store.userApprovalRequests.find((u) => u.id === id) ?? null,
  byStatus: (status: 'pending' | 'approved' | 'rejected') =>
    store.userApprovalRequests.filter((u) => u.status === status),
  insert: (u: Omit<UserApprovalRequest, 'id' | 'created_at'>) => {
    const row: UserApprovalRequest = {
      id: nextId('uar'),
      created_at: nowIso(),
      ...u,
    };
    store.userApprovalRequests.push(row);
    return row;
  },
  update: (id: string, patch: Partial<UserApprovalRequest>) => {
    const idx = store.userApprovalRequests.findIndex((u) => u.id === id);
    if (idx < 0) return null;
    store.userApprovalRequests[idx] = { ...store.userApprovalRequests[idx], ...patch };
    return store.userApprovalRequests[idx];
  },
};