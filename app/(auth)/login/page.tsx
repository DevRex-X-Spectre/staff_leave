'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DEFAULT_PASSWORD } from '@/lib/constants';

type TestAccount = {
  staffId: string;
  role: string;
  name: string;
};

const TEST_ACCOUNTS: TestAccount[] = [
  { staffId: 'NAUB/ADM/SN001', role: 'Admin', name: 'System Administrator' },
  { staffId: 'NAUB/CS/001', role: 'HOD', name: 'Dr. Chukwuma Okeke' },
  { staffId: 'NAUB/REG/SN001', role: 'Registrar', name: 'Amina Bello' },
  { staffId: 'NAUB/CS/010', role: 'Staff', name: 'Engr. Samuel Adekunle' },
];

export default function LoginPage() {
  // useSearchParams() must be inside a Suspense boundary so the page can be
  // statically prerendered.
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('redirect') ?? undefined;
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function doSignIn(id: string, pw: string) {
    setError(null);
    setSubmitting(true);
    try {
      const res = await signIn('credentials', {
        staffId: id,
        password: pw,
        redirect: false,
      });
      if (!res || res.error) {
        setError('Invalid staff ID or password, or your account is not yet approved.');
        return;
      }
      // The middleware's `authorized` callback routes logged-in users from
      // /login to their role dashboard, so push there and let it resolve.
      router.push(callbackUrl ?? '/login');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void doSignIn(staffId, password);
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <Link
          href="/"
          className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <img src="/naub-logo.png" alt="NAUB logo" className="w-16 h-16 rounded-full mx-auto mb-4" />
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
                Seeded test accounts
              </p>
              <p className="text-[11px] text-[var(--action-blue)]/80">
                Sign in with your Staff ID. Seeded accounts use the default
                password <strong className="font-semibold">{DEFAULT_PASSWORD}</strong>.
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
                    placeholder="e.g. NAUB/ADM/SN001"
                    autoComplete="username"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                  />
                </FormField>
                <FormField label="Password">
                  <PasswordInput
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </FormField>
              </div>

              <div className="mt-6">
                <Button type="submit" className="w-full" variant="ink" disabled={submitting}>
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
              Quick login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TEST_ACCOUNTS.map((acc) => (
                <button
                  key={acc.staffId}
                  type="button"
                  disabled={submitting}
                  onClick={() => doSignIn(acc.staffId, DEFAULT_PASSWORD)}
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
            Staff accounts are provisioned by your Registrar / admin. If you
            already have credentials, sign in above.
          </p>
        </div>
      </div>
    </div>
  );
}
