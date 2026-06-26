'use client';

import { useActionState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Shield,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { initials } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { signOutDemoAction, switchDemoUserAction } from '@/lib/data/actions';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  hod: 'Head of Department',
  hr_manager: 'HR Manager',
  staff: 'Staff Member',
};

export function TopBar({
  user,
}: {
  user: {
    full_name: string;
    role: string;
    email: string;
    department?: { name: string } | null;
  };
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [, switchAction, switching] = useActionState(switchDemoUserAction, undefined);
  const [, signOut, signingOut] = useActionState(signOutDemoAction, undefined);

  const handleSwitchUser = async (userId: string, role: string) => {
    const fd = new FormData();
    fd.append('user_id', userId);
    fd.append('role', role);
    await switchAction(fd);
  };

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-card)] shrink-0">
      {/* Page title */}
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold text-[var(--text-primary)]">
          {pageTitleFromPath(pathname)}
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <NotificationBell userId={user.email} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-[var(--radius-md)] transition-colors',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
          )}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <Sun size={16} strokeWidth={1.5} />
          ) : (
            <Moon size={16} strokeWidth={1.5} />
          )}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-[var(--radius-md)]',
              'hover:bg-[var(--bg-hover)] transition-colors',
              userMenuOpen && 'bg-[var(--bg-hover)]'
            )}
          >
            <div className="w-7 h-7 bg-[var(--ink)] rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-[11px] font-bold">
                {initials(user.full_name)}
              </span>
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[13px] font-medium text-[var(--text-primary)] leading-none">
                {user.full_name}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-none">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
            </div>
            <ChevronDown size={13} className="text-[var(--text-tertiary)]" />
          </button>

          {userMenuOpen && (
            <div
              className={cn(
                'fixed inset-0 z-40'
              )}
              onClick={() => setUserMenuOpen(false)}
            />
          )}

          {userMenuOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-1 w-56',
                'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
                'rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden',
                'z-50'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User info */}
              <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  {user.email}
                </p>
                {user.department && (
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {user.department.name}
                  </p>
                )}
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
                    disabled={switching}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-md)] text-left',
                      'text-[13px] hover:bg-[var(--bg-hover)] transition-colors',
                      'disabled:opacity-50'
                    )}
                  >
                    <du.icon size={14} className="text-[var(--text-tertiary)] shrink-0" />
                    <span className="text-[var(--text-secondary)]">{du.name}</span>
                    <span
                      className={cn(
                        'ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase'
                      )}
                    >
                      {du.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Sign out */}
              <div className="px-2 py-2">
                <form action={signOut}>
                  <button
                    type="submit"
                    disabled={signingOut}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius-md)] text-left',
                      'text-[13px] text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors',
                      'disabled:opacity-50'
                    )}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </form>
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
