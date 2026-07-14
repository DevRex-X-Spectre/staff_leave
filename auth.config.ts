import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe NextAuth config. Imported by middleware.ts (edge) and auth.ts
 * (Node). Contains the callbacks here - not in auth.ts - so the edge middleware
 * instance also maps role/staff_id/etc. from the JWT onto the session.
 *
 * The Credentials provider is declared in auth.ts only (Node runtime).
 */

export function roleToDashboard(role: string | undefined | null): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'hod':
      return '/dashboard/hod';
    case 'hr_manager':
      return '/dashboard/registrar';
    case 'staff':
      return '/dashboard/staff';
    default:
      return '/login';
  }
}

export const authConfig = {
  pages: { signIn: '/login' },
  providers: [], // added in auth.ts
  session: { strategy: 'jwt' },
  trustHost: true,
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const path = request.nextUrl.pathname;
      const isProtected = path.startsWith('/dashboard');

      if (isProtected && !isLoggedIn) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', path + request.nextUrl.search);
        return Response.redirect(url);
      }
      if (isLoggedIn && (path === '/login' || path === '/')) {
        const url = request.nextUrl.clone();
        url.pathname = roleToDashboard(auth.user.role);
        return Response.redirect(url);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id: string;
          role: string;
          staffId: string | null;
          staffType: string;
          staffGrade: string | null;
          rank: string | null;
          departmentId: string | null;
          isApproved: boolean;
        };
        token.id = u.id;
        (token as Record<string, unknown>).role = u.role;
        (token as Record<string, unknown>).staffId = u.staffId;
        (token as Record<string, unknown>).staffType = u.staffType;
        (token as Record<string, unknown>).staffGrade = u.staffGrade;
        (token as Record<string, unknown>).rank = u.rank;
        (token as Record<string, unknown>).departmentId = u.departmentId;
        (token as Record<string, unknown>).isApproved = u.isApproved;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as unknown as Record<string, unknown>;
      if (session.user) {
        const u = session.user as unknown as Record<string, unknown>;
        u.id = (t.id as string) ?? u.id;
        u.role = t.role;
        u.staffId = (t.staffId as string | null) ?? null;
        u.staffType = t.staffType;
        u.staffGrade = (t.staffGrade as string | null) ?? null;
        u.rank = (t.rank as string | null) ?? null;
        u.departmentId = (t.departmentId as string | null) ?? null;
        u.isApproved = (t.isApproved as boolean | undefined) ?? true;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
