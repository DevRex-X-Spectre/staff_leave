'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { DEFAULT_PASSWORD } from '@/lib/local/constants';
import { dashboardPathFor } from '@/lib/local/routes';

type DemoAccount = {
  staffId: string;
  role: string;
  name: string;
};

const DEMO_ACCOUNTS: DemoAccount[] = [
  { staffId: 'NAUB/ADM/001', role: 'Admin', name: 'System Administrator' },
  { staffId: 'NAUB/CS/001', role: 'HOD', name: 'Dr. Chukwuma Okeke' },
  { staffId: 'NAUB/HR/001', role: 'HR Manager', name: 'Amina Bello' },
  { staffId: 'NAUB/CS/010', role: 'Staff', name: 'Engr. Samuel Adekunle' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(staffId, password);
      if (result.ok) {
        router.push(dashboardPathFor(result.user.role));
      } else {
        setError(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDemo(account: DemoAccount) {
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(account.staffId, DEFAULT_PASSWORD);
      if (result.ok) {
        router.push(dashboardPathFor(result.user.role));
      } else {
        setError(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
        <ThemeToggle />
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-[var(--ink)] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-[16px] font-bold tracking-tight">NA</span>
            </div>
            <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
              Welcome back
            </h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-1">
              Sign in to NAUB Leave Management System
            </p>
          </div>

          <Card>
            <div className="mb-4 p-3 bg-[var(--info-banner-bg)] border border-[var(--action-blue)]/20 rounded-[var(--radius-md)]">
              <p className="text-[12px] text-[var(--action-blue)] font-medium mb-1">
                Demo mode
              </p>
              <p className="text-[11px] text-[var(--action-blue)]/80">
                Sign in with your Staff ID and the default password{' '}
                <strong className="font-semibold">{DEFAULT_PASSWORD}</strong>.
                Data is stored locally in this browser.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-[var(--radius-md)]">
                <p className="text-[13px] text-[var(--danger)]">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <FormField label="Staff ID">
                  <Input
                    type="text"
                    placeholder="NAUB/CS/001"
                    autoComplete="username"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Password">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="mt-6">
                <Button
                  type="submit"
                  className="w-full"
                  variant="ink"
                  disabled={submitting}
                >
                  {submitting ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>
            </form>

            <p className="mt-4 text-center text-[12px] text-[var(--text-tertiary)]">
              New staff? You'll get the default password{' '}
              <strong className="font-medium text-[var(--text-secondary)]">
                {DEFAULT_PASSWORD}
              </strong>{' '}
              once your account is approved.
            </p>
          </Card>

          <div className="mt-6">
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest text-center mb-3">
              Quick demo login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.staffId}
                  type="button"
                  disabled={submitting}
                  onClick={() => handleDemo(acc)}
                  className="w-full p-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-left hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                >
                  <p className="text-[12px] font-medium text-[var(--text-primary)]">
                    {acc.name}
                  </p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {acc.role} · {acc.staffId}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[13px] text-[var(--text-secondary)] mt-6">
            Staff accounts are provisioned by your HR / admin. If you already
            have credentials, sign in above.
          </p>
        </div>
      </div>
    </div>
  );
}