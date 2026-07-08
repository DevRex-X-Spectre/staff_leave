'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { RegistrarAllApplicationsClient } from './all-applications-client';

export default function RegistrarAllApplicationsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <RegistrarAllApplicationsClient />;
}
