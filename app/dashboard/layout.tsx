import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { listDepartments } from '@/lib/data/dal';

export default async function DashboardLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Get department info for the topbar
  let department = null;
  if (user.department_id) {
    const depts = await listDepartments();
    department = depts.find((d) => d.id === user.department_id) ?? null;
  }

  return (
    <DashboardLayout
      role={user.role}
      user={{
        full_name: user.full_name,
        role: user.role,
        email: user.email,
        department,
      }}
    >
      {children}
    </DashboardLayout>
  );
}
