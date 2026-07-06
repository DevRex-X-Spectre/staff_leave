'use client';

import { useSyncExternalStore } from 'react';
import type {
  ApprovalRequestStatus,
  Department,
  LeaveApplicationWithRelations,
  LeaveBalance,
  LeaveStatus,
  LeaveType,
  Notification,
  RotaSlot,
  User,
  UserApprovalRequestWithRelations,
} from '@/types';
import {
  Applications,
  Approvals,
  Departments,
  Entitlements,
  LeaveTypes,
  Notifications,
  Rotas,
  Slots,
  UAR,
  Users,
  getStoreVersion,
} from './store';

/**
 * Every hook in this file subscribes to the store's `version` counter.
 * When a mutation increments the version, every consuming component
 * re-renders with fresh data.
 *
 * Use these hooks in client components only.
 */

function useStoreVersion(): number {
  return useSyncExternalStore(
    (cb) => {
      // No-op listener: the version counter is queried on every render,
      // and the snapshot returned is the integer itself. React's
      // `useSyncExternalStore` calls getSnapshot() during render and
      // compares to the previous value to decide whether to re-render.
      return () => {};
    },
    getStoreVersion,
    () => 0 // SSR snapshot
  );
}

// ---------- Users ----------

export function useUsers(): User[] {
  useStoreVersion();
  return Users.all().sort((a, b) => a.full_name.localeCompare(b.full_name));
}

export function useUser(id: string | null | undefined): User | null {
  useStoreVersion();
  return id ? Users.byId(id) : null;
}

// ---------- Departments ----------

export function useDepartments(): Department[] {
  useStoreVersion();
  return Departments.all();
}

export function useDepartment(id: string | null | undefined): Department | null {
  useStoreVersion();
  return id ? Departments.byId(id) : null;
}

// ---------- Leave types ----------

export function useLeaveTypes(): LeaveType[] {
  useStoreVersion();
  return LeaveTypes.all().sort((a, b) => a.name.localeCompare(b.name));
}

export function useActiveLeaveTypes(): LeaveType[] {
  useStoreVersion();
  return LeaveTypes.active().sort((a, b) => a.name.localeCompare(b.name));
}

export function useLeaveType(id: string | null | undefined): LeaveType | null {
  useStoreVersion();
  return id ? LeaveTypes.byId(id) : null;
}

// ---------- Entitlements & balances ----------

export function useLeaveBalances(userId: string | null | undefined): LeaveBalance[] {
  useStoreVersion();
  if (!userId) return [];
  return Applications.leaveBalances(userId);
}

export function useEntitlementsForUser(
  userId: string | null | undefined,
  year?: number
) {
  useStoreVersion();
  if (!userId) return [];
  return Entitlements.byUser(userId, year);
}

// ---------- Applications ----------

export type ApplicationFilter = {
  applicantId?: string;
  departmentId?: string;
  status?: LeaveStatus[];
};

export function useApplications(
  filter: ApplicationFilter = {}
): LeaveApplicationWithRelations[] {
  useStoreVersion();
  const { applicantId, departmentId, status } = filter;
  let result: LeaveApplicationWithRelations[];

  if (applicantId && status) {
    result = Applications.byUserStatuses(applicantId, status);
  } else if (departmentId && status) {
    result = Applications.byDepartmentAndStatus(departmentId, status);
  } else if (applicantId) {
    result = Applications.byUser(applicantId);
  } else if (departmentId) {
    result = Applications.byDepartment(departmentId);
  } else if (status) {
    result = Applications.byStatus(...status);
  } else {
    result = Applications.all()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((a) => Applications.byId(a.id)!)
      .filter(Boolean);
  }

  return result;
}

export function useApplication(
  id: string | null | undefined
): LeaveApplicationWithRelations | null {
  useStoreVersion();
  return id ? Applications.byId(id) : null;
}

export function useApprovalsForApplication(applicationId: string | null | undefined) {
  useStoreVersion();
  if (!applicationId) return [];
  return Approvals.byApplication(applicationId);
}

// ---------- Notifications ----------

export function useNotifications(userId: string | null | undefined): Notification[] {
  useStoreVersion();
  if (!userId) return [];
  return Notifications.byUser(userId);
}

export function useUnreadCount(userId: string | null | undefined): number {
  useStoreVersion();
  if (!userId) return 0;
  return Notifications.unreadCount(userId);
}

// ---------- Rotas ----------

export function useRotasByDepartment(departmentId: string | null | undefined) {
  useStoreVersion();
  if (!departmentId) return [];
  return Rotas.byDepartment(departmentId);
}

export function useRotaSlotsByDepartment(
  departmentId: string | null | undefined
): RotaSlot[] {
  useStoreVersion();
  if (!departmentId) return [];
  return Slots.byDepartment(departmentId);
}

// ---------- User approval requests ----------

export function useApprovalRequests(
  status?: ApprovalRequestStatus
): UserApprovalRequestWithRelations[] {
  useStoreVersion();
  if (status) return UAR.byStatus(status);
  return UAR.all()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((u) => UAR.byId(u.id)!)
    .filter(Boolean);
}

// ---------- Counts (useful for dashboard summary cards) ----------

export function useStaffCount(departmentId?: string): number {
  useStoreVersion();
  if (departmentId) {
    return Users.all().filter((u) => u.department_id === departmentId).length;
  }
  return Users.all().filter((u) => u.role === 'staff').length;
}