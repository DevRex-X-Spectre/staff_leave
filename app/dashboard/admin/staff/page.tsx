'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { AdminStaffClient } from './staff-client';

export default function AdminStaffPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <AdminStaffClient />;
}
