'use client';

import { useState, useTransition } from 'react';
import { Card, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { useAuth } from '@/components/providers/auth-provider';
import { useDepartment } from '@/lib/local/data-hooks';
import { DEFAULT_PASSWORD } from '@/lib/local/constants';
import type { User } from '@/types';
import { toast } from 'sonner';
import { initials } from '@/lib/utils';
import { KeyRound, ShieldCheck } from 'lucide-react';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrator',
  hod: 'Head of Department',
  hr_manager: 'Registrar',
  staff: 'Staff Member',
};

export function ProfileClient({ user }: { user: User }) {
  const department = useDepartment(user.department_id);
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isPending, startTransition] = useTransition();

  const isUsingDefault = false; // we don't surface whether the password is the seed default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast.error('New passwords do not match.');
      return;
    }
    startTransition(async () => {
      const result = await changePassword(current, next);
      if (result.ok) {
        toast.success('Password changed. Sign in again next time with your new password.');
        setCurrent('');
        setNext('');
        setConfirm('');
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
          Account
        </p>
        <h1
          className="mt-2 font-semibold text-[var(--text-primary)]"
          style={{
            fontFamily: 'var(--font-cal-sans)',
            fontSize: 'clamp(28px, 3.5vw, 36px)',
            letterSpacing: '0.01em',
          }}
        >
          My profile
        </h1>
        <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
          View your account details and update your password.
        </p>
      </div>

      {/* Profile card */}
      <Card className="mb-5">
        <CardTitle className="mb-4">Account details</CardTitle>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-full bg-[var(--ink)] inline-flex items-center justify-center shrink-0">
            <span className="text-white text-[16px] font-bold">
              {initials(user.full_name)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-[var(--text-primary)] truncate">
              {user.full_name}
            </p>
            <p className="text-[12px] text-[var(--text-tertiary)] truncate">
              {ROLE_LABEL[user.role] ?? user.role}
              {department ? ` · ${department.name}` : ''}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Staff ID
            </dt>
            <dd className="mt-0.5 text-[var(--text-primary)] font-medium">
              {user.staff_id ?? '-'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Email
            </dt>
            <dd className="mt-0.5 text-[var(--text-primary)] truncate">
              {user.email}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Phone
            </dt>
            <dd className="mt-0.5 text-[var(--text-primary)] truncate">
              {user.phone ?? '-'}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-[var(--text-tertiary)] font-semibold">
              Staff type
            </dt>
            <dd className="mt-0.5 text-[var(--text-primary)] capitalize">
              {user.staff_type.replace('_', ' ')}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Change password card */}
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <span className="w-9 h-9 rounded-[10px] bg-[var(--bg-subtle)] inline-flex items-center justify-center shrink-0">
            <KeyRound size={16} strokeWidth={1.5} className="text-[var(--text-primary)]" />
          </span>
          <div>
            <CardTitle>Change password</CardTitle>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Choose a password with at least 8 characters. The default password{' '}
              <code className="px-1.5 py-0.5 bg-[var(--bg-subtle)] rounded text-[12px] font-mono">
                {DEFAULT_PASSWORD}
              </code>{' '}
              works on first login.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <FormField label="Current password">
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="New password">
              <Input
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                minLength={8}
                required
              />
            </FormField>
            <FormField label="Confirm new password">
              <Input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </FormField>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-[var(--text-tertiary)] inline-flex items-center gap-1">
              <ShieldCheck size={11} />
              Passwords are stored locally in this browser (demo mode).
            </p>
            <Button type="submit" variant="ink" disabled={isPending}>
              {isPending ? 'Saving...' : 'Update password'}
            </Button>
          </div>
        </form>

        {isUsingDefault && (
          <p className="mt-3 text-[11px] text-[var(--warning)]">
            You're still using the default password. Update it for a more
            personalised sign-in.
          </p>
        )}
      </Card>
    </div>
  );
}