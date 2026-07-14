import { auth } from '@/auth';
import { Slots, Users } from '@/lib/db';
import { StaffRotaClient } from './staff-rota-client';
import type { RotaSlot } from '@/types';

export default async function StaffRotaPage() {
  const session = await auth();
  const departmentId = session?.user?.departmentId ?? '';

  const [slots, deptUsers] = await Promise.all([
    Slots.byDepartment(departmentId),
    Users.byDepartment(departmentId),
  ]);

  const departmentSize = deptUsers.filter((u) => u.is_active && u.is_approved).length;

  return <StaffRotaClient slots={slots} departmentId={departmentId} departmentSize={departmentSize} />;
}
