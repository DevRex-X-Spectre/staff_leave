'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { HrRequestsClient } from './hr-requests-client';

export default function HrRequestsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <HrRequestsClient />;
}