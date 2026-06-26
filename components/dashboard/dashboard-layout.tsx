'use client';

import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import type { UserRole } from '@/types';

export function DashboardLayout({
  role,
  user,
  children,
}: {
  role: UserRole;
  user: {
    full_name: string;
    role: string;
    email: string;
    department?: { name: string } | null;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-page)]">
      {/* Sidebar */}
      <div className="hidden md:flex">
        <Sidebar role={role} />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar user={user} />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <div className="max-w-[1200px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
