import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authConfig } from './auth.config';
import { db } from './lib/db/client';
import type { StaffGrade, StaffType, UserRole } from './types';

/**
 * Full NextAuth instance (Node runtime). Exports `handlers` (mounted at
 * /api/auth/[...nextauth]), `auth()` (read the session in Server Components /
 * Server Actions), and the `signIn` / `signOut` server actions.
 *
 * Authentication is by Staff ID + bcrypt-hashed password. On success the user's
 * role / staff_id / grade / department / approval state are stashed on the JWT
 * and surfaced on `session.user`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        staffId: { label: 'Staff ID', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        const staffId = (creds?.staffId as string | undefined)?.trim();
        const password = creds?.password as string | undefined;
        if (!staffId || !password) return null;

        const { data: user, error } = await db()
          .from('users')
          .select(
            'id, full_name, email, staff_id, role, staff_type, staff_grade, rank, department_id, is_approved, is_active'
          )
          .ilike('staff_id', staffId)
          .maybeSingle();
        if (error || !user) return null;
        if (!user.is_active || !user.is_approved) return null;

        const { data: cred } = await db()
          .from('user_credentials')
          .select('password_hash')
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cred?.password_hash) return null;

        const ok = await bcrypt.compare(password, cred.password_hash);
        if (!ok) return null;

        return {
          id: user.id,
          name: user.full_name,
          email: user.email,
          role: user.role as UserRole,
          staffId: user.staff_id,
          staffType: user.staff_type as StaffType,
          staffGrade: (user.staff_grade ?? null) as StaffGrade | null,
          rank: (user.rank ?? null) as string | null,
          departmentId: user.department_id,
          isApproved: user.is_approved,
        };
      },
    }),
  ],
});
