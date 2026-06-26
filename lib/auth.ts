import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/utils';
import { getDemoSession } from '@/lib/mock/session';
import type { User, UserRole } from '@/types';

/**
 * Resolve the current session + user record. Memoised per React render
 * pass with React.cache() so multiple components on the same page share
 * the same DB hit. Returns null when not authenticated.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (isDemoMode()) {
    return getDemoSession();
  }
  const supabase = await getSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  if (error || !data) return null;
  return data as User;
});

/**
 * Resolve the current session and verify the user is approved + active.
 * Redirects to /login when not authenticated and /pending-approval when
 * authenticated but awaiting admin approval.
 */
export const requireUser = cache(async (): Promise<User> => {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!user.is_approved) redirect('/pending-approval');
  if (!user.is_active) redirect('/login');
  return user;
});

/**
 * Require one of the given roles. Redirects to the user's own dashboard
 * if they hold a different role.
 */
export const requireRole = cache(
  async (...allowed: UserRole[]): Promise<User> => {
    const user = await requireUser();
    if (!allowed.includes(user.role)) {
      redirect(`/dashboard/${user.role}`);
    }
    return user;
  }
);

/** Map role → dashboard home route. */
export function dashboardPathFor(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'hod':
      return '/dashboard/hod';
    case 'hr_manager':
      return '/dashboard/hr';
    case 'staff':
      return '/dashboard/staff';
  }
}