'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { StaffDashboardClient } from './staff-dashboard-client';

export default function StaffDashboardPage() {
  const { currentUser, ready } = useAuth();
  if (!ready || !currentUser) return null;
  return <StaffDashboardClient />;
}