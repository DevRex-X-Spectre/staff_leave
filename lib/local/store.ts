'use client';

import type {
  Department,
  LeaveApplication,
  LeaveApplicationWithRelations,
  LeaveApproval,
  LeaveBalance,
  LeaveEntitlement,
  LeaveRota,
  LeaveType,
  Notification,
  RotaSlot,
  User,
  UserApprovalRequest,
  UserApprovalRequestWithRelations,
} from '@/types';
import {
  CURRENT_USER_KEY,
  DATA_KEY,
  DEMO_COOKIE_NAME,
  DEMO_ROLE_COOKIE_NAME,
  PASSWORDS_KEY,
  STORE_SCHEMA_VERSION,
} from './constants';
import { getSeed, getSeedPasswords } from './seed';

/**
 * Client-side localStorage-backed store. Mirrors `lib/mock/store.ts` 1:1 so the
 * eventual Supabase migration is a single-file swap.
 *
 * Persistence model:
 *   - One JSON blob at `naub-lms-data` holds the full Store.
 *   - A second key `naub-lms-passwords` holds Record<userId, password>.
 *   - `naub-lms-current-user` tracks the signed-in user.
 *   - On every mutation, `version` increments and the data is re-written.
 *
 * Reactivity:
 *   - Hooks in `lib/local/data-hooks.ts` subscribe to `version` via
 *     `useSyncExternalStore` and re-render consumers on every write.
 */

// ---------- types ----------

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

// ---------- module state ----------

const EMPTY_STORE: Store = {
  users: [],
  departments: [],
  leaveTypes: [],
  leaveEntitlements: [],
  leaveApplications: [],
  leaveApprovals: [],
  leaveRotas: [],
  rotaSlots: [],
  notifications: [],
  userApprovalRequests: [],
};

let counter = 1000;
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Increments on every mutation; consumed by useStoreVersion. */
let version = 0;
function bumpVersion() {
  version += 1;
}

// ---------- read/write helpers ----------

function readStore(): Store {
  if (typeof window === 'undefined') return EMPTY_STORE;
  const raw = window.localStorage.getItem(DATA_KEY);
  if (!raw) {
    // First load - seed from defaults.
    const s = getSeed();
    writeStore(s);
    writePasswords(getSeedPasswords());
    return s;
  }
  try {
    const parsed = JSON.parse(raw) as { version?: number; data: Store };
    // Future-proof: if the schema version changes we could migrate here.
    if (!parsed || !parsed.data) return EMPTY_STORE;
    return parsed.data;
  } catch {
    return EMPTY_STORE;
  }
}

function writeStore(s: Store) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    DATA_KEY,
    JSON.stringify({ version: STORE_SCHEMA_VERSION, data: s })
  );
}

function readPasswords(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const raw = window.localStorage.getItem(PASSWORDS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function writePasswords(map: Record<string, string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map));
}

/** Internal: load + mutate + persist + bump version, in one call. */
function mutate<T>(fn: (s: Store) => T): T {
  const s = readStore();
  const result = fn(s);
  writeStore(s);
  bumpVersion();
  return result;
}

// ---------- public version hook helper ----------

/**
 * Subscribe to the store version. Used by data-hooks.ts via useSyncExternalStore.
 */
export function getStoreVersion(): number {
  return version;
}

// ---------- hydration ----------

/**
 * Ensure localStorage is seeded. Idempotent. Safe to call from a useEffect.
 * Returns the version after hydration so the caller can compare.
 */
export function hydrateStore(): number {
  if (typeof window === 'undefined') return version;
  readStore(); // seeds if empty
  return version;
}

// ---------- users ----------

export const Users = {
  all: () => readStore().users.slice(),
  byId: (id: string) =>
    readStore().users.find((u) => u.id === id) ?? null,
  byEmail: (email: string) => {
    const e = email.toLowerCase();
    return readStore().users.find((u) => u.email.toLowerCase() === e) ?? null;
  },
  byStaffId: (staffId: string) => {
    const s = staffId.trim().toLowerCase();
    return (
      readStore().users.find((u) => u.staff_id?.toLowerCase() === s) ?? null
    );
  },
  insert: (u: User) =>
    mutate((s) => {
      s.users.push(u);
      return u;
    }),
  update: (id: string, patch: Partial<User>) =>
    mutate((s) => {
      const idx = s.users.findIndex((u) => u.id === id);
      if (idx < 0) return null;
      s.users[idx] = { ...s.users[idx], ...patch, updated_at: nowIso() };
      return s.users[idx];
    }),
};

// ---------- departments ----------

export const Departments = {
  all: () =>
    readStore()
      .departments.slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
  byId: (id: string) =>
    readStore().departments.find((d) => d.id === id) ?? null,
  insert: (d: Omit<Department, 'id' | 'created_at'>) =>
    mutate((s) => {
      const row: Department = {
        id: nextId('dept'),
        created_at: nowIso(),
        ...d,
      };
      s.departments.push(row);
      return row;
    }),
  update: (id: string, patch: Partial<Department>) =>
    mutate((s) => {
      const idx = s.departments.findIndex((d) => d.id === id);
      if (idx < 0) return null;
      s.departments[idx] = { ...s.departments[idx], ...patch };
      return s.departments[idx];
    }),
  remove: (id: string) =>
    mutate((s) => {
      const idx = s.departments.findIndex((d) => d.id === id);
      if (idx < 0) return false;
      s.departments.splice(idx, 1);
      return true;
    }),
};

// ---------- leave types ----------

export const LeaveTypes = {
  all: () => readStore().leaveTypes.slice(),
  active: () => readStore().leaveTypes.filter((lt) => lt.is_active),
  byId: (id: string) =>
    readStore().leaveTypes.find((lt) => lt.id === id) ?? null,
  insert: (lt: Omit<LeaveType, 'id' | 'created_at'>) =>
    mutate((s) => {
      const row: LeaveType = {
        id: nextId('lt'),
        created_at: nowIso(),
        ...lt,
      };
      s.leaveTypes.push(row);
      return row;
    }),
  update: (id: string, patch: Partial<LeaveType>) =>
    mutate((s) => {
      const idx = s.leaveTypes.findIndex((lt) => lt.id === id);
      if (idx < 0) return null;
      s.leaveTypes[idx] = { ...s.leaveTypes[idx], ...patch };
      return s.leaveTypes[idx];
    }),
};

// ---------- entitlements ----------

export const Entitlements = {
  all: () => readStore().leaveEntitlements.slice(),
  byUser: (userId: string, year: number = new Date().getFullYear()) =>
    readStore().leaveEntitlements.filter(
      (e) => e.user_id === userId && e.year === year
    ),
  byId: (id: string) =>
    readStore().leaveEntitlements.find((e) => e.id === id) ?? null,
  update: (id: string, patch: Partial<LeaveEntitlement>) =>
    mutate((s) => {
      const idx = s.leaveEntitlements.findIndex((e) => e.id === id);
      if (idx < 0) return null;
      s.leaveEntitlements[idx] = { ...s.leaveEntitlements[idx], ...patch };
      return s.leaveEntitlements[idx];
    }),
  insert: (e: Omit<LeaveEntitlement, 'id' | 'created_at'>) =>
    mutate((s) => {
      const row: LeaveEntitlement = {
        id: nextId('ent'),
        created_at: nowIso(),
        ...e,
      };
      s.leaveEntitlements.push(row);
      return row;
    }),
};

// ---------- applications ----------

function hydrate(a: LeaveApplication): LeaveApplicationWithRelations {
  const s = readStore();
  const applicant = s.users.find((u) => u.id === a.applicant_id) ?? null;
  const leave_type = s.leaveTypes.find((lt) => lt.id === a.leave_type_id) ?? null;
  const department = s.departments.find((d) => d.id === a.department_id) ?? null;
  return { ...a, applicant, leave_type, department };
}

export const Applications = {
  all: () => readStore().leaveApplications.slice(),
  byId: (id: string) => {
    const a = readStore().leaveApplications.find((x) => x.id === id);
    return a ? hydrate(a) : null;
  },
  byUser: (userId: string) =>
    readStore()
      .leaveApplications.filter((a) => a.applicant_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(hydrate),
  byDepartment: (deptId: string) =>
    readStore()
      .leaveApplications.filter((a) => a.department_id === deptId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(hydrate),
  byStatus: (...statuses: string[]) =>
    readStore()
      .leaveApplications.filter((a) => statuses.includes(a.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(hydrate),
  byDepartmentAndStatus: (deptId: string, statuses: string[]) =>
    readStore()
      .leaveApplications.filter(
        (a) => a.department_id === deptId && statuses.includes(a.status)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(hydrate),
  byUserStatuses: (userId: string, statuses: string[]) =>
    readStore()
      .leaveApplications.filter(
        (a) => a.applicant_id === userId && statuses.includes(a.status)
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(hydrate),
  insert: (a: Omit<LeaveApplication, 'id' | 'created_at' | 'updated_at'>) =>
    mutate((s) => {
      const row: LeaveApplication = {
        id: nextId('app'),
        created_at: nowIso(),
        updated_at: nowIso(),
        ...a,
      };
      s.leaveApplications.push(row);
      return row;
    }),
  update: (id: string, patch: Partial<LeaveApplication>) =>
    mutate((s) => {
      const idx = s.leaveApplications.findIndex((a) => a.id === id);
      if (idx < 0) return null;
      s.leaveApplications[idx] = {
        ...s.leaveApplications[idx],
        ...patch,
        updated_at: nowIso(),
      };
      return s.leaveApplications[idx];
    }),
  /**
   * Computed leave balances for a user. Joins active leave types with their
   * entitlements, filters by the user's staff_type applicability, returns only
   * types where total_days > 0. Mirrors `getLeaveBalances` from the DAL.
   */
  leaveBalances(userId: string): LeaveBalance[] {
    const s = readStore();
    const user = s.users.find((u) => u.id === userId);
    if (!user) return [];
    const year = new Date().getFullYear();
    const ents = s.leaveEntitlements.filter(
      (e) => e.user_id === userId && e.year === year
    );
    return s.leaveTypes
      .filter((lt) => lt.is_active)
      .filter((lt) => lt.applicable_to === 'both' || lt.applicable_to === user.staff_type)
      .map<LeaveBalance | null>((lt) => {
        const ent = ents.find((e) => e.leave_type_id === lt.id);
        if (!ent || ent.total_days <= 0) return null;
        return {
          leave_type: lt,
          total_days: ent.total_days,
          used_days: ent.used_days,
          remaining_days: ent.total_days - ent.used_days,
        };
      })
      .filter((b): b is LeaveBalance => b !== null);
  },
};

// ---------- approvals (audit) ----------

export const Approvals = {
  byApplication: (appId: string) =>
    readStore()
      .leaveApprovals.filter((a) => a.application_id === appId)
      .sort((a, b) => b.decided_at.localeCompare(a.decided_at)),
  insert: (a: Omit<LeaveApproval, 'id' | 'decided_at'>) =>
    mutate((s) => {
      const row: LeaveApproval = {
        id: nextId('appr'),
        decided_at: nowIso(),
        ...a,
      };
      s.leaveApprovals.push(row);
      return row;
    }),
};

// ---------- rotas ----------

export const Rotas = {
  all: () => readStore().leaveRotas.slice(),
  byDepartment: (deptId: string) =>
    readStore()
      .leaveRotas.filter((r) => r.department_id === deptId)
      .sort((a, b) => b.period_start.localeCompare(a.period_start)),
  byId: (id: string) =>
    readStore().leaveRotas.find((r) => r.id === id) ?? null,
  insert: (r: Omit<LeaveRota, 'id' | 'published_at'>) =>
    mutate((s) => {
      const row: LeaveRota = {
        id: nextId('rota'),
        published_at: nowIso(),
        ...r,
      };
      s.leaveRotas.push(row);
      return row;
    }),
  remove: (id: string) =>
    mutate((s) => {
      const idx = s.leaveRotas.findIndex((r) => r.id === id);
      if (idx < 0) return false;
      s.leaveRotas.splice(idx, 1);
      return true;
    }),
};

export const Slots = {
  byRota: (rotaId: string) =>
    readStore().rotaSlots.filter((s) => s.rota_id === rotaId),
  byDepartment: (deptId: string) => {
    const s = readStore();
    const rotaIds = s.leaveRotas
      .filter((r) => r.department_id === deptId)
      .map((r) => r.id);
    return s.rotaSlots.filter((s) => rotaIds.includes(s.rota_id));
  },
  insert: (slot: Omit<RotaSlot, 'id' | 'created_at'>) =>
    mutate((s) => {
      const row: RotaSlot = {
        id: nextId('slot'),
        created_at: nowIso(),
        ...slot,
      };
      s.rotaSlots.push(row);
      return row;
    }),
};

// ---------- notifications ----------

export const Notifications = {
  all: () => readStore().notifications.slice(),
  byUser: (userId: string) =>
    readStore()
      .notifications.filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)),
  unreadCount: (userId: string) =>
    readStore().notifications.filter((n) => n.user_id === userId && !n.is_read)
      .length,
  insert: (n: Omit<Notification, 'id' | 'created_at'>) =>
    mutate((s) => {
      const row: Notification = {
        id: nextId('notif'),
        created_at: nowIso(),
        ...n,
      };
      s.notifications.push(row);
      return row;
    }),
  markAllRead: (userId: string) =>
    mutate((s) => {
      for (const n of s.notifications) {
        if (n.user_id === userId) n.is_read = true;
      }
      return true;
    }),
  markRead: (id: string) =>
    mutate((s) => {
      const n = s.notifications.find((x) => x.id === id);
      if (n) n.is_read = true;
      return n ?? null;
    }),
};

// ---------- user approval requests ----------

function hydrateUAR(
  u: UserApprovalRequest
): UserApprovalRequestWithRelations {
  const s = readStore();
  return {
    ...u,
    user: s.users.find((x) => x.id === u.user_id) ?? null,
    department:
      s.departments.find((d) => d.id === u.requested_department_id) ?? null,
    reviewer:
      u.reviewed_by ? s.users.find((x) => x.id === u.reviewed_by) ?? null : null,
  };
}

export const UAR = {
  all: () => readStore().userApprovalRequests.slice(),
  byId: (id: string) => {
    const u = readStore().userApprovalRequests.find((x) => x.id === id);
    return u ? hydrateUAR(u) : null;
  },
  byStatus: (status: 'pending' | 'approved' | 'rejected') =>
    readStore()
      .userApprovalRequests.filter((u) => u.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(hydrateUAR),
  insert: (u: Omit<UserApprovalRequest, 'id' | 'created_at'>) =>
    mutate((s) => {
      const row: UserApprovalRequest = {
        id: nextId('uar'),
        created_at: nowIso(),
        ...u,
      };
      s.userApprovalRequests.push(row);
      return row;
    }),
  update: (id: string, patch: Partial<UserApprovalRequest>) =>
    mutate((s) => {
      const idx = s.userApprovalRequests.findIndex((u) => u.id === id);
      if (idx < 0) return null;
      s.userApprovalRequests[idx] = {
        ...s.userApprovalRequests[idx],
        ...patch,
      };
      return s.userApprovalRequests[idx];
    }),
};

// ---------- password helpers ----------

/**
 * Look up a user's password. The passwords are stored in a parallel map
 * keyed by user id (NOT on the User object), matching the design split
 * used by the seed data and the future Supabase auth.users table.
 */
export const Passwords = {
  get: (userId: string): string | null => {
    const map = readPasswords();
    return map[userId] ?? null;
  },
  set: (userId: string, password: string) => {
    const map = readPasswords();
    map[userId] = password;
    writePasswords(map);
    bumpVersion();
  },
  has: (userId: string): boolean => {
    return readPasswords()[userId] !== undefined;
  },
};

// ---------- session helpers (mirrored to cookies for middleware) ----------

/**
 * Read or write the currently signed-in user id. Mirrored to a non-httpOnly
 * cookie so middleware.ts can keep gating /dashboard/* on the cookie value.
 */
export const Session = {
  getUserId: (): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(CURRENT_USER_KEY);
  },
  set: (user: User) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(CURRENT_USER_KEY, user.id);
    // Mirror to cookies so middleware.ts can read them.
    const oneWeek = 7 * 24 * 60 * 60;
    document.cookie = `${DEMO_COOKIE_NAME}=${encodeURIComponent(user.id)}; path=/; max-age=${oneWeek}; samesite=lax`;
    document.cookie = `${DEMO_ROLE_COOKIE_NAME}=${encodeURIComponent(user.role)}; path=/; max-age=${oneWeek}; samesite=lax`;
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(CURRENT_USER_KEY);
    document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${DEMO_ROLE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  },
};

// ---------- dev helpers ----------

/** Clear all localStorage and reload. Useful for "Reset demo data" button. */
export function resetDemoData() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DATA_KEY);
  window.localStorage.removeItem(PASSWORDS_KEY);
  window.localStorage.removeItem(CURRENT_USER_KEY);
  document.cookie = `${DEMO_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `${DEMO_ROLE_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  bumpVersion();
}