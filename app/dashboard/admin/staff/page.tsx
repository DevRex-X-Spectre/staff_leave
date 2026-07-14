import { Departments, Users } from '@/lib/db';
import { AdminStaffClient } from './staff-client';
import type { Department, User } from '@/types';

export default async function AdminStaffPage() {
  const [allUsers, departments] = await Promise.all([
    Users.all(),
    Departments.all(),
  ]);

  return (
    <AdminStaffClient users={allUsers} departments={departments} />
  );
}
