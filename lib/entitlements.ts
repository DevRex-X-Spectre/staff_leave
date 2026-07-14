import 'server-only';
import type { LeaveType, User } from '@/types';
import { Entitlements, LeaveTypes } from './db';

/**
 * Entitlement provisioning + grade-driven annual leave policy. Server-only,
 * backed by Supabase. Mirrors the previous localStorage helper so the
 * behaviour is identical.
 *
 * Annual leave (NAUB policy, working days):
 *   - academic            => 30
 *   - non-academic senior => 30
 *   - non-academic junior => 21
 */

export function annualLeaveDays(user: Pick<User, 'staff_type' | 'staff_grade'>): number {
  if (user.staff_type === 'academic') return 30;
  return user.staff_grade === 'senior' ? 30 : 21;
}

export function defaultTotalFor(
  user: Pick<User, 'staff_type' | 'staff_grade'>,
  leaveType: LeaveType
): number | null {
  if (leaveType.applicable_to !== 'both' && leaveType.applicable_to !== user.staff_type) {
    return null;
  }
  if (leaveType.id === 'lt-annual' || leaveType.name.toLowerCase() === 'annual leave') {
    return annualLeaveDays(user);
  }
  return user.staff_type === 'academic'
    ? leaveType.max_days_academic
    : leaveType.max_days_non_academic;
}

/**
 * Ensure the user has a leave_entitlements row for every active, applicable
 * leave type for the given year. Idempotent. Returns the count created.
 *
 * Note: leave type identity for "annual" is matched by name fallback so this
 * works whether the seeded annual type keeps its `lt-annual` id or not.
 */
export async function provisionEntitlementsForUser(
  user: User,
  year: number = new Date().getFullYear()
): Promise<number> {
  const existing = await Entitlements.byUser(user.id, year);
  const have = new Set(existing.map((e) => e.leave_type_id));
  let created = 0;
  for (const lt of await LeaveTypes.active()) {
    if (have.has(lt.id)) continue;
    const total = defaultTotalFor(user, lt);
    if (total === null || total <= 0) continue;
    await Entitlements.insert({
      user_id: user.id,
      leave_type_id: lt.id,
      year,
      total_days: total,
      used_days: 0,
    });
    created += 1;
  }
  return created;
}

/** Re-sync a user's annual entitlement total to their current grade. */
export async function resyncAnnualEntitlement(
  user: User,
  year: number = new Date().getFullYear()
): Promise<void> {
  const ents = await Entitlements.byUser(user.id, year);
  const types = await LeaveTypes.all();
  const annualType =
    types.find((t) => t.id === 'lt-annual') ??
    types.find((t) => t.name.toLowerCase() === 'annual leave');
  if (!annualType) return;
  const annual = ents.find((e) => e.leave_type_id === annualType.id);
  if (!annual) return;
  const target = annualLeaveDays(user);
  if (annual.total_days !== target) {
    await Entitlements.update(annual.id, { total_days: target });
  }
}
