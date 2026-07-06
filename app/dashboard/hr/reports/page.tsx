'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { HrReportsClient } from './hr-reports-client';

export default function HrReportsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <HrReportsClient />;
}