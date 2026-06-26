import { requireRole } from '@/lib/auth';
import { listUsers, listEntitlementsForUser, listLeaveTypes } from '@/lib/data/dal';
import { EntitlementsClient } from './entitlements-client';

export default async function HrEntitlementsPage() {
  await requireRole('hr_manager', 'admin');

  const [users, leaveTypes] = await Promise.all([listUsers(), listLeaveTypes()]);
  const staff = users.filter((u) => u.role === 'staff' && u.is_active);

  const currentYear = new Date().getFullYear();
  const entitlementsMap: Record<string, Awaited<ReturnType<typeof listEntitlementsForUser>>> = {};
  await Promise.all(
    staff.map(async (u) => {
      entitlementsMap[u.id] = await listEntitlementsForUser(u.id, currentYear);
    })
  );

  return (
    <EntitlementsClient
      staff={staff}
      leaveTypes={leaveTypes}
      entitlementsMap={entitlementsMap}
      currentYear={currentYear}
    />
  );
}