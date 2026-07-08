import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/utils';

/**
 * Per-request Supabase server client. Reads/writes session cookies.
 * Always create a new instance per request - never cache across requests.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  if (isDemoMode()) {
    throw new Error(
      'Supabase is not configured. The app is running in demo mode.'
    );
  }
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies. The auth middleware (proxy.ts)
            // handles session refresh - we silently ignore here.
          }
        },
      },
    }
  );
}

/**
 * Service-role client. Bypasses RLS. NEVER expose to the client.
 * Use only for trusted server-side admin actions (approve user, send email, etc).
 */
export function getSupabaseServiceClient(): SupabaseClient {
  if (isDemoMode()) {
    throw new Error('Supabase service client unavailable in demo mode.');
  }
  // Lazy-import to avoid loading the service role on every request.
  // The createClient constructor doesn't need cookie plumbing on the server.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}