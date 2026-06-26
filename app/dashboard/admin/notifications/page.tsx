'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/stat-card';
import { listNotificationsForUser } from '@/lib/data/dal';
import { timeAgo } from '@/lib/utils';
import { Bell } from 'lucide-react';
import type { Notification } from '@/types';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For admin, show all notifications (in a real app, there'd be a system-wide notification table)
    listNotificationsForUser('user-admin').then((data) => {
      setNotifications(data as Notification[]);
      setLoading(false);
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Notifications"
        description="System-wide notification history."
      />

      <Card padding={false}>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--text-secondary)]">Loading…</div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="System notifications will appear here."
          />
        ) : (
          <div className="divide-y divide-[var(--border-subtle)]">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`px-6 py-4 hover:bg-[var(--bg-hover)] transition-colors ${
                  !n.is_read ? 'bg-[var(--accent-bg)]' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[var(--action-blue)] mt-2 shrink-0" />
                  )}
                  <div>
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{n.title}</p>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
