import { auth } from '@/auth';
import { Departments, Users } from '@/lib/db';
import { ProfileClient } from './profile-client';
import type { User, UserRole } from '@/types';

export default async function ProfilePage() {
  const session = await auth();
  const user: User | null = session?.user?.id ? await Users.byId(session.user.id) : null;
  if (!user) return null;
  const department = user.department_id ? await Departments.byId(user.department_id) : null;

  return (
    <ProfileClient
      user={{
        ...user,
        role: session!.user.role as UserRole,
      }}
      departmentName={department?.name ?? null}
    />
  );
}
