/**
 * Supabase service-role client.
 *
 * Bypasses RLS — use ONLY in server-side code (API routes, local scripts).
 * Never import this from a `'use client'` module.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in the environment.
 */

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

export function createAdminClient(): SupabaseClient {
  if (cached) return cached

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL 환경변수가 설정되어 있지 않습니다.')
  }
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되어 있지 않습니다. ' +
        'Supabase Dashboard → Project Settings → API → service_role key를 .env.local에 추가하세요.',
    )
  }

  cached = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return cached
}
