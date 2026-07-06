'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { useApplications } from '@/lib/local/data-hooks';
import { HodAllRequestsClient } from './all-requests-client';

/**
 * HOD all-requests page (client). Reads from the localStorage store via
 * `useApplications({ departmentId })`. The department comes from the
 * authenticated user.
 */
export default function HodAllRequestsPage() {
  const { currentUser, ready } = useAuth();

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-[var(--text-tertiary)]">
        Loading…
      </div>
    );
  }
  if (!currentUser) return null;

  if (!currentUser.department_id) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-[20px] font-semibold">No department assigned</h1>
      </div>
    );
  }

  const apps = useApplications({
    departmentId: currentUser.department_id,
  });

  return <HodAllRequestsClient initialApplications={apps} />;
}