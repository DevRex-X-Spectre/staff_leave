'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { AdminApprovalsClient } from './approvals-client';

export default function AdminApprovalsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <AdminApprovalsClient />;
}
