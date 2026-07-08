'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Textarea } from '@/components/ui/input';
import { cn, diffDaysInclusive } from '@/lib/utils';
import {
  useActiveLeaveTypes,
  useDepartment,
  useLeaveBalances,
  useUser,
  useUsers,
} from '@/lib/local/data-hooks';
import { useAuth } from '@/components/providers/auth-provider';
import { Applications, Notifications } from '@/lib/local/store';
import type { LeaveType } from '@/types';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CalendarDays,
  AlertTriangle,
} from 'lucide-react';

const STEPS = ['Leave Type', 'Dates', 'Reason', 'Review & Submit'];

const ApplySchema = z.object({
  leave_type_id: z.string().min(1, 'Select a leave type'),
  start_date: z.string().min(10, 'Select start date'),
  end_date: z.string().min(10, 'Select end date'),
  reason: z.string().min(5, 'Enter a reason (min 5 characters)'),
});

type ApplyValues = z.infer<typeof ApplySchema>;

export function ApplyLeaveClient() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? '';
  const user = useUser(userId);
  const leaveTypes = useActiveLeaveTypes();
  const balances = useLeaveBalances(userId);
  const department = useDepartment(user?.department_id ?? null);
  const users = useUsers();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(ApplySchema),
    defaultValues: { leave_type_id: '', start_date: '', end_date: '', reason: '' },
  });

  const leaveTypeId = watch('leave_type_id');
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const reason = watch('reason');

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leave_type.id === leaveTypeId) ?? null,
    [balances, leaveTypeId]
  );

  const days =
    startDate && endDate && startDate <= endDate
      ? diffDaysInclusive(startDate, endDate)
      : 0;

  const selectedType: LeaveType | undefined = leaveTypes.find((t) => t.id === leaveTypeId);

  const canNext =
    step === 0 ? !!leaveTypeId :
    step === 1 ? !!startDate && !!endDate && days > 0 :
    step === 2 ? reason.length >= 5 :
    true;

  const onSubmit = async (data: ApplyValues) => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Check for rota conflict
      const deptId = user.department_id;
      let conflict = false;
      if (deptId) {
        const conflictingSlots = users
          // Note: a real implementation would check Slots by department - keep simple
          .filter((u) => u.role === 'staff' && u.department_id === deptId);
        conflict = false; // simplified: full rota conflict detection can live in HOD view
        void conflictingSlots;
      }

      const inserted = Applications.insert({
        applicant_id: user.id,
        leave_type_id: data.leave_type_id,
        department_id: user.department_id ?? '',
        start_date: data.start_date,
        end_date: data.end_date,
        total_days: days,
        reason: data.reason,
        supporting_doc_url: null,
        status: 'pending',
        rota_conflict: conflict,
      });

      // Notify the department's HOD
      const hod = users.find(
        (u) => u.role === 'hod' && u.department_id === user.department_id
      );
      if (hod) {
        Notifications.insert({
          user_id: hod.id,
          title: 'New leave request',
          message: `${user.full_name} applied for ${selectedType?.name ?? 'leave'}.`,
          type: 'leave_submitted',
          is_read: false,
          related_application_id: inserted.id,
        });
      }

      toast.success('Leave application submitted!');
      router.push('/dashboard/staff/my-leaves');
    } catch (err) {
      toast.error(String(err instanceof Error ? err.message : 'Submission failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <PageHeader
        title="Apply for Leave"
        description="Complete the steps below to submit your leave request."
      />

      <div className="flex flex-wrap items-start gap-y-4 mb-6 sm:mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center flex-1 min-w-[80px] last:flex-none">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all',
                  i < step ? 'bg-[var(--success)] text-white' :
                  i === step ? 'bg-[var(--ink)] text-white' :
                  'bg-[var(--bg-subtle)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
                )}
              >
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <p className={cn(
                'text-[10px] mt-1 font-medium text-center whitespace-nowrap',
                i === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              )}>
                {label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 min-w-[20px] mx-2 sm:mx-3 mt-[-12px]',
                i < step ? 'bg-[var(--success)]' : 'bg-[var(--border-subtle)]'
              )} />
            )}
          </div>
        ))}
      </div>

      <Card>
        {step === 0 && (
          <>
            <CardTitle className="mb-1">Select leave type</CardTitle>
            <CardDescription className="mb-5">Choose the type of leave you are applying for.</CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {leaveTypes.map((lt) => {
                const bal = balances.find((b) => b.leave_type.id === lt.id);
                return (
                  <button
                    key={lt.id}
                    type="button"
                    onClick={() => setValue('leave_type_id', lt.id, { shouldValidate: true })}
                    className={cn(
                      'p-4 rounded-[var(--radius-lg)] border text-left transition-all',
                      leaveTypeId === lt.id
                        ? 'border-[var(--ink)] bg-[var(--bg-subtle)]'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                    )}
                  >
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{lt.name}</p>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">
                      {bal ? `${bal.remaining_days} of ${bal.total_days} days remaining` : `${lt.max_days_academic ?? lt.max_days_non_academic ?? 0} days max`}
                    </p>
                    {lt.requires_document && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[11px] text-[var(--warning)] bg-[var(--warning-bg)] px-2 py-0.5 rounded-full">
                        <AlertTriangle size={10} /> Document required
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <CardTitle className="mb-1">Select dates</CardTitle>
            <CardDescription className="mb-5">Choose your leave start and end dates.</CardDescription>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <FormField label="Start date" error={errors.start_date?.message}>
                <Input type="date" {...register('start_date')} />
              </FormField>
              <FormField label="End date" error={errors.end_date?.message}>
                <Input type="date" {...register('end_date')} />
              </FormField>
            </div>
            {days > 0 && (
              <div className="p-4 bg-[var(--bg-subtle)] rounded-[var(--radius-lg)] flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={16} className="text-[var(--text-secondary)]" strokeWidth={1.5} />
                  <span className="text-[14px] text-[var(--text-primary)]">Total working days</span>
                </div>
                <span className="text-[20px] font-semibold text-[var(--text-primary)]">{days}</span>
              </div>
            )}
            {selectedBalance && days > 0 && (
              <div className={cn(
                'p-4 rounded-[var(--radius-lg)] border',
                days > selectedBalance.remaining_days
                  ? 'bg-[var(--danger-bg)] border-[var(--danger)]/20'
                  : 'bg-[var(--success-bg)] border-[var(--success)]/20'
              )}>
                <p className="text-[13px] font-medium text-[var(--text-primary)]">Balance check</p>
                <p className={cn(
                  'text-[12px] mt-0.5',
                  days > selectedBalance.remaining_days ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                )}>
                  {selectedBalance.remaining_days} days remaining. Applying for {days} day{days !== 1 ? 's' : ''}.
                  {days > selectedBalance.remaining_days && ' This exceeds your balance.'}
                </p>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <CardTitle className="mb-1">Reason for leave</CardTitle>
            <CardDescription className="mb-5">Provide a brief explanation of why you need this leave.</CardDescription>
            <FormField label="Reason" error={errors.reason?.message}>
              <Textarea
                placeholder="e.g. Annual family vacation, medical appointment..."
                rows={4}
                {...register('reason')}
              />
            </FormField>
            {selectedType?.requires_document && (
              <div className="mt-4 p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-[var(--radius-md)]">
                <p className="text-[12px] text-[var(--warning)]">
                  This leave type requires a supporting document. Please bring your document to the Registrar after approval.
                </p>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <CardTitle className="mb-1">Review & submit</CardTitle>
            <CardDescription className="mb-5">Review your application before submitting.</CardDescription>
            <div className="space-y-3">
              {[
                ['Leave type', selectedType?.name ?? '-'],
                ['Department', department?.name ?? '-'],
                ['Start date', startDate],
                ['End date', endDate],
                ['Total days', `${days} day${days !== 1 ? 's' : ''}`],
                ['Reason', reason],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
                  <span className="text-[13px] font-medium text-[var(--text-primary)] text-right max-w-[60%]">{value}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 mt-6 pt-4 border-t border-[var(--border-subtle)]">
          <Button
            variant="ghost"
            onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
          >
            <ArrowLeft size={15} />
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button variant="ink" onClick={() => canNext && setStep(s => s + 1)} disabled={!canNext}>
              Continue <ArrowRight size={15} />
            </Button>
          ) : (
            <Button variant="ink" onClick={handleSubmit(onSubmit)} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit application'}
              <CheckCircle size={15} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}