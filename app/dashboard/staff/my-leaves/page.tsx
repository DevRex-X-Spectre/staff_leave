'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { MyLeavesClient } from './my-leaves-client';

export default function MyLeavesPage() {
  const { currentUser, ready } = useAuth();
  if (!ready || !currentUser) return null;
  return <MyLeavesClient userId={currentUser.id} />;
}