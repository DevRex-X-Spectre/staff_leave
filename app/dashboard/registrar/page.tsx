import { Applications } from '@/lib/db';
import { RegistrarDashboardClient } from './registrar-dashboard-client';
import type { LeaveApplicationWithRelations } from '@/types';

export default async function RegistrarDashboardPage() {
  const applications = await Applications.all();
  return <RegistrarDashboardClient applications={applications} />;
}
