import { Departments, Users } from '@/lib/db';
import { AdminDepartmentsClient } from './departments-client';
import type { Department, User } from '@/types';

export default async function AdminDepartmentsPage() {
  const [departments, allUsers] = await Promise.all([
    Departments.all(),
    Users.all(),
  ]);
  // HOD candidates for the assign-HOD dropdown.
  const hods: User[] = allUsers.filter((u) => u.role === 'hod' && u.is_active);

  return (
    <AdminDepartmentsClient
      departments={departments}
      hods={hods}
    />
  );
}