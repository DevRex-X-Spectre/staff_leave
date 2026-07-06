'use client';

import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useDepartment } from '@/lib/local/data-hooks';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const department = useDepartment(currentUser?.department_id ?? null);

  // currentUser is guaranteed non-null when this shell renders (the parent
  // layout gates rendering on auth.ready + currentUser). The non-null
  // assertion below makes the user object usable for downstream children.
  const user = currentUser!;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      <Sidebar
        role={user.role}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar
          user={{
            id: user.id,
            full_name: user.full_name,
            role: user.role,
            email: user.email,
            staff_id: user.staff_id,
            department,
          }}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto animate-fade-in">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}