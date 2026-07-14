import 'server-only';
import { auth } from '@/auth';
import type { UserRole } from '@/types';

/** The subset of the session user the data/actions layer needs. */
export type SessionUser = {
  id: string;
  role: UserRole;
  staffId: string | null;
  staffType: 'academic' | 'non_academic';
  staffGrade: 'senior' | 'junior' | null;
  rank: string | null;
  departmentId: string | null;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id) return null;
  return {
    id: u.id,
    role: u.role,
    staffId: u.staffId,
    staffType: u.staffType,
    staffGrade: u.staffGrade,
    rank: u.rank,
    departmentId: u.departmentId,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error('Not authenticated.');
  return u;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const u = await requireUser();
  if (!roles.includes(u.role)) {
    throw new Error('You do not have permission to perform this action.');
  }
  return u;
}

/** Ensure the acting user belongs to the same department as the resource. */
export function requireSameDepartment(user: SessionUser, deptId: string | null | undefined): void {
  if (!deptId || user.departmentId !== deptId) {
    throw new Error('You can only access resources in your own department.');
  }
}
