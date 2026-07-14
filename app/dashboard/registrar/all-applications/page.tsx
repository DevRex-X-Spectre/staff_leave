import { Applications, Approvals, Departments } from '@/lib/db';
import { RegistrarAllApplicationsClient } from './all-applications-client';
import type { LeaveApproval, LeaveApplicationWithRelations } from '@/types';

export default async function RegistrarAllApplicationsPage() {
  const [applications, departments] = await Promise.all([
    Applications.all(),
    Departments.all(),
  ]);
  const approvalEntries = await Promise.all(
    applications.map(async (application) => [
      application.id,
      await Approvals.byApplication(application.id),
    ] as const)
  );
  const approvalsByApplication: Record<string, LeaveApproval[]> = Object.fromEntries(approvalEntries);

  return (
    <RegistrarAllApplicationsClient
      applications={applications}
      departments={departments}
      approvalsByApplication={approvalsByApplication}
    />
  );
}
