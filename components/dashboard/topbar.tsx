'use client';

import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogOut,
  ChevronDown,
  Shield,
  User,
  Menu,
  UserCircle,
} from 'lucide-react';
import { useState, useTransition } from 'react';
import { initials } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { useAuth } from '@/components/providers/auth-provider';
import { dashboardPathFor } from '@/lib/local/routes';
import Link from 'next/link';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  hod: 'Head of Department',
  hr_manager: 'Registrar',
  staff: 'Staff Member',
};

export function TopBar({
  user,
  onMenuClick,
}: {
  user: {
    id: string;
    full_name: string;
    role: string;
    email: string;
    staff_id: string | null;
    department?: { name: string } | null;
  };
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { switchUser, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleSwitchUser = (userId: string, role: string) => {
    startTransition(() => {
      switchUser(userId);
      setUserMenuOpen(false);
      router.push(dashboardPathFor(role as 'admin' | 'hod' | 'hr_manager' | 'staff'));
    });
  };

  const handleSignOut = () => {
    startTransition(() => {
      logout();
      setUserMenuOpen(false);
      router.push('/login');
    });
  };

  return (
    <header className="h-14 flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shrink-0 sticky top-0 z-30">
      {/* Left: hamburger (mobile) + page title */}
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

      {/* Right controls */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <NotificationBell />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-[var(--radius-md)]',
              'hover:bg-[var(--bg-hover)] transition-colors',
              userMenuOpen && 'bg-[var(--bg-hover)]'
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

          {userMenuOpen && (
            <div
              className="fixed inset-0 z-40"
              onClick={() => setUserMenuOpen(false)}
            />
          )}

          {userMenuOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-1 w-64 sm:w-56',
                'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
                'rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden',
                'z-50'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User info */}
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

              {/* Profile link */}
              <div className="px-2 py-2 border-b border-[var(--border-subtle)]">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setUserMenuOpen(false)}
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

              {/* Demo user switcher */}
              <div className="px-2 py-2 border-b border-[var(--border-subtle)]">
                <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] px-2 mb-1">
                  Demo: switch user
                </p>
                {DEMO_USERS.map((du) => (
                  <button
                    key={du.id}
                    onClick={() => handleSwitchUser(du.id, du.role)}
                    disabled={du.id === user.id}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-md)] text-left',
                      'text-[13px] hover:bg-[var(--bg-hover)] transition-colors',
                      'disabled:opacity-50 disabled:cursor-default'
                    )}
                  >
                    <du.icon size={14} className="text-[var(--text-tertiary)] shrink-0" />
                    <span className="text-[var(--text-secondary)] truncate flex-1">{du.name}</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase shrink-0 bg-[var(--bg-subtle)] text-[var(--text-tertiary)]">
                      {du.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sign out */}
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

const DEMO_USERS = [
  { id: 'user-admin', name: 'System Admin', role: 'admin', icon: Shield },
  { id: 'user-hod-cs', name: 'Dr. Chukwuma Okeke', role: 'hod', icon: User },
  { id: 'user-hr', name: 'Amina Bello', role: 'hr_manager', icon: User },
  { id: 'user-staff-1', name: 'Engr. Samuel Adekunle', role: 'staff', icon: User },
];

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