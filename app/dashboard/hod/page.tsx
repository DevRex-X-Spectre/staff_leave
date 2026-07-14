import { auth } from '@/auth';
import { Applications, Departments } from '@/lib/db';
import { HodDashboardClient } from './hod-dashboard-client';
import type {
  Department,
  LeaveApplicationWithRelations,
} from '@/types';

export default async function HodDashboardPage() {
  const session = await auth();
  const departmentId = session?.user?.departmentId ?? '';

  const [department, allApps, pendingApps] = await Promise.all([
    Departments.byId(departmentId),
    Applications.byDepartment(departmentId),
    Applications.byDepartmentAndStatus(departmentId, ['pending']),
  ]);

  return (
    <HodDashboardClient
      department={department}
      pendingApps={pendingApps}
      allApps={allApps}
    />
  );
}
