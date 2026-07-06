'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { HrDashboardClient } from './hr-dashboard-client';

export default function HrDashboardPage() {
  const { currentUser, ready } = useAuth();
  if (!ready || !currentUser) return null;
  return <HrDashboardClient />;
}