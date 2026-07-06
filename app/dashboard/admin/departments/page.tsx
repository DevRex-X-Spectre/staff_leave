'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { AdminDepartmentsClient } from './departments-client';

export default function AdminDepartmentsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  return <AdminDepartmentsClient />;
}
