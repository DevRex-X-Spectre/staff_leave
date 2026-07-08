'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { EntitlementsClient } from './entitlements-client';

export default function RegistrarEntitlementsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <EntitlementsClient />;
}
