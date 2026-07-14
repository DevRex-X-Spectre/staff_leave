import { auth } from '@/auth';
import { Applications, Departments } from '@/lib/db';
import { StaffDashboardClient } from './staff-dashboard-client';
import type { Department, LeaveApplicationWithRelations, LeaveBalance } from '@/types';

export default async function StaffDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';

  const [balances, applications, department] = await Promise.all([
    Applications.leaveBalances(userId),
    Applications.byUser(userId),
    Departments.byId(session?.user?.departmentId ?? ''),
  ]);

  return (
    <StaffDashboardClient
      userName={session?.user?.name ?? ''}
      department={department}
      balances={balances}
      applications={applications}
    />
  );
}
