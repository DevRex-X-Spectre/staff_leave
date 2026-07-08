'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { RegistrarReportsClient } from './registrar-reports-client';

export default function RegistrarReportsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <RegistrarReportsClient />;
}
