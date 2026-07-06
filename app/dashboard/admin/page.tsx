'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { AdminDashboardClient } from './admin-dashboard-client';

export default function AdminDashboardPage() {
  const { currentUser, ready } = useAuth();
  if (!ready || !currentUser) return null;
  return <AdminDashboardClient />;
}