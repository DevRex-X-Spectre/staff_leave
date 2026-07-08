'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { RegistrarRequestsClient } from './registrar-requests-client';

export default function RegistrarRequestsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <RegistrarRequestsClient />;
}
