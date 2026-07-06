'use client';

import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useTransition } from 'react';
import { timeAgo } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  useNotifications,
  useUnreadCount,
} from '@/lib/local/data-hooks';
import { Notifications as NotificationsStore } from '@/lib/local/store';

export function NotificationBell() {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? null;
  const notifications = useNotifications(userId);
  const count = useUnreadCount(userId);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleMarkRead = (id: string) => {
    startTransition(() => {
      NotificationsStore.markRead(id);
    });
  };

  const handleMarkAll = () => {
    if (!userId) return;
    startTransition(() => {
      NotificationsStore.markAllRead(userId);
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative p-2 rounded-[var(--radius-md)] transition-colors',
          'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
        )}
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell size={16} strokeWidth={1.5} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-[var(--danger)] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute right-0 top-full mt-1 w-[calc(100vw-2rem)] sm:w-80 max-w-80',
              'bg-[var(--bg-elevated)] border border-[var(--border-subtle)]',
              'rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden z-50'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
                Notifications
              </h3>
              {count > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAll}
                  className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} strokeWidth={1} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                  <p className="text-[13px] text-[var(--text-secondary)]">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer',
                      !n.is_read && 'bg-[var(--accent-bg)]'
                    )}
                    onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[var(--action-blue)] mt-1.5 shrink-0" />
                      )}
                      <div className={cn(!n.is_read ? '' : 'pl-4')}>
                        <p className="text-[13px] font-medium text-[var(--text-primary)]">{n.title}</p>
                        <p className="text-[12px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}