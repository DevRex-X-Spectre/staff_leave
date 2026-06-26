'use client';

import { useActionState } from 'react';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  listNotificationsForUser,
} from '@/lib/data/dal';
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/lib/data/actions';
import { timeAgo } from '@/lib/utils';
import { Skeleton } from '@/components/ui/stat-card';

type Notification = {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
};

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [, markReadAction] = useActionState(markNotificationReadAction, undefined);
  const [, markAllAction] = useActionState(markAllNotificationsReadAction, undefined);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listNotificationsForUser(userId).then((data) => {
      const n = data as Notification[];
      setNotifications(n);
      setCount(n.filter((x) => !x.is_read).length);
      setLoading(false);
    });
  }, [open, userId]);

  const handleMarkRead = async (id: string) => {
    const fd = new FormData();
    fd.append('id', id);
    await markReadAction(fd);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setCount((c) => Math.max(0, c - 1));
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
              'absolute right-0 top-full mt-1 w-80',
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
                <form action={async () => {
                  const fd = new FormData();
                  await markAllAction(fd);
                  setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                  setCount(0);
                }}>
                  <button type="submit" className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Mark all read
                  </button>
                </form>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton width="60%" height={13} />
                      <Skeleton width="90%" height={11} />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} strokeWidth={1} className="mx-auto text-[var(--text-tertiary)] mb-2" />
                  <p className="text-[13px] text-[var(--text-secondary)]">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map(n => (
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
