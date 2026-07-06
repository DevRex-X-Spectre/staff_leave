'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { HrAllApplicationsClient } from './all-applications-client';

export default function HrAllApplicationsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <HrAllApplicationsClient />;
}