import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Departments, Notifications } from '@/lib/db';
import type { Notification, UserRole } from '@/types';
import { DashboardShell } from '@/components/dashboard/dashboard-layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (!session.user.isApproved) redirect('/pending-approval');

  const [department, notifications, unreadCount] = await Promise.all([
    Departments.byId(session.user.departmentId ?? ''),
    Notifications.byUser(session.user.id),
    Notifications.unreadCount(session.user.id),
  ]);

  return (
    <DashboardShell
      user={{
        id: session.user.id,
        full_name: session.user.name ?? '',
        role: session.user.role as UserRole,
        email: session.user.email ?? '',
        staff_id: session.user.staffId,
        department: department ? { name: department.name } : null,
      }}
      notifications={notifications}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}

export type { Notification };
