'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { HodRequestsClient } from './hod-requests-client';

export default function HodRequestsPage() {
  const { ready, currentUser } = useAuth();
  if (!ready || !currentUser) return null;
  if (!currentUser.department_id) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-[20px] font-semibold">No department assigned</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-2">
          You are not currently assigned to a department.
        </p>
      </div>
    );
  }
  return <HodRequestsClient />;
}
