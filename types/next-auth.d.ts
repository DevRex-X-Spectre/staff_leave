import { DefaultSession } from 'next-auth';
import type { StaffGrade, StaffType, UserRole } from './index';

/**
 * Augment NextAuth's session/JWT/user types so the role, staff_id, grade and
 * department flow from the Credentials provider -> JWT -> Session.
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      staffId: string | null;
      staffType: StaffType;
      staffGrade: StaffGrade | null;
      rank: string | null;
      departmentId: string | null;
      isApproved: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    role: UserRole;
    staffId: string | null;
    staffType: StaffType;
    staffGrade: StaffGrade | null;
    rank: string | null;
    departmentId: string | null;
    isApproved: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: UserRole;
    staffId?: string | null;
    staffType?: StaffType;
    staffGrade?: StaffGrade | null;
    rank?: string | null;
    departmentId?: string | null;
    isApproved?: boolean;
  }
}
