import { Applications } from '@/lib/db';
import { RegistrarRequestsClient } from './registrar-requests-client';
import type { LeaveApplicationWithRelations } from '@/types';

export default async function RegistrarRequestsPage() {
  const applications = await Applications.byStatus('hod_approved');
  return <RegistrarRequestsClient applications={applications} />;
}
