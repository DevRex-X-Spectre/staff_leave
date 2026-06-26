'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Settings,
  Bell,
  FileText,
  CheckSquare,
  Clock,
  BarChart3,
  Calendar,
  CalendarRange,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { UserRole } from '@/types';

/* -------------------------------------------------------------------------
   Sidebar nav items — role-aware.
   ------------------------------------------------------------------------- */
type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  group: string;
  items: NavItem[];
};

const ADMIN_NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    ],
  },
  {
    group: 'User Management',
    items: [
      { label: 'Approval Queue', href: '/dashboard/admin/approvals', icon: CheckSquare },
      { label: 'Staff', href: '/dashboard/admin/staff', icon: Users },
    ],
  },
  {
    group: 'System',
    items: [
      { label: 'Departments', href: '/dashboard/admin/departments', icon: Building2 },
      { label: 'Leave Types', href: '/dashboard/admin/leave-types', icon: CalendarDays },
      { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
      { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
    ],
  },
];

const HOD_NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/hod', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Leave Requests',
    items: [
      { label: 'Pending Approvals', href: '/dashboard/hod/requests', icon: Clock },
      { label: 'All Requests', href: '/dashboard/hod/all-requests', icon: FileText },
    ],
  },
  {
    group: 'Department',
    items: [
      { label: 'Leave Rota', href: '/dashboard/hod/rota', icon: CalendarRange },
      { label: 'Department Calendar', href: '/dashboard/hod/calendar', icon: Calendar },
    ],
  },
];

const HR_NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/hr', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Leave Requests',
    items: [
      { label: 'Awaiting Approval', href: '/dashboard/hr/requests', icon: Clock },
      { label: 'All Applications', href: '/dashboard/hr/all-applications', icon: FileText },
    ],
  },
  {
    group: 'Management',
    items: [
      { label: 'Leave Entitlements', href: '/dashboard/hr/entitlements', icon: BarChart3 },
      { label: 'Reports', href: '/dashboard/hr/reports', icon: BarChart3 },
    ],
  },
];

const STAFF_NAV: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Leave',
    items: [
      { label: 'Apply for Leave', href: '/dashboard/staff/apply', icon: CalendarDays },
      { label: 'My Leave History', href: '/dashboard/staff/my-leaves', icon: Clock },
      { label: 'Leave Rota', href: '/dashboard/staff/rota', icon: CalendarRange },
    ],
  },
];

function navForRole(role: UserRole): NavGroup[] {
  switch (role) {
    case 'admin':
      return ADMIN_NAV;
    case 'hod':
      return HOD_NAV;
    case 'hr_manager':
      return HR_NAV;
    case 'staff':
      return STAFF_NAV;
  }
}

function isActive(href: string, pathname: string): boolean {
  if (href === pathname) return true;
  // Sub-pages
  if (href !== '/dashboard/' + roleFromPath(pathname) && href !== pathname) {
    return pathname.startsWith(href);
  }
  return false;
}

function roleFromPath(pathname: string): string {
  const parts = pathname.split('/');
  return parts[2] ?? 'staff';
}

function SidebarGroup({
  group,
  items,
  pathname,
}: {
  group: NavGroup;
  pathname: string;
  pathname: string;
  items: NavItem[];
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
      >
        {group}
        <ChevronDown
          size={12}
          className={cn('transition-transform', !open && '-rotate-90')}
        />
      </button>
      {open &&
        items.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-[14px] font-light transition-colors',
                'tracking-tight',
                active
                  ? 'bg-[var(--ink)] text-white font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              )}
            >
              <item.icon size={15} strokeWidth={active ? 2 : 1.5} />
              {item.label}
              {active && <ChevronRight size={13} className="ml-auto opacity-60" />}
            </Link>
          );
        })}
    </div>
  );
}

export function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const nav = navForRole(role);

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[var(--ink)] rounded-[var(--radius-md)] flex items-center justify-center shrink-0">
            <span className="text-white text-[11px] font-bold tracking-tight">NA</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--text-primary)] leading-none">
              NAUB LMS
            </p>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-none">
              Nigerian Army University
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((group) => (
          <SidebarGroup
            key={group.group}
            group={group}
            pathname={pathname}
            items={group.items}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
          Nigerian Army University, Biu
          <br />
          Staff Leave Management System
        </p>
      </div>
    </aside>
  );
}
