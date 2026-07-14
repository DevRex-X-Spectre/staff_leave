import { auth } from '@/auth';
import { Applications, Approvals } from '@/lib/db';
import { MyLeavesClient } from './my-leaves-client';
import type { LeaveApproval, LeaveApplicationWithRelations } from '@/types';

export default async function MyLeavesPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const applications = await Applications.byUser(userId);
  const approvalEntries = await Promise.all(
    applications.map(async (application) => [
      application.id,
      await Approvals.byApplication(application.id),
    ] as const)
  );
  const approvalsByApplication: Record<string, LeaveApproval[]> = Object.fromEntries(approvalEntries);

  return <MyLeavesClient applications={applications} approvalsByApplication={approvalsByApplication} />;
}
