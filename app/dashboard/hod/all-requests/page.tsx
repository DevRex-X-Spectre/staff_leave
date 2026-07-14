import { auth } from '@/auth';
import { Applications } from '@/lib/db';
import { HodAllRequestsClient } from './all-requests-client';
import type { LeaveApplicationWithRelations } from '@/types';

export default async function HodAllRequestsPage() {
  const session = await auth();
  const departmentId = session?.user?.departmentId ?? '';
  const applications = await Applications.byDepartment(departmentId);

  return <HodAllRequestsClient applications={applications} />;
}
