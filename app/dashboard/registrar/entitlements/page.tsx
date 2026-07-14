import { Entitlements, LeaveTypes, Users } from '@/lib/db';
import { EntitlementsClient } from './entitlements-client';
import type { LeaveEntitlement, LeaveType, User } from '@/types';

export default async function EntitlementsPage() {
  const [allUsers, leaveTypes] = await Promise.all([
    Users.all(),
    LeaveTypes.active(),
  ]);

  const staff: User[] = allUsers.filter((u) => u.role === 'staff' && u.is_active);

  // Resolve entitlements for every staff member (server-side).
  const year = new Date().getFullYear();
  const entitlementsByUser: Record<string, LeaveEntitlement[]> = {};
  for (const u of staff) {
    entitlementsByUser[u.id] = await Entitlements.byUser(u.id, year);
  }

  // Distinct departments for the filter dropdown (use names where resolvable).
  const departmentIds = Array.from(
    new Set(
      staff
        .filter((u): u is User & { department_id: string } => u.department_id !== null)
        .map((u) => u.department_id)
    )
  );

  return (
    <EntitlementsClient
      staff={staff}
      leaveTypes={leaveTypes}
      entitlementsByUser={entitlementsByUser}
      departmentIds={departmentIds}
    />
  );
}