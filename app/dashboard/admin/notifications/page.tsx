'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { AdminNotificationsClient } from './notifications-client';

export default function AdminNotificationsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <AdminNotificationsClient />;
}
