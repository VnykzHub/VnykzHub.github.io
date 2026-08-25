import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Lazy, cached Supabase client. Created on first use — NOT at module scope —
 * so builds without env vars (CI) succeed. Missing env at request time raises
 * a descriptive error the routes translate into a 503.
 */
export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('Supabase is not configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  if (!client) client = createClient(url, anonKey)
  return client
}
