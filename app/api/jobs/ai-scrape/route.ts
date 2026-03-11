/**
 * POST /api/jobs/ai-scrape
 *
 * Streams SSE events while Claude searches for actuarial job postings.
 * Each found job is saved to the `job_imports` table in Supabase.
 *
 * Auth: admin only (checked via Supabase)
 * Response: text/event-stream (Server-Sent Events)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeActuarialJobs } from '@/lib/ai-import/claude'
import type { ScrapeConfig, ScrapeEvent, JobImportInput } from '@/lib/ai-import/types'

export const maxDuration = 300 // 5 min — Vercel Pro/hobby limit

export async function POST(request: Request) {
  // ── Auth check ─────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse config ───────────────────────────────────────────────────────
  let config: ScrapeConfig
  try {
    config = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate and set defaults
  const scrapeConfig: ScrapeConfig = {
    keywords: Array.isArray(config.keywords) && config.keywords.length
      ? config.keywords
      : ['보험계리사', 'actuary', 'actuarial'],
    locations: Array.isArray(config.locations) && config.locations.length
      ? config.locations
      : ['Korea', 'Hong Kong', 'Singapore'],
    maxJobs: typeof config.maxJobs === 'number' && config.maxJobs > 0 && config.maxJobs <= 50
      ? config.maxJobs
      : 15,
  }

  // ── SSE Stream setup ───────────────────────────────────────────────────
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()

  const send = async (event: ScrapeEvent) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
    } catch {
      // client disconnected
    }
  }

  // ── Save job to Supabase ───────────────────────────────────────────────
  const saveJob = async (input: JobImportInput) => {
    const { error } = await supabase.from('job_imports').insert({
      title:                input.title,
      company:              input.company,
      location:             input.location || null,
      main_specializations: input.main_specializations || [],
      detailed_specialties: input.detailed_specialties || [],
      experience_level:     input.experience_level || null,
      employment_type:      input.employment_type || null,
      salary_range:         input.salary_range || null,
      description:          input.description || null,
      apply_url:            input.apply_url || null,
      source_url:           input.source_url || null,
      source_site:          input.source_site || null,
      ai_notes:             input.ai_notes || null,
      ai_model:             'claude-sonnet-4-6',
      status:               'pending',
    })
    if (error) {
      await send({ type: 'status', message: `⚠️ DB 저장 오류: ${error.message}` })
    }
  }

  // ── Run async scraping (don't await — let SSE stream) ─────────────────
  ;(async () => {
    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        await send({
          type: 'error',
          message: 'ANTHROPIC_API_KEY 환경변수가 설정되어 있지 않습니다. .env.local에 추가해주세요.',
        })
        await writer.close()
        return
      }

      for await (const job of scrapeActuarialJobs(scrapeConfig, send)) {
        await saveJob(job)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await send({ type: 'error', message: `오류 발생: ${msg}` })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',  // disable nginx buffering
    },
  })
}
