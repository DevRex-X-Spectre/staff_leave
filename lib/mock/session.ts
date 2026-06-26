import 'server-only';
import { cookies } from 'next/headers';
import { Users } from './store';
import type { User } from '@/types';

const DEMO_COOKIE = 'naub-demo-user';

/**
 * Demo mode session — the current user ID is stored in an HttpOnly
 * cookie. The auth pages (login/register) set it on success.
 * Returns the seeded "admin" user by default so the dashboard is
 * immediately explorable without logging in.
 */
export async function getDemoSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const id = cookieStore.get(DEMO_COOKIE)?.value;
  if (id) {
    const u = Users.byId(id);
    if (u && u.is_approved && u.is_active) return u;
  }
  // Default the demo session to the admin user — clicking "Sign in"
  // on the login page simply re-affirms this identity via role buttons.
  return Users.byId('user-admin');
}

export async function setDemoSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
}

export const DEMO_COOKIE_NAME = DEMO_COOKIE;