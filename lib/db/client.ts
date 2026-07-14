import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the SERVICE ROLE key.
 *
 * All database access in this app is server-side (Server Components, Server
 * Actions, the NextAuth authorize callback) via this client. The service role
 * bypasses RLS (RLS is disabled anyway - see migration 002). Authorization is
 * enforced in the application layer using the NextAuth session (lib/authz.ts).
 *
 * NEVER import this module from a Client Component. It is marked 'server-only'
 * so any accidental client import fails the build.
 */

let _client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY in your .env.local, then run the migration (supabase/migrations) and the seed script (scripts/seed.ts).'
    );
  }
  _client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}
