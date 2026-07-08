'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { ProfileClient } from './profile-client';

/**
 * /dashboard/profile - accessible to all four roles. Shows the user's info
 * and lets them change their password.
 *
 * Phase 3 placeholder: layout/auth gating happens in app/dashboard/layout.tsx,
 * so by the time this renders we know currentUser is non-null.
 */
export default function ProfilePage() {
  const { currentUser, ready } = useAuth();

  if (!ready || !currentUser) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-[var(--text-tertiary)]">
        Loading...
      </div>
    );
  }

  return <ProfileClient user={currentUser} />;
}