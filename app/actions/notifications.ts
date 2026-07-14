'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { Notifications } from '@/lib/db';

export async function markNotificationReadAction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  await Notifications.markRead(id);
  revalidatePath('/dashboard', 'layout');
  return { ok: true as const };
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const };
  await Notifications.markAllRead(session.user.id);
  revalidatePath('/dashboard', 'layout');
  return { ok: true as const };
}
