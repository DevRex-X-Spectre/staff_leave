import { auth } from '@/auth';
import { Applications } from '@/lib/db';
import { HodRequestsClient } from './hod-requests-client';
import type { LeaveApplicationWithRelations } from '@/types';

export default async function HodRequestsPage() {
  const session = await auth();
  const departmentId = session?.user?.departmentId ?? '';

  const apps = await Applications.byDepartmentAndStatus(departmentId, ['pending']);

  return <HodRequestsClient applications={apps} />;
}
