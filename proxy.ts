import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

/**
 * Edge proxy (Next.js 16 renamed `middleware` to `proxy`). Builds a NextAuth
 * instance from the edge-safe config ONLY (the Credentials provider lives in
 * auth.ts on the Node runtime). The `authorized` callback in authConfig
 * handles:
 *   - unauthenticated users hitting /dashboard/* -> /login
 *   - authenticated users hitting / or /login -> their role dashboard
 *
 * Finer checks (pending-approval gate, role-vs-route mismatch) run in the
 * dashboard layout (Server Component) where the full session + DB are available.
 *
 * The auth function is extracted to a plain const and re-exported as `proxy`
 * (rather than `export const { auth: proxy }`) so Next.js 16's proxy-file
 * static analysis recognises the named `proxy` export.
 */
const { auth: authHandler } = NextAuth(authConfig);

export { authHandler as proxy };

// Skip static assets / auth API routes.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$|api/auth).*)'],
};
