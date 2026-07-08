'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { RegistrarDashboardClient } from './registrar-dashboard-client';

export default function RegistrarDashboardPage() {
  const { currentUser, ready } = useAuth();
  if (!ready || !currentUser) return null;
  return <RegistrarDashboardClient />;
}
