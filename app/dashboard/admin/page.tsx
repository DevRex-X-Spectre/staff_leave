import { Departments, LeaveTypes, UAR, Users } from '@/lib/db';
import { AdminDashboardClient } from './admin-dashboard-client';
import type {
  Department,
  LeaveType,
  User,
  UserApprovalRequestWithRelations,
} from '@/types';

export default async function AdminDashboardPage() {
  const [pending, allUsers, depts, leaveTypes] = await Promise.all([
    UAR.byStatus('pending'),
    Users.all(),
    Departments.all(),
    LeaveTypes.all(),
  ]);

  return (
    <AdminDashboardClient
      pending={pending}
      allUsers={allUsers}
      departments={depts}
      leaveTypes={leaveTypes}
    />
  );
}
