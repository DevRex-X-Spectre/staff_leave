'use server';

import bcrypt from 'bcryptjs';
import { auth } from '@/auth';
import { Credentials, Users } from '@/lib/db';

export async function changePasswordAction(args: {
  current: string;
  next: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, message: 'Not authenticated.' };
  if (args.next.length < 8) {
    return { ok: false, message: 'New password must be at least 8 characters.' };
  }
  const hash = await Credentials.get(session.user.id);
  if (!hash || !(await bcrypt.compare(args.current, hash))) {
    return { ok: false, message: 'Current password is incorrect.' };
  }
  const newHash = await bcrypt.hash(args.next, 10);
  await Credentials.set(session.user.id, newHash);
  void Users;
  return { ok: true };
}
