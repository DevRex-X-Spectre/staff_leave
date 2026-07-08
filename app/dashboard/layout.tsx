'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout as DashboardShell } from '@/components/dashboard/dashboard-layout';

/**
 * /dashboard layout - gates the whole subtree on auth and renders the
 * dashboard shell. Replaces the previous server-component DAL fetch.
 */
export default function DashboardLayoutPage({
  children,
}: {
  children: ReactNode;
}) {
  const { currentUser, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !currentUser) {
      router.replace('/login');
    }
  }, [ready, currentUser, router]);

  if (!ready) {
    return <FullScreenMessage message="Loading..." />;
  }

  if (!currentUser) {
    return <FullScreenMessage message="Redirecting..." />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

function FullScreenMessage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)] text-[var(--text-tertiary)] text-[14px]">
      {message}
    </div>
  );
}