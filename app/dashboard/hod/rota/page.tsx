import { auth } from '@/auth';
import { LeaveTypes, Users } from '@/lib/db';
import { HodRotaClient } from './hod-rota-client';
import type { LeaveType, User } from '@/types';

export default async function HodRotaPage() {
  const session = await auth();
  const departmentId = session?.user?.departmentId ?? '';

  const [deptUsers, leaveTypes] = await Promise.all([
    Users.byDepartment(departmentId),
    LeaveTypes.active(),
  ]);

  // Department staff (non-admin) for the slot picker.
  const deptStaff: User[] = deptUsers.filter((u) => u.role === 'staff');

  return (
    <HodRotaClient
      departmentId={departmentId}
      deptStaff={deptStaff}
      leaveTypes={leaveTypes}
    />
  );
}
