'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { HodDashboardClient } from './hod-dashboard-client';

export default function HodDashboardPage() {
  const { currentUser, ready } = useAuth();
  if (!ready || !currentUser) return null;
  return <HodDashboardClient />;
}