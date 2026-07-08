import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isDemoMode } from '@/lib/utils';

let browserClient: SupabaseClient | null = null;

/**
 * Browser-side Supabase client. Reads NEXT_PUBLIC_SUPABASE_URL and the
 * anon key from the environment. In demo mode this returns a stub client
 * - UI code should still call supabase.from(...) which throws a clear error
 * directing the developer to configure env vars.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (isDemoMode()) {
    throw new Error(
      'Supabase is not configured. The app is running in demo mode against the in-memory mock dataset. ' +
        'See .env.example for the variables to set.'
    );
  }
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}