import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind utility classes with conflict resolution.
 * Standard shadcn-style helper used across all UI components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date / ISO string as a human-friendly short date. */
export function formatDate(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a Date / ISO string as a long readable date (e.g. "26 Jun 2026"). */
export function formatDateLong(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Return "YYYY-MM-DD" for a Date (used as <input type="date"> defaultValue). */
export function toDateInputValue(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  return d.toISOString().split('T')[0];
}

/** Days inclusive of both start and end. */
export function diffDaysInclusive(start: string | Date, end: string | Date): number {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;
  const ms = e.setHours(0, 0, 0, 0) - s.setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000) + 1;
}

/**
 * Working days (Mon-Fri) inclusive of both start and end dates. This is how
 * NAUB counts leave - weekends are not deducted from a staff member's balance.
 * Public holidays are NOT modelled here; they can be added as a holiday
 * calendar in a later iteration.
 *
 * `end` is treated as inclusive (a leave starting and ending the same weekday
 * counts as 1 working day).
 */
export function workingDaysInclusive(start: string | Date, end: string | Date): number {
  const s = typeof start === 'string' ? new Date(start + 'T00:00:00') : new Date(start);
  const e = typeof end === 'string' ? new Date(end + 'T00:00:00') : new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  if (e < s) return 0;
  let count = 0;
  const cursor = new Date(s);
  while (cursor <= e) {
    const day = cursor.getDay(); // 0 = Sun, 6 = Sat
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

/** Human-readable relative time, e.g. "2 hours ago". */
export function timeAgo(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

/** Title-case helper used for staff names. */
export function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Type-safe random ID for mock data. */
export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36).slice(-4)
  );
}

/** Check if Supabase is configured (URL + anon key both present). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_')
  );
}

/** Application is in demo (mock) mode when Supabase is not configured. */
export function isDemoMode(): boolean {
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return false;
  return !isSupabaseConfigured();
}