'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input, FormField, Label } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isDemoMode } from '@/lib/utils';
import { Users } from '@/lib/mock/store';
import { seedUserPasswords } from '@/lib/mock/data';
import { setDemoSession } from '@/lib/mock/session';
import { cookies } from 'next/headers';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [state, formAction, isPending] = useActionState(handleSubmit, null);
  const {
    register,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
  });

  async function handleSubmit(_prev: typeof state, formData: FormData) {
    if (isDemoMode()) {
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');
      const correctPassword = seedUserPasswords[email.toLowerCase()];
      if (!correctPassword || correctPassword !== password) {
        return { message: 'Invalid email or password.' };
      }
      const user = Users.byEmail(email.toLowerCase());
      if (!user) return { message: 'Account not found.' };
      // In demo mode, set cookie and redirect
      const { setDemoSession } = await import('@/lib/mock/session');
      await setDemoSession(user.id);
      const { cookies } = await import('next/headers');
      const c = await cookies();
      c.set('naub-demo-role', user.role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
      router.refresh();
      return null;
    }
    // Real Supabase login
    try {
      const { getSupabaseBrowserClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: String(formData.get('email')),
        password: String(formData.get('password')),
      });
      if (error) return { message: error.message };
      router.refresh();
      return null;
    } catch {
      return { message: 'An unexpected error occurred.' };
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-4">
      {/* Top bar */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <Link
          href="/"
          className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to home
        </Link>
      </div>

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
          {isDemoMode() && (
            <div className="mb-4 p-3 bg-[var(--info-banner-bg)] border border-[var(--action-blue)]/20 rounded-[var(--radius-md)]">
              <p className="text-[12px] text-[var(--action-blue)] font-medium mb-1">Demo mode active</p>
              <p className="text-[11px] text-[var(--action-blue)]/80">
                Use one of the demo credentials below. Supabase is not configured — data is stored in memory.
              </p>
            </div>
          )}

          {state?.message && (
            <div className="mb-4 p-3 bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-[var(--radius-md)]">
              <p className="text-[13px] text-[var(--danger)]">{state.message}</p>
            </div>
          )}

          <form action={formAction}>
            <div className="space-y-4">
              <FormField label="Email address" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="you@naub.edu.ng"
                  autoComplete="email"
                  {...register('email')}
                />
              </FormField>
              <FormField label="Password" error={errors.password?.message}>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                />
              </FormField>
            </div>

            <div className="mt-6">
              <Button type="submit" className="w-full" variant="ink" disabled={isPending}>
                {isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>

          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="text-[13px] text-[var(--color-action-blue)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </Card>

        {isDemoMode() && (
          <div className="mt-6">
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest text-center mb-3">
              Demo accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <DemoAccountButton key={acc.email} {...acc} />
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[13px] text-[var(--text-secondary)] mt-6">
          No account yet?{' '}
          <Link
            href="/register"
            className="text-[var(--color-action-blue)] hover:underline font-medium"
          >
            Register as staff
          </Link>
        </p>
      </div>
    </div>
  );
}

function DemoAccountButton({ email, password, role, name }: {
  email: string;
  password: string;
  role: string;
  name: string;
}) {
  const router = useRouter();
  const handleClick = async () => {
    const { setDemoSession } = await import('@/lib/mock/session');
    const { cookies } = await import('next/headers');
    const user = Users.byEmail(email.toLowerCase());
    if (user) {
      await setDemoSession(user.id);
      const c = await cookies();
      c.set('naub-demo-role', user.role, { httpOnly: true, sameSite: 'lals', path: '/', maxAge: 60 * 60 * 24 * 7 });
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-left hover:bg-[var(--bg-hover)] transition-colors"
    >
      <p className="text-[12px] font-medium text-[var(--text-primary)]">{name}</p>
      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{role}</p>
    </button>
  );
}

const DEMO_ACCOUNTS = [
  { email: 'admin@naub.edu.ng', password: 'Admin@NAUB2026', role: 'Admin', name: 'System Admin' },
  { email: 'hod.cs@naub.edu.ng', password: 'Hod@NAUB2026', role: 'HOD', name: 'Dr. Chukwuma Okeke' },
  { email: 'hr@naub.edu.ng', password: 'Hr@NAUB2026', role: 'HR Manager', name: 'Amina Bello' },
  { email: 'staff1@naub.edu.ng', password: 'Staff@NAUB2026', role: 'Staff', name: 'Engr. Samuel Adekunle' },
];
