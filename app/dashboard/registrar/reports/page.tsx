import { Applications, Departments } from '@/lib/db';
import { RegistrarReportsClient } from './registrar-reports-client';
import type { Department, LeaveApplicationWithRelations } from '@/types';

export default async function RegistrarReportsPage() {
  const [applications, departments] = await Promise.all([
    Applications.all(),
    Departments.all(),
  ]);
  return (
    <RegistrarReportsClient
      applications={applications}
      departments={departments}
    />
  );
}