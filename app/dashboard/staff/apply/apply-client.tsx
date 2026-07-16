'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/stat-card';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, FormField, Textarea } from '@/components/ui/input';
import { cn, workingDaysInclusive } from '@/lib/utils';
import { applyLeaveAction } from '@/app/actions/leave';
import { documentLabelFor } from '@/lib/leave-docs';
import type { Department, LeaveBalance, LeaveType, User } from '@/types';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  CalendarDays,
  AlertTriangle,
  UserCheck,
  FileText,
} from 'lucide-react';

const STEPS = ['Leave Type', 'Dates', 'Reason', 'Cover Staff', 'Review & Submit'];

const ApplySchema = z.object({
  leave_type_id: z.string().min(1, 'Select a leave type'),
  start_date: z.string().min(10, 'Select start date'),
  end_date: z.string().min(10, 'Select end date'),
  reason: z.string().min(5, 'Enter a reason (min 5 characters)'),
  destination: z.string(),
  cover_staff_id: z.string().min(1, 'Select a staff member to cover you'),
});

type ApplyValues = z.infer<typeof ApplySchema>;

/** Date ranges overlap when startA <= endB && startB <= endA (inclusive). */
function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function ApplyLeaveClient({
  leaveTypes,
  balances,
  department,
  applicant,
  coverCandidates,
  slotRanges,
}: {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  department: Department | null;
  applicant: User | null;
  coverCandidates: User[];
  slotRanges: { slot_start: string; slot_end: string }[];
}) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // File state lives outside react-hook-form: Files can't round-trip through
  // zod resolvers / form serialization cleanly, so we keep it as native state
  // and append it to the FormData at submit time.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docFile, setDocFile] = useState<File | null>(null);

  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplyValues>({
    resolver: zodResolver(ApplySchema),
    defaultValues: {
      leave_type_id: '',
      start_date: '',
      end_date: '',
      reason: '',
      destination: '',
      cover_staff_id: '',
    },
  });

  const leaveTypeId = watch('leave_type_id');
  const startDate = watch('start_date');
  const endDate = watch('end_date');
  const reason = watch('reason');
  const destination = watch('destination');
  const coverStaffId = watch('cover_staff_id');

  const selectedBalance = useMemo(
    () => balances.find((b) => b.leave_type.id === leaveTypeId) ?? null,
    [balances, leaveTypeId]
  );

  const days =
    startDate && endDate && startDate <= endDate
      ? workingDaysInclusive(startDate, endDate)
      : 0;

  const selectedType: LeaveType | undefined = leaveTypes.find((t) => t.id === leaveTypeId);

  // Cover candidates are resolved server-side and passed in as props.
  const selectedCover = useMemo(
    () => coverCandidates.find((u) => u.id === coverStaffId) ?? null,
    [coverCandidates, coverStaffId]
  );

  // Rota-conflict warning from the published departmental slots (authoritative
  // check also runs in applyLeaveAction on the server).
  const rotaConflict = useMemo(() => {
    if (!startDate || !endDate || startDate > endDate) return false;
    if (slotRanges.length === 0) return false;
    return slotRanges.some((s) => rangesOverlap(startDate, endDate, s.slot_start, s.slot_end));
  }, [slotRanges, startDate, endDate]);

  const isCasual = selectedType?.name.toLowerCase() === 'casual leave';

  const canNext =
    step === 0 ? !!leaveTypeId :
    step === 1 ? !!startDate && !!endDate && days > 0 :
    step === 2 ? reason.length >= 5 && (!isCasual || destination.trim().length > 0)
                  && (!selectedType?.requires_document || !!docFile) :
    step === 3 ? !!coverStaffId :
    true;

  const onSubmit = async (data: ApplyValues) => {
    if (selectedType?.requires_document && !docFile) {
      toast.error('A supporting document is required for this leave type.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set('leave_type_id', data.leave_type_id);
      fd.set('start_date', data.start_date);
      fd.set('end_date', data.end_date);
      fd.set('reason', data.reason);
      fd.set('destination', data.destination ?? '');
      fd.set('cover_staff_id', data.cover_staff_id);
      if (docFile) fd.set('file', docFile);

      const result = await applyLeaveAction(fd);
      if (result.ok) {
        toast.success('Leave application submitted!');
        router.push('/dashboard/staff/my-leaves');
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Submission failed');
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
          <div key={label} className="flex items-center flex-1 min-w-[72px] last:flex-none">
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
                'text-[9px] sm:text-[10px] mt-1 font-medium text-center whitespace-nowrap',
                i === step ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
              )}>
                {label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                'h-0.5 flex-1 min-w-[16px] mx-1.5 sm:mx-2.5 mt-[-12px]',
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
                      {bal ? `${bal.remaining_days} of ${bal.total_days} working days remaining` : `${lt.max_days_academic ?? lt.max_days_non_academic ?? 0} days max`}
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
            <CardDescription className="mb-5">Choose your leave start and end dates. Weekends are not counted.</CardDescription>
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
            {rotaConflict && (
              <div className="p-3 mb-4 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-[var(--radius-md)] flex items-start gap-2">
                <AlertTriangle size={14} className="text-[var(--warning)] mt-0.5 shrink-0" />
                <p className="text-[12px] text-[var(--warning)]">
                  This range overlaps a published departmental rota slot. You can still apply, but your HOD will see a conflict flag.
                </p>
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
                  {selectedBalance.remaining_days} working days remaining. Applying for {days} day{days !== 1 ? 's' : ''}.
                  {days > selectedBalance.remaining_days && ' This exceeds your balance.'}
                </p>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <CardTitle className="mb-1">Reason for leave</CardTitle>
            <CardDescription className="mb-5">
              Provide a brief explanation of why you need this leave.
              {isCasual && ' FORM 1A also requires the location where you will be during the leave.'}
            </CardDescription>
            <FormField label="Reason" error={errors.reason?.message}>
              <Textarea
                placeholder="e.g. Annual family vacation, medical appointment..."
                rows={4}
                {...register('reason')}
              />
            </FormField>
            {isCasual && (
              <FormField label="Destination" error={errors.destination?.message} className="mt-4">
                <Input
                  placeholder="e.g. Kaduna, Nigeria"
                  {...register('destination')}
                />
              </FormField>
            )}
            {selectedType?.requires_document && (
              <div className="mt-4">
                <FormField label={`${documentLabelFor(selectedType.name)} (required)`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,application/pdf,image/*"
                    onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    className="block w-full text-[12px] text-[var(--text-primary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-md)] file:border-0 file:text-[12px] file:font-medium file:bg-[var(--bg-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--bg-hover)]"
                  />
                </FormField>
                <p className="mt-1.5 text-[11px] text-[var(--text-tertiary)]">
                  PDF, PNG, JPG, WebP, DOC or DOCX. Max 10 MB.
                </p>
                {docFile && (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-[var(--success)]">
                    <FileText size={12} />
                    {docFile.name}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <CardTitle className="mb-1">Select covering staff</CardTitle>
            <CardDescription className="mb-5">
              Nominate a colleague from {department?.name ?? 'your department'} who will cover your duties while you are away.
            </CardDescription>
            {coverCandidates.length === 0 ? (
              <div className="p-4 bg-[var(--warning-bg)] border border-[var(--warning)]/20 rounded-[var(--radius-md)]">
                <p className="text-[12px] text-[var(--warning)]">
                  No other active staff found in your department to act as cover. Please ask your HOD or Registrar to add one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                {coverCandidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setValue('cover_staff_id', c.id, { shouldValidate: true })}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-[var(--radius-lg)] border text-left transition-all',
                      coverStaffId === c.id
                        ? 'border-[var(--ink)] bg-[var(--bg-subtle)]'
                        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
                    )}
                  >
                    <span className={cn(
                      'w-9 h-9 rounded-full inline-flex items-center justify-center text-[12px] font-semibold shrink-0',
                      coverStaffId === c.id ? 'bg-[var(--ink)] text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                    )}>
                      {c.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-[var(--text-primary)] truncate">{c.full_name}</span>
                      <span className="block text-[11px] text-[var(--text-tertiary)] truncate">{c.staff_id ?? c.email}</span>
                    </span>
                    {coverStaffId === c.id && (
                      <UserCheck size={16} className="ml-auto text-[var(--ink)] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <CardTitle className="mb-1">Review & submit</CardTitle>
            <CardDescription className="mb-5">Review your application before submitting.</CardDescription>
            <div className="space-y-3">
              {[
                ['Applicant', applicant?.full_name ?? '-'],
                ['Staff ID', applicant?.staff_id ?? '-'],
                ['Rank', applicant?.rank ?? '-'],
                ['Department', department?.name ?? '-'],
                ['Leave type', selectedType?.name ?? '-'],
                ['Start date', startDate],
                ['End date', endDate],
                ['Working days', `${days} day${days !== 1 ? 's' : ''}`],
                ...(isCasual ? [['Destination', destination] as [string, string]] : []),
                ['Covering staff', selectedCover?.full_name ?? '-'],
                ['Reason', reason],
                ...(selectedType?.requires_document && docFile
                  ? [['Document', `${documentLabelFor(selectedType.name)} — ${docFile.name}`] as [string, string]]
                  : []),
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
