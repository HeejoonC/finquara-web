/**
 * Finquara — 계리사 채용공고 자동 수집 (Claude Code 구독 토큰 사용)
 *
 * @anthropic-ai/claude-agent-sdk 는 Claude Code CLI 를 서브프로세스로 띄우고
 * 로컬에 저장된 Claude Code 로그인 자격증명을 그대로 사용한다.
 * → ANTHROPIC_API_KEY(종량 과금) 없이 구독 토큰으로 동작한다.
 *
 * 사용법:
 *   npm run scrape                          # 기본값으로 실행
 *   npm run scrape -- --max 30              # 목표 30건
 *   npm run scrape -- --keywords "보험계리사,actuary" --locations "Korea,Singapore"
 *   npm run scrape -- --publish             # 수집 즉시 사이트에 공개 (기본은 비공개)
 *   npm run scrape -- --pending             # 자동 업로드 없이 검토 대기로만 저장
 *   npm run scrape -- --dry-run             # DB 저장 없이 어떤 공고를 찾는지만 확인
 *
 * 사전 준비:
 *   1) `claude` CLI 로그인 (claude 실행 후 /login)
 *   2) .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createSdkMcpServer, query, tool } from '@anthropic-ai/claude-agent-sdk'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { saveScrapedJob, saveStatusIcon } from '@/lib/ai-import/store'
import { buildScrapeInstruction, buildTaxonomyGuide } from '@/lib/ai-import/taxonomy'
import type { JobImportInput, SaveResult, ScrapeConfig } from '@/lib/ai-import/types'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'

const MODEL = 'claude-sonnet-5'
const AI_MODEL_LABEL = `claude-code:${MODEL}`

// ── .env.local 로드 (Next.js 밖에서 실행되므로 직접 읽는다) ────────────────

function loadEnvLocal() {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), 'utf8')
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
        if (!match) continue
        const [, key, rawValue] = match
        if (process.env[key] !== undefined) continue
        process.env[key] = rawValue.replace(/^["']|["']$/g, '')
      }
    } catch {
      // 파일이 없으면 무시
    }
  }
}

// ── CLI 인자 파싱 ─────────────────────────────────────────────────────────

interface CliOptions extends ScrapeConfig {
  dryRun: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const get = (name: string): string | undefined => {
    const index = argv.indexOf(`--${name}`)
    return index >= 0 ? argv[index + 1] : undefined
  }
  const has = (name: string) => argv.includes(`--${name}`)

  const list = (value: string | undefined, fallback: string[]) =>
    value ? value.split(',').map(s => s.trim()).filter(Boolean) : fallback

  const maxRaw = Number(get('max'))

  return {
    keywords: list(get('keywords'), ['보험계리사', '계리사 채용', 'actuary', 'actuarial analyst']),
    locations: list(get('locations'), ['Korea', 'Hong Kong', 'Singapore']),
    maxJobs: Number.isFinite(maxRaw) && maxRaw > 0 ? Math.min(maxRaw, 50) : 15,
    autoUpload: !has('pending'),
    autoPublish: has('publish'),
    dryRun: has('dry-run'),
  }
}

// ── 실행 ──────────────────────────────────────────────────────────────────

async function main() {
  loadEnvLocal()

  const options = parseArgs(process.argv.slice(2))
  const supabase = options.dryRun ? null : createAdminClient()

  const counters: Record<SaveResult['status'], number> = {
    uploaded: 0, pending: 0, duplicate: 0, invalid: 0, error: 0,
  }
  const seen = new Set<string>()

  console.log('🤖 Finquara AI 채용공고 수집')
  console.log(`   모델        : ${MODEL} (Claude Code 구독 토큰)`)
  console.log(`   키워드      : ${options.keywords.join(', ')}`)
  console.log(`   지역        : ${options.locations.join(', ')}`)
  console.log(`   목표 건수   : ${options.maxJobs}`)
  console.log(
    `   저장 방식   : ${
      options.dryRun
        ? 'dry-run (저장 안 함)'
        : options.autoUpload
          ? `자동 업로드 (${options.autoPublish ? '즉시 공개' : '비공개'})`
          : '검토 대기(pending)로만 저장'
    }`,
  )
  console.log('')

  // Claude 가 호출할 저장 도구 — 프로세스 안에서 바로 Supabase 에 기록한다
  const saveJobTool = tool(
    'save_job',
    '발견한 계리사 채용공고를 Finquara DB에 저장한다. 공고 하나당 한 번씩 호출할 것. ' +
      '중복 공고는 서버가 알아서 걸러내므로 애매하면 저장을 시도해도 된다.',
    {
      title: z.string().describe('정확한 채용 직책명 (원문 그대로)'),
      company: z.string().describe('회사명 (원문 그대로)'),
      location: z.string().describe('근무 지역. 예: Seoul, Korea / Hong Kong / Singapore / Remote'),
      main_specializations: z
        .array(z.enum(MAIN_SPECIALIZATIONS))
        .describe('보험권역 분류 (복수 선택 가능)'),
      detailed_specialties: z
        .array(z.enum(DETAILED_SPECIALTIES))
        .describe('세부 직무분야 (최대 3개 권장)'),
      experience_level: z.enum(EXPERIENCE_LEVELS).describe('요구 경력 수준'),
      employment_type: z.enum(EMPLOYMENT_TYPES).describe('고용 형태'),
      salary_range: z.string().describe('연봉 또는 급여 정보. 없으면 "협의"'),
      description: z.string().describe('채용 내용 요약 3~6문장 (국내 공고는 한국어, 해외는 영어)'),
      apply_url: z.string().describe('실제 지원 가능한 공고 URL. 추측 금지'),
      source_url: z.string().describe('이 정보를 찾은 페이지 URL'),
      source_site: z.string().describe('출처 사이트명. 예: 사람인, 잡코리아, LinkedIn, JobsDB HK'),
      ai_notes: z.string().describe('분야 매핑 근거와 검토 시 주의사항을 간략히'),
    },
    async (input) => {
      const raw = input as unknown as Partial<JobImportInput>

      if (!supabase) {
        console.log(`🔎 [dry-run] ${raw.title} @ ${raw.company} — ${raw.apply_url}`)
        counters.pending++
        return { content: [{ type: 'text' as const, text: 'dry-run: 저장하지 않고 기록만 했습니다.' }] }
      }

      const result = await saveScrapedJob(supabase, raw, AI_MODEL_LABEL, {
        autoUpload: options.autoUpload,
        autoPublish: options.autoPublish,
        seen,
      })

      counters[result.status]++
      console.log(`${saveStatusIcon(result.status)} ${result.message}`)

      return { content: [{ type: 'text' as const, text: `[${result.status}] ${result.message}` }] }
    },
  )

  const finquaraTools = createSdkMcpServer({
    name: 'finquara',
    version: '1.0.0',
    instructions: '채용공고를 Finquara DB에 저장하는 도구 모음',
    tools: [saveJobTool],
  })

  const systemPrompt = [
    'You are an expert actuarial job market researcher for Finquara, a Korean actuarial job platform.',
    '',
    '웹 검색(WebSearch)과 페이지 열람(WebFetch)으로 실제 채용공고를 확인한 뒤,',
    'mcp__finquara__save_job 도구로 저장하는 것이 당신의 임무입니다.',
    '절대 추측으로 공고를 만들어내지 마세요. 실제로 확인한 공고만 저장합니다.',
    '',
    buildTaxonomyGuide(),
  ].join('\n')

  const response = query({
    prompt: buildScrapeInstruction(options),
    options: {
      model: MODEL,
      systemPrompt,
      mcpServers: { finquara: finquaraTools },
      // 파일시스템/셸 접근 없이 웹 검색과 저장 도구만 허용한다
      allowedTools: ['WebSearch', 'WebFetch', 'mcp__finquara__save_job'],
      disallowedTools: ['Bash', 'Write', 'Edit', 'Read', 'Glob', 'Grep', 'Task', 'NotebookEdit'],
      permissionMode: 'bypassPermissions',
      settingSources: [],
      maxTurns: 120,
    },
  })

  let finalSummary = ''

  for await (const message of response) {
    if (message.type === 'assistant') {
      for (const block of message.message.content) {
        if (block.type === 'text' && block.text.trim()) {
          finalSummary = block.text.trim()
        }
      }
    } else if (message.type === 'result') {
      if (message.subtype !== 'success') {
        console.error(`\n⚠️ 세션이 정상 종료되지 않았습니다: ${message.subtype}`)
      }
    }
  }

  const total = counters.uploaded + counters.pending
  console.log('\n' + '─'.repeat(60))
  if (options.dryRun) {
    console.log(`dry-run 완료 — 공고 ${total}건 발견 (DB에 저장하지 않았습니다)`)
  } else {
    console.log(`수집 완료 — 신규 ${total}건 저장`)
    console.log(
      `  업로드 ${counters.uploaded} · 대기 ${counters.pending} · ` +
        `중복 ${counters.duplicate} · 무효 ${counters.invalid} · 오류 ${counters.error}`,
    )
  }
  if (finalSummary) {
    console.log('\n📝 Claude 요약\n' + finalSummary)
  }
  if (!options.dryRun && options.autoUpload && !options.autoPublish && counters.uploaded > 0) {
    console.log('\n👉 /admin/jobs 에서 게시 여부를 확인하세요 (현재 비공개 상태).')
  }

  process.exit(counters.error > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('\n❌ 실행 실패:', err instanceof Error ? err.message : err)
  if (err instanceof Error && /credential|login|auth/i.test(err.message)) {
    console.error('   → 터미널에서 `claude` 를 실행하고 /login 으로 로그인했는지 확인하세요.')
  }
  process.exit(1)
})
