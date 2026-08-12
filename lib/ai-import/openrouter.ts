/**
 * OpenRouter + DeepSeek 기반 채용공고 스크래퍼 (웹 관리자 페이지용).
 *
 * 로컬 스크립트(scripts/scrape-jobs.ts)는 Claude Code 구독 토큰을 쓰지만,
 * Vercel 같은 서버 환경에서는 CLI 자격증명을 쓸 수 없으므로 이쪽 경로를 사용한다.
 *
 * DeepSeek 은 서버측 웹검색 툴이 없으므로 세 가지 클라이언트 툴을 직접 붙인다:
 *   web_search  — OpenRouter web 플러그인으로 검색 결과(annotations)를 뽑아온다
 *   fetch_page  — 공고 상세 페이지를 직접 받아 텍스트로 변환한다
 *   save_job    — 정규화 후 Supabase 에 저장한다 (중복 제거 + 자동 업로드)
 *
 * 필요 환경변수: OPENROUTER_API_KEY
 * 선택 환경변수: OPENROUTER_MODEL (기본 deepseek/deepseek-v3.2)
 */

import OpenAI from 'openai'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'
import { saveScrapedJob, saveStatusIcon } from './store'
import { buildScrapeInstruction, buildTaxonomyGuide } from './taxonomy'
import type { JobImportInput, SaveResult, ScrapeConfig, ScrapeEvent } from './types'

export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-v3.2'

const MAX_ITERATIONS = 40
const MAX_PAGE_CHARS = 12_000
const SEARCH_RESULTS = 8

function getModel(): string {
  return process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
}

function createClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY 환경변수가 설정되어 있지 않습니다. ' +
        'https://openrouter.ai/keys 에서 키를 발급받아 .env.local 에 추가하세요.',
    )
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://finquara.com',
      'X-Title': 'Finquara Job Scraper',
    },
  })
}

// ── 툴 1: 웹 검색 (OpenRouter web 플러그인) ────────────────────────────────

interface SearchHit {
  title: string
  url: string
  snippet: string
}

/**
 * OpenRouter 의 web 플러그인을 태워 검색 결과만 받아온다.
 * 모델 응답 본문은 쓰지 않고, 첨부되는 url_citation annotation 을 결과로 쓴다.
 */
async function webSearch(client: OpenAI, query: string): Promise<SearchHit[]> {
  const completion = await client.chat.completions.create({
    model: getModel(),
    max_tokens: 400,
    messages: [
      {
        role: 'user',
        content:
          `다음 검색어의 웹 검색 결과를 요약 없이 제목과 URL만 나열하세요: ${query}`,
      },
    ],
    // OpenRouter 전용 파라미터 — OpenAI SDK 타입에는 없으므로 캐스팅해서 전달
    ...({ plugins: [{ id: 'web', max_results: SEARCH_RESULTS }] } as Record<string, unknown>),
  } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming)

  const message = completion.choices[0]?.message as
    | (OpenAI.Chat.Completions.ChatCompletionMessage & {
        annotations?: Array<{ type?: string; url_citation?: { url?: string; title?: string; content?: string } }>
      })
    | undefined

  const hits: SearchHit[] = []
  for (const annotation of message?.annotations ?? []) {
    const citation = annotation.url_citation
    if (!citation?.url) continue
    hits.push({
      title: citation.title?.trim() || citation.url,
      url: citation.url,
      snippet: (citation.content ?? '').slice(0, 500),
    })
  }

  // annotation 이 비어 있으면 모델이 본문에 적어 놓은 URL이라도 건진다
  if (hits.length === 0 && message?.content) {
    const urls = message.content.match(/https?:\/\/[^\s)"'<>]+/g) ?? []
    for (const url of [...new Set(urls)].slice(0, SEARCH_RESULTS)) {
      hits.push({ title: url, url, snippet: '' })
    }
  }

  return hits
}

// ── 툴 2: 페이지 가져오기 ─────────────────────────────────────────────────

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

async function fetchPage(url: string): Promise<string> {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return `잘못된 URL 형식입니다: ${url}`
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return `지원하지 않는 프로토콜입니다: ${parsed.protocol}`
  }

  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!response.ok) {
      return `페이지를 가져오지 못했습니다 (HTTP ${response.status}). 다른 공고를 시도하세요.`
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!/text\/html|text\/plain|application\/json/.test(contentType)) {
      return `본문을 읽을 수 없는 형식입니다 (${contentType}).`
    }

    const text = htmlToText(await response.text())
    if (text.length < 200) {
      return (
        '페이지 본문이 거의 비어 있습니다 (JavaScript 렌더링 사이트일 수 있음). ' +
        '검색 결과 요약을 근거로 판단하거나 다른 출처를 찾으세요.'
      )
    }
    return text.slice(0, MAX_PAGE_CHARS)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    return `페이지 요청 실패: ${reason}. 다른 공고를 시도하세요.`
  }
}

// ── 툴 정의 ───────────────────────────────────────────────────────────────

const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '웹을 검색해 채용공고 후보 링크를 찾는다. 한 번에 하나의 검색어만 넣는다.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '검색어. 예: 사람인 보험계리사 채용' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'fetch_page',
      description: '채용공고 상세 페이지를 열어 본문 텍스트를 읽는다. 저장 전에 반드시 확인할 것.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '읽을 페이지의 전체 URL' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_job',
      description:
        '확인한 계리사 채용공고를 Finquara DB에 저장한다. 공고 하나당 한 번 호출. 중복은 서버가 걸러낸다.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '정확한 채용 직책명 (원문 그대로)' },
          company: { type: 'string', description: '회사명 (원문 그대로)' },
          location: { type: 'string', description: '근무 지역' },
          main_specializations: {
            type: 'array',
            items: { type: 'string', enum: [...MAIN_SPECIALIZATIONS] },
            description: '보험권역 분류 (복수 선택 가능)',
          },
          detailed_specialties: {
            type: 'array',
            items: { type: 'string', enum: [...DETAILED_SPECIALTIES] },
            description: '세부 직무분야 (최대 3개 권장)',
          },
          experience_level: { type: 'string', enum: [...EXPERIENCE_LEVELS], description: '요구 경력' },
          employment_type: { type: 'string', enum: [...EMPLOYMENT_TYPES], description: '고용 형태' },
          salary_range: { type: 'string', description: '급여 정보. 없으면 "협의"' },
          description: { type: 'string', description: '채용 내용 요약 3~6문장' },
          apply_url: { type: 'string', description: '실제 지원 가능한 공고 URL. 추측 금지' },
          source_url: { type: 'string', description: '이 정보를 찾은 페이지 URL' },
          source_site: { type: 'string', description: '출처 사이트명' },
          ai_notes: { type: 'string', description: '분류 근거와 검토 시 주의사항' },
        },
        required: [
          'title', 'company', 'location', 'main_specializations', 'detailed_specialties',
          'experience_level', 'employment_type', 'description', 'apply_url', 'source_url',
          'source_site', 'ai_notes',
        ],
      },
    },
  },
]

// ── 에이전틱 루프 ─────────────────────────────────────────────────────────

export interface ScrapeSummary {
  counters: Record<SaveResult['status'], number>
  iterations: number
}

/**
 * 공고를 검색·확인·저장하는 전체 루프를 돌린다.
 * 진행 상황은 onEvent 로 흘려보낸다 (SSE 로 그대로 전달 가능).
 */
export async function scrapeActuarialJobs(
  supabase: SupabaseClient,
  config: ScrapeConfig,
  onEvent: (event: ScrapeEvent) => void | Promise<void>,
  ownerId?: string | null,
): Promise<ScrapeSummary> {
  const client = createClient()
  const model = getModel()
  const aiModelLabel = `openrouter:${model}`

  const counters: Record<SaveResult['status'], number> = {
    uploaded: 0, pending: 0, duplicate: 0, invalid: 0, error: 0,
  }
  const seen = new Set<string>()

  const systemPrompt = [
    '당신은 Finquara(한국 계리사 채용 플랫폼)의 채용공고 리서처입니다.',
    '',
    'web_search 로 공고를 찾고, fetch_page 로 상세 내용을 확인한 뒤, save_job 으로 저장하세요.',
    '실제로 확인한 공고만 저장합니다. URL이나 회사명을 추측해서 만들어내지 마세요.',
    'fetch_page 가 실패하면 그 공고는 건너뛰고 다른 공고를 찾으세요.',
    '',
    buildTaxonomyGuide(),
  ].join('\n')

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: buildScrapeInstruction(config) },
  ]

  await onEvent({ type: 'status', message: `🔍 ${model} 이(가) 채용공고 검색을 시작합니다...` })

  let iterations = 0

  while (iterations < MAX_ITERATIONS) {
    iterations++

    const completion = await client.chat.completions.create({
      model,
      messages,
      tools: TOOLS,
      max_tokens: 4096,
    })

    const choice = completion.choices[0]
    if (!choice) break

    const assistantMessage = choice.message
    messages.push(assistantMessage)

    const toolCalls = assistantMessage.tool_calls ?? []

    if (toolCalls.length === 0) {
      if (assistantMessage.content?.trim()) {
        await onEvent({ type: 'status', message: `💬 ${assistantMessage.content.trim().slice(0, 500)}` })
      }
      await onEvent({ type: 'status', message: '✅ 검색 완료' })
      break
    }

    for (const call of toolCalls) {
      if (call.type !== 'function') continue

      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: '인자를 JSON으로 해석하지 못했습니다. 올바른 JSON으로 다시 호출하세요.',
        })
        continue
      }

      let toolResult: string

      switch (call.function.name) {
        case 'web_search': {
          const searchQuery = String(args.query ?? '').trim()
          await onEvent({ type: 'status', message: `🔎 검색: ${searchQuery}` })
          try {
            const hits = await webSearch(client, searchQuery)
            toolResult = hits.length
              ? hits.map((h, i) => `${i + 1}. ${h.title}\n   ${h.url}\n   ${h.snippet}`).join('\n\n')
              : '검색 결과가 없습니다. 다른 검색어를 시도하세요.'
          } catch (err) {
            toolResult = `검색 실패: ${err instanceof Error ? err.message : String(err)}`
          }
          break
        }

        case 'fetch_page': {
          const pageUrl = String(args.url ?? '').trim()
          await onEvent({ type: 'status', message: `📄 열람: ${pageUrl}` })
          toolResult = await fetchPage(pageUrl)
          break
        }

        case 'save_job': {
          const result = await saveScrapedJob(
            supabase,
            args as unknown as Partial<JobImportInput>,
            aiModelLabel,
            {
              autoUpload: config.autoUpload,
              autoPublish: config.autoPublish,
              ownerId,
              seen,
            },
          )
          counters[result.status]++

          await onEvent({
            type: 'job_found',
            message: `${saveStatusIcon(result.status)} ${result.message}`,
            result,
            job:
              result.status === 'uploaded' || result.status === 'pending'
                ? {
                    status: config.autoUpload ? 'approved' : 'pending',
                    title: String(args.title ?? ''),
                    company: String(args.company ?? ''),
                    location: (args.location as string) || null,
                    main_specializations: (args.main_specializations ?? []) as never,
                    detailed_specialties: (args.detailed_specialties ?? []) as never,
                    experience_level: (args.experience_level as never) ?? null,
                    employment_type: (args.employment_type as never) ?? null,
                    salary_range: (args.salary_range as string) || null,
                    description: (args.description as string) || null,
                    apply_url: (args.apply_url as string) || null,
                    source_url: (args.source_url as string) || null,
                    source_site: (args.source_site as string) || null,
                    ai_notes: (args.ai_notes as string) || null,
                    ai_model: aiModelLabel,
                  }
                : undefined,
          })

          toolResult = `[${result.status}] ${result.message}`
          break
        }

        default:
          toolResult = `알 수 없는 도구입니다: ${call.function.name}`
      }

      messages.push({ role: 'tool', tool_call_id: call.id, content: toolResult })
    }

    // 목표 건수를 채웠으면 마무리를 요청한다
    const savedCount = counters.uploaded + counters.pending
    if (savedCount >= config.maxJobs) {
      await onEvent({ type: 'status', message: `🎯 목표 ${config.maxJobs}건 달성 — 마무리합니다.` })
      break
    }
  }

  if (iterations >= MAX_ITERATIONS) {
    await onEvent({ type: 'status', message: '⏱️ 최대 반복 횟수에 도달해 중단했습니다.' })
  }

  const total = counters.uploaded + counters.pending
  await onEvent({
    type: 'done',
    count: total,
    message:
      `총 ${total}건 저장 (업로드 ${counters.uploaded} · 대기 ${counters.pending} · ` +
      `중복 ${counters.duplicate} · 무효 ${counters.invalid} · 오류 ${counters.error})`,
  })

  return { counters, iterations }
}
