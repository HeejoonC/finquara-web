/**
 * POST /api/jobs/ai-scrape
 *
 * OpenRouter(DeepSeek)로 계리사 채용공고를 검색하고 Supabase 에 저장한다.
 * 진행 상황은 SSE 로 흘려보낸다.
 *
 * autoUpload=true 이면 job_imports(approved) + jobs 를 함께 만든다.
 * 로컬에서 Claude Code 구독 토큰으로 돌리려면 `npm run scrape` 를 사용한다.
 *
 * Auth: admin only
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { scrapeActuarialJobs } from '@/lib/ai-import/openrouter'
import type { ScrapeConfig, ScrapeEvent } from '@/lib/ai-import/types'

export const maxDuration = 300 // 5 min — Vercel 함수 실행 한도

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
  let body: Partial<ScrapeConfig>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const scrapeConfig: ScrapeConfig = {
    keywords: Array.isArray(body.keywords) && body.keywords.length
      ? body.keywords
      : ['보험계리사', 'actuary', 'actuarial'],
    locations: Array.isArray(body.locations) && body.locations.length
      ? body.locations
      : ['Korea', 'Hong Kong', 'Singapore'],
    maxJobs: typeof body.maxJobs === 'number' && body.maxJobs > 0 && body.maxJobs <= 50
      ? body.maxJobs
      : 15,
    autoUpload: body.autoUpload !== false,   // 기본 자동 업로드
    autoPublish: body.autoPublish === true,  // 기본 비공개
  }

  // ── 사전 점검 (스트림을 열기 전에 명확한 에러를 돌려준다) ───────────────
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY 환경변수가 설정되어 있지 않습니다. .env.local에 추가해주세요.' },
      { status: 500 },
    )
  }
  if (scrapeConfig.autoUpload && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: '자동 업로드에는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.' },
      { status: 500 },
    )
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

  // ── Run scraping (don't await — let SSE stream) ───────────────────────
  ;(async () => {
    try {
      // 저장은 RLS를 우회해야 하므로 service-role 클라이언트를 쓴다.
      // 접근 권한은 위 admin 체크로 이미 검증했다.
      const admin = createAdminClient()
      await scrapeActuarialJobs(admin, scrapeConfig, send, user.id)
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
