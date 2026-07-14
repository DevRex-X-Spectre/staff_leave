import { auth } from '@/auth';
import { Notifications } from '@/lib/db';
import { AdminNotificationsClient } from './notifications-client';
import type { Notification } from '@/types';

export default async function AdminNotificationsPage() {
  const session = await auth();
  const userId = session?.user?.id ?? '';
  const notifications = await Notifications.byUser(userId);

  return <AdminNotificationsClient notifications={notifications} />;
}
