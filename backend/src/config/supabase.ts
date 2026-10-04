// ─────────────────────────────────────────────────────────────────────────────
// Supabase client singleton — uses the SERVICE ROLE key so it can read/write
// storage buckets server-side without RLS restrictions.
// NEVER expose this client or its key to the frontend.
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env['SUPABASE_URL'];
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables. ' +
        'These are required for Supabase Storage.',
    );
  }

  _client = createClient(url, serviceRoleKey, {
    auth: {
      // Disable auto-refresh / persistence — this is a server-side service client
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return _client;
}
