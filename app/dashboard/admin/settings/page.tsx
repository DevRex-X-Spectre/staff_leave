'use client';

import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Mail, Smartphone } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="System Settings"
        description="Configure institution branding and notification preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Institution */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Settings size={18} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
            <CardTitle>Institution</CardTitle>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-[var(--text-secondary)]">Institution name</p>
              <p className="text-[14px] font-medium text-[var(--text-primary)]">Nigerian Army University, Biu</p>
            </div>
            <div>
              <p className="text-[13px] text-[var(--text-secondary)]">Abbreviation</p>
              <p className="text-[14px] font-medium text-[var(--text-primary)]">NAUB</p>
            </div>
            <div>
              <p className="text-[13px] text-[var(--text-secondary)]">Application URL</p>
              <p className="text-[14px] font-medium text-[var(--text-primary)]">
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}
              </p>
            </div>
          </div>
        </Card>

        {/* Email notifications */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Mail size={18} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <div className="space-y-3">
            {[
              'New user registered',
              'Account approved / rejected',
              'Leave application submitted',
              'HOD approved / rejected',
              'Registrar final approved / rejected',
              'Rota published',
            ].map((event) => (
              <div key={event} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-[13px] text-[var(--text-secondary)]">{event}</span>
                <Badge variant="subtle" className="text-[11px]">Active</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* SMS (coming soon) */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Smartphone size={18} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
            <CardTitle>SMS Notifications</CardTitle>
          </div>
          <div className="flex items-center gap-3 p-3 bg-[var(--info-banner-bg)] border border-[var(--action-blue)]/20 rounded-[var(--radius-md)]">
            <span className="text-[var(--action-blue)]">ℹ️</span>
            <div>
              <p className="text-[13px] font-medium text-[var(--action-blue)]">Coming Soon</p>
              <p className="text-[12px] text-[var(--action-blue)]/80 mt-0.5">
                SMS notifications will integrate with the Termii API. Enable in settings once configured.
              </p>
            </div>
          </div>
        </Card>

        {/* Default entitlements */}
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Bell size={18} strokeWidth={1.5} className="text-[var(--text-secondary)]" />
            <CardTitle>Default Leave Entitlements</CardTitle>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] mb-3">
            Default leave entitlement rules applied when initialising a new leave year.
          </p>
          <div className="space-y-2">
            {[
              { type: 'Annual Leave', academic: '21 days', nonAcademic: '21 days' },
              { type: 'Sick Leave', academic: '14 days', nonAcademic: '14 days' },
              { type: 'Casual Leave', academic: '7 days', nonAcademic: '7 days' },
              { type: 'Maternity Leave', academic: 'N/A', nonAcademic: '90 days' },
            ].map((rule) => (
              <div key={rule.type} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-[13px] text-[var(--text-secondary)]">{rule.type}</span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[var(--text-tertiary)]">
                  <span>Academic: {rule.academic}</span>
                  <span>Non-academic: {rule.nonAcademic}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
