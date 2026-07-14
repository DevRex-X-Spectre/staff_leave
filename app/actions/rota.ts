'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Notifications, Rotas, Slots, Users } from '@/lib/db';

export async function publishRotaAction(input: {
  departmentId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  maxConcurrent: number;
  notes: string | null;
  slots: Array<{
    userId: string;
    slotStart: string;
    slotEnd: string;
    leaveTypeId: string | null;
  }>;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== 'hod') {
    return { ok: false as const, message: 'Only an HOD can do this.' };
  }
  if (user.departmentId !== input.departmentId) {
    return { ok: false as const, message: 'Not your department.' };
  }
  if (!input.title.trim() || !input.periodStart || !input.periodEnd) {
    return { ok: false as const, message: 'Fill in title, period start and period end.' };
  }
  const validSlots = input.slots.filter((s) => s.userId && s.slotStart && s.slotEnd);
  if (validSlots.some((s) => s.slotStart > s.slotEnd)) {
    return { ok: false as const, message: 'Slot start must be before slot end.' };
  }

  const rota = await Rotas.insert({
    department_id: input.departmentId,
    title: input.title.trim(),
    period_start: input.periodStart,
    period_end: input.periodEnd,
    max_concurrent: input.maxConcurrent,
    published_by: user.id,
    notes: input.notes?.trim() || null,
  });

  for (const s of validSlots) {
    await Slots.insert({
      rota_id: rota.id,
      user_id: s.userId,
      slot_start: s.slotStart,
      slot_end: s.slotEnd,
      leave_type_id: s.leaveTypeId,
    });
  }

  // Notify department staff.
  const staff = (await Users.byDepartment(input.departmentId)).filter(
    (u) => u.role === 'staff' && u.is_active
  );
  await Promise.all(
    staff.map((s) =>
      Notifications.insert({
        user_id: s.id,
        title: 'Rota published',
        message: `${rota.title} has been published for the period ${input.periodStart} - ${input.periodEnd}.`,
        type: 'rota_published',
        is_read: false,
        related_application_id: null,
      })
    )
  );

  revalidatePath('/dashboard/hod/rota');
  revalidatePath('/dashboard/staff/rota');
  revalidatePath('/dashboard/hod/calendar');
  return { ok: true as const, id: rota.id };
}

export async function addRotaSlotAction(input: {
  rotaId: string;
  userId: string;
  slotStart: string;
  slotEnd: string;
  leaveTypeId: string | null;
}) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== 'hod') {
    return { ok: false as const, message: 'Only an HOD can do this.' };
  }
  await Slots.insert({
    rota_id: input.rotaId,
    user_id: input.userId,
    slot_start: input.slotStart,
    slot_end: input.slotEnd,
    leave_type_id: input.leaveTypeId,
  });
  revalidatePath('/dashboard/hod/rota');
  revalidatePath('/dashboard/staff/rota');
  revalidatePath('/dashboard/hod/calendar');
  return { ok: true as const };
}

export async function removeRotaSlotAction(slotId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user?.id || user.role !== 'hod') {
    return { ok: false as const, message: 'Only an HOD can do this.' };
  }
  await Slots.remove(slotId);
  revalidatePath('/dashboard/hod/rota');
  revalidatePath('/dashboard/staff/rota');
  revalidatePath('/dashboard/hod/calendar');
  return { ok: true as const };
}
