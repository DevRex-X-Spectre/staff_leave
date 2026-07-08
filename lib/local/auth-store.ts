'use client';

import type { StaffType, User, UserRole } from '@/types';
import { DEFAULT_PASSWORD } from './constants';
import { UAR, Users, Passwords, Session } from './store';

/**
 * Plaintext-equality authentication against the localStorage password map.
 * Documented as demo-only - passwords here are not hashed, just like the
 * previous in-memory mock. The eventual Supabase migration swaps this for
 * `@supabase/ssr`'s signInWithPassword.
 */

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; message: string };

/**
 * Sign in by staff_id + password. Validates approval + active status.
 * On success, writes the session (localStorage + cookie mirror).
 */
export function loginWithStaffId(
  staffId: string,
  password: string
): AuthResult {
  const user = Users.byStaffId(staffId);
  if (!user) {
    return { ok: false, message: 'Invalid staff ID or password.' };
  }
  const stored = Passwords.get(user.id);
  if (!stored || stored !== password) {
    return { ok: false, message: 'Invalid staff ID or password.' };
  }
  if (!user.is_approved) {
    return {
      ok: false,
      message: 'Your account is awaiting admin approval.',
    };
  }
  if (!user.is_active) {
    return {
      ok: false,
      message: 'Your account is currently deactivated. Contact an admin.',
    };
  }
  Session.set(user);
  return { ok: true, user };
}

/**
 * Change the current user's password. Verifies the current password before
 * persisting the new one. Returns `{ ok: false, message }` on mismatch.
 */
export function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): { ok: true } | { ok: false; message: string } {
  if (newPassword.length < 8) {
    return {
      ok: false,
      message: 'New password must be at least 8 characters.',
    };
  }
  const stored = Passwords.get(userId);
  if (!stored || stored !== currentPassword) {
    return { ok: false, message: 'Current password is incorrect.' };
  }
  Passwords.set(userId, newPassword);
  return { ok: true };
}

/** Read the currently signed-in user (or null). */
export function getCurrentUser(): User | null {
  const id = Session.getUserId();
  if (!id) return null;
  return Users.byId(id);
}

/** Sign out - clears session + cookie mirrors. */
export function logout() {
  Session.clear();
}

/** Switch the demo user - used by the topbar role-switcher. */
export function switchUser(userId: string): User | null {
  const user = Users.byId(userId);
  if (!user) return null;
  Session.set(user);
  return user;
}

/**
 * Register a new user. Inserts a User row (is_approved: false, is_active: true)
 * plus a pending UserApprovalRequest. Assigns the default password so the
 * user can sign in once an admin approves them.
 */
export type RegisterInput = {
  full_name: string;
  email: string;
  phone: string;
  staff_id: string;
  staff_type: StaffType;
  department_id: string;
  requested_role: Exclude<UserRole, 'admin'>; // 'admin' cannot be self-requested
};

export type RegisterResult =
  | { ok: true; user: User }
  | { ok: false; message: string };

export function registerNewUser(input: RegisterInput): RegisterResult {
  // Validate uniqueness on staff_id and email.
  if (Users.byStaffId(input.staff_id)) {
    return {
      ok: false,
      message: 'A user with that staff ID already exists.',
    };
  }
  if (Users.byEmail(input.email)) {
    return {
      ok: false,
      message: 'A user with that email already exists.',
    };
  }

  const now = new Date().toISOString();
  const id = `user-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`;

  const user: User = {
    id,
    full_name: input.full_name,
    email: input.email,
    phone: input.phone,
    staff_id: input.staff_id,
    role: input.requested_role,
    staff_type: input.staff_type,
    department_id: input.department_id,
    is_approved: false,
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const inserted = Users.insert(user);
  Passwords.set(inserted.id, DEFAULT_PASSWORD);

  UAR.insert({
    user_id: inserted.id,
    requested_role: input.requested_role,
    requested_department_id: input.department_id,
    status: 'pending',
    admin_comment: null,
    reviewed_by: null,
    reviewed_at: null,
  });

  return { ok: true, user: inserted };
}