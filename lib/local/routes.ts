import type { UserRole } from '@/types';

/**
 * Resolve a user role to its dashboard route. Mirrors the previous
 * `dashboardPathFor` from `lib/auth.ts`, which is removed during the
 * localStorage migration.
 */
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
    default:
      return '/dashboard/staff';
  }
}