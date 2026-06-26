'use client';

import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useTheme } from '@/components/theme-provider';
import { Moon, Sun, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listDepartments } from '@/lib/data/dal';
import { useEffect, useState } from 'react';
import type { Department } from '@/types';

const RegisterSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  staff_id: z.string().min(2, 'Enter your staff ID'),
  staff_type: z.enum(['academic', 'non_academic'], { required_error: 'Select staff type' }),
  department_id: z.string().min(1, 'Select a department'),
  requested_role: z.enum(['staff', 'hod', 'hr_manager'], { required_error: 'Select a role' }),
});

type RegisterValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [success, setSuccess] = useState(false);
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      const { registerAction } = await import('@/lib/data/actions');
      return registerAction(_prev as never, fd);
    },
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(RegisterSchema),
  });

  useEffect(() => {
    listDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    if (state?.ok) setSuccess(true);
  }, [state]);

  if (success) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="w-16 h-16 bg-[var(--success-bg)] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-[var(--success)]" strokeWidth={1.5} />
          </div>
          <h2 className="text-[20px] font-semibold text-[var(--text-primary)] mb-3">
            Application submitted
          </h2>
          <p className="text-[14px] text-[var(--text-secondary)] leading-relaxed">
            Your account request has been submitted for admin approval. You will
            receive an email notification once your account is approved.
          </p>
          <Link href="/login" className="mt-8 inline-block">
            <Button variant="outline">Return to login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="max-w-[520px] mx-auto px-4 py-12">
        {/* Header */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <Link href="/" className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 transition-colors">
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--ink)] rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-[16px] font-bold tracking-tight">NA</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Create your account</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Nigerian Army University, Biu — Staff Registration
          </p>
        </div>

        <Card>
          {state?.message && !state.ok && (
            <div className="mb-4 p-3 bg-[var(--danger-bg)] border border-[var(--danger)]/20 rounded-[var(--radius-md)]">
              <p className="text-[13px] text-[var(--danger)]">{state.message}</p>
            </div>
          )}

          <form>
            <div className="space-y-4">
              <FormField label="Full name" error={errors.full_name?.message}>
                <Input placeholder="Dr. John Doe" {...register('full_name')} />
              </FormField>
              <FormField label="Email address" error={errors.email?.message}>
                <Input type="email" placeholder="you@naub.edu.ng" {...register('email')} />
              </FormField>
              <FormField label="Password" error={errors.password?.message}>
                <Input type="password" placeholder="Min. 8 characters" {...register('password')} />
              </FormField>
              <FormField label="Phone number" error={errors.phone?.message}>
                <Input type="tel" placeholder="+234 800 000 0000" {...register('phone')} />
              </FormField>
              <FormField label="Staff ID" error={errors.staff_id?.message}>
                <Input placeholder="NAUB/CS/001" {...register('staff_id')} />
              </FormField>
              <FormField label="Staff type" error={errors.staff_type?.message}>
                <Select placeholder="Select staff type" {...register('staff_type')}>
                  <option value="academic">Academic</option>
                  <option value="non_academic">Non-Academic</option>
                </Select>
              </FormField>
              <FormField label="Department" error={errors.department_id?.message}>
                <Select placeholder="Select department" {...register('department_id')}>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Requested role" error={errors.requested_role?.message}>
                <Select placeholder="Select role" {...register('requested_role')}>
                  <option value="staff">Staff (default)</option>
                  <option value="hod">Head of Department</option>
                  <option value="hr_manager">HR Manager</option>
                </Select>
              </FormField>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="ink"
                className="w-full"
                disabled={isPending}
                onClick={handleSubmit(async (data) => {
                  const fd = new FormData();
                  Object.entries(data).forEach(([k, v]) => fd.append(k, v as string));
                  formAction(fd);
                })}
              >
                {isPending ? 'Submitting…' : 'Submit for approval'}
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-[13px] text-[var(--text-secondary)] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[var(--color-action-blue)] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
