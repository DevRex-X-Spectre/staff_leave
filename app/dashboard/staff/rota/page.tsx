'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { StaffRotaClient } from './staff-rota-client';

export default function StaffRotaPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <StaffRotaClient />;
}