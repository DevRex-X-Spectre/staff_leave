import { auth } from '@/auth';
import { Applications, Rotas, Slots } from '@/lib/db';
import { HodCalendarClient } from './hod-calendar-client';
import type {
  LeaveApplicationWithRelations,
  LeaveRota,
  RotaSlot,
} from '@/types';

export default async function HodCalendarPage() {
  const session = await auth();
  const departmentId = session?.user?.departmentId ?? '';

  const [applications, rotas, slots] = await Promise.all([
    Applications.byDepartment(departmentId),
    Rotas.byDepartment(departmentId),
    Slots.byDepartment(departmentId),
  ]);

  return (
    <HodCalendarClient
      applications={applications}
      rotas={rotas}
      slots={slots}
    />
  );
}
