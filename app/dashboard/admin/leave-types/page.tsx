'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { AdminLeaveTypesClient } from './leave-types-client';

export default function AdminLeaveTypesPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <AdminLeaveTypesClient />;
}
