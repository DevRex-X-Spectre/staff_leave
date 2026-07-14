'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LogOut, ChevronDown, Menu, UserCircle } from 'lucide-react';
import { initials } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';
import Link from 'next/link';
import type { Notification, UserRole } from '@/types';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  hod: 'Head of Department',
  hr_manager: 'Registrar',
  staff: 'Staff Member',
};

export function TopBar({
  user,
  notifications,
  unreadCount,
  onMenuClick,
}: {
  user: {
    id: string;
    full_name: string;
    role: UserRole;
    email: string;
    staff_id: string | null;
    department?: { name: string } | null;
  };
  notifications: Notification[];
  unreadCount: number;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-14 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9 -ml-1 inline-flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={18} strokeWidth={1.5} />
          </button>
        )}
        <span className="text-[14px] font-semibold text-[var(--text-primary)] truncate">
          {pageTitleFromPath(pathname)}
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <NotificationBell notifications={notifications} count={unreadCount} />

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-[var(--radius-md)]',
              'hover:bg-[var(--bg-hover)] transition-colors',
              open && 'bg-[var(--bg-hover)]'
            )}
            aria-label="User menu"
          >
            <div className="w-7 h-7 bg-[var(--ink)] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">
                {initials(user.full_name)}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-medium text-[var(--text-primary)] leading-none truncate max-w-[160px]">
                {user.full_name}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-none">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-[var(--text-tertiary)] hidden sm:block" />
          </button>

          {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

          {open && (
            <div
              className={cn(
                'absolute right-0 top-full mt-1 w-64 sm:w-56',
                'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
                'rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden',
                'z-50'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">
                  {user.email}
                </p>
                {user.staff_id && (
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                    {user.staff_id}
                  </p>
                )}
                {user.department && (
                  <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                    {user.department.name}
                  </p>
                )}
              </div>

              <div className="px-2 py-2 border-b border-[var(--border-subtle)]">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setOpen(false)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-md)]',
                    'text-[13px] hover:bg-[var(--bg-hover)] transition-colors',
                    'text-[var(--text-secondary)]'
                  )}
                >
                  <UserCircle size={14} className="text-[var(--text-tertiary)] shrink-0" />
                  My profile
                </Link>
              </div>

              <div className="px-2 py-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-md)] text-left',
                    'text-[13px] text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors'
                  )}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function pageTitleFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return 'Dashboard';
  const last = segments[segments.length - 1];
  const map: Record<string, string> = {
    profile: 'My Profile',
    approvals: 'Approval Queue',
    staff: 'Staff',
    departments: 'Departments',
    'leave-types': 'Leave Types',
    settings: 'Settings',
    notifications: 'Notifications',
    apply: 'Apply for Leave',
    'my-leaves': 'My Leave History',
    rota: 'Leave Rota',
    requests: 'Pending Requests',
    'all-requests': 'All Requests',
    'all-applications': 'All Applications',
    entitlements: 'Entitlements',
    reports: 'Reports',
    calendar: 'Calendar',
  };
  return map[last] ?? last.charAt(0).toUpperCase() + last.slice(1);
}
