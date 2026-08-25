import { Resend } from 'resend'

let client: Resend | null = null

/**
 * Lazy, cached Resend client. Same deal as the Supabase singleton: created on
 * first use so env-less builds (CI) succeed.
 */
export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error('Resend is not configured (missing RESEND_API_KEY)')
  if (!client) client = new Resend(key)
  return client
}
