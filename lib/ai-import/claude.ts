/**
 * Claude-powered actuarial job scraper.
 *
 * Uses Claude Sonnet 4.6 with built-in web_search + web_fetch tools to
 * discover job postings from Korean, HK, and Singapore job sites.
 * Claude maps each posting to the Finquara taxonomy and calls
 * save_job_import for every unique job found.
 *
 * Model: claude-sonnet-4-6
 *   - Supports web_search_20260209 (dynamic filtering enabled)
 *   - More cost-efficient than Opus for high-volume web search tasks
 *   - Still capable enough for structured extraction + taxonomy mapping
 */

import Anthropic from '@anthropic-ai/sdk'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'
import type { ScrapeConfig, JobImportInput, ScrapeEvent } from './types'

const MODEL = 'claude-sonnet-4-6'

// ── Tool definitions ──────────────────────────────────────────────────────

const SAVE_JOB_TOOL: Anthropic.Tool = {
  name: 'save_job_import',
  description:
    'Save a discovered actuarial job posting for admin review. ' +
    'Call this once per unique job found. Map all fields to Finquara taxonomy.',
  input_schema: {
    type: 'object',
    properties: {
      title: { type: 'string', description: '정확한 채용 직책명 (원문 그대로)' },
      company: { type: 'string', description: '회사명 (원문 그대로)' },
      location: {
        type: 'string',
        description: '근무 지역. 예: Seoul, Korea / Hong Kong / Singapore / Remote',
      },
      main_specializations: {
        type: 'array',
        items: {
          type: 'string',
          enum: [...MAIN_SPECIALIZATIONS],
        },
        description: '해당 직무에 맞는 보험권역 분류 (복수 선택 가능)',
      },
      detailed_specialties: {
        type: 'array',
        items: {
          type: 'string',
          enum: [...DETAILED_SPECIALTIES],
        },
        description: '세부 직무분야 (복수 선택 가능, 최대 3개 권장)',
      },
      experience_level: {
        type: 'string',
        enum: [...EXPERIENCE_LEVELS],
        description: '요구 경력 수준',
      },
      employment_type: {
        type: 'string',
        enum: [...EMPLOYMENT_TYPES],
        description: '고용 형태',
      },
      salary_range: {
        type: 'string',
        description: '연봉 또는 급여 정보 (없으면 "협의" 또는 빈 문자열)',
      },
      description: {
        type: 'string',
        description:
          '채용 내용 요약 (한국어 또는 영어로 3~6문장. 주요 자격요건, 담당업무, 회사 특징 포함)',
      },
      apply_url: {
        type: 'string',
        description: '지원 링크 또는 공고 원문 URL',
      },
      source_url: {
        type: 'string',
        description: '이 정보를 찾은 페이지 URL',
      },
      source_site: {
        type: 'string',
        description:
          '출처 사이트명. 예: 사람인, 잡코리아, LinkedIn, JobsDB HK, JobsDB SG, Indeed, 기타',
      },
      ai_notes: {
        type: 'string',
        description:
          'AI 분류 메모. 분야 매핑 근거, 불확실한 부분, 검토 시 주의사항 등을 간략히 기술',
      },
    },
    required: [
      'title',
      'company',
      'location',
      'main_specializations',
      'detailed_specialties',
      'experience_level',
      'employment_type',
      'description',
      'apply_url',
      'source_url',
      'source_site',
      'ai_notes',
    ],
  },
}

// ── System prompt ─────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are an expert actuarial job market researcher for Finquara, a Korean actuarial job platform.

Your task: Search for recent actuarial job postings, then structure and save each one using the save_job_import tool.

## Target Markets (priority order)
1. 🇰🇷 Korea (highest priority): 사람인, 잡코리아, LinkedIn Korea, Actuary.kr, 보험개발원 채용
2. 🇭🇰 Hong Kong: LinkedIn HK, JobsDB HK, eFinancialCareers HK
3. 🇸🇬 Singapore: LinkedIn SG, JobsDB SG, eFinancialCareers SG

## Search Keywords
Korean sites: "보험계리사", "보험계리", "계리사", "계리사 채용", "actuarial", "액추어리"
English sites: "actuarial analyst", "actuary", "actuarial consultant", "FIA", "FSA", "KAA", "ASA"

## Finquara Taxonomy — USE EXACTLY THESE VALUES

### main_specializations (보험권역):
${MAIN_SPECIALIZATIONS.map(s => `- ${s}`).join('\n')}

### detailed_specialties (직무분야):
${DETAILED_SPECIALTIES.map(s => `- ${s}`).join('\n')}

### experience_level:
${EXPERIENCE_LEVELS.map(s => `- ${s}`).join('\n')}

### employment_type:
${EMPLOYMENT_TYPES.map(s => `- ${s}`).join('\n')}

## Mapping Rules
- Life insurer → 생명보험, Non-life insurer → 손해보험, Reinsurer → 재보험
- Big4/consulting firm → 컨설팅 or 회계법인
- Valuation/Closing → 계리평가 - 결산, EV work → 계리평가 - EV
- ALM/ORSA/ICS/Solvency → 리스크관리 - ALM or 리스크관리 - 지급여력
- Product pricing → 가격산출 / 요율개발
- Reserving → 준비금 / 손해액 추정
- FP&A/planning → 경영기획 / FP&A
- Systems/Prophet/AXIS → 계리시스템 / Prophet / AXIS / 자동화

## Quality Standards
- Only save actuarial/insurance-specific roles (not generic finance)
- Write description in Korean for Korean jobs, English for overseas jobs
- Keep descriptions factual and concise (3–6 sentences)
- Do NOT duplicate the same posting
- If salary info exists, include it; otherwise use "협의"
- Aim for ${'{TARGET_COUNT}'} unique job postings

## Workflow
1. Search Korean sites first (사람인 "보험계리사", 잡코리아 "보험계리")
2. Search LinkedIn for Korea, HK, SG actuarial roles
3. Search JobsDB HK and SG for actuarial jobs
4. For each relevant listing, fetch the detail page to get full info
5. Call save_job_import for each unique job
6. After saving all jobs, summarize what you found`
}

// ── Agentic scraping loop ─────────────────────────────────────────────────

export async function* scrapeActuarialJobs(
  config: ScrapeConfig,
  onEvent: (event: ScrapeEvent) => void,
): AsyncGenerator<JobImportInput> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const systemPrompt = buildSystemPrompt().replace('{TARGET_COUNT}', String(config.maxJobs))

  const userPrompt = `Search for actuarial job postings now. Focus on:
- Locations: ${config.locations.join(', ')}
- Additional keywords: ${config.keywords.join(', ')}
- Target: find at least ${config.maxJobs} unique job postings

Start by searching Korean sites, then move to Hong Kong and Singapore.
For each job you find, call save_job_import immediately — don't wait to batch them.`

  let messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt },
  ]

  onEvent({ type: 'status', message: '🔍 Claude가 채용공고 검색을 시작합니다...' })

  const tools: Anthropic.Messages.ToolUnion[] = [
    { type: 'web_search_20260209', name: 'web_search' } as Anthropic.Messages.ToolUnion,
    { type: 'web_fetch_20260209', name: 'web_fetch' } as Anthropic.Messages.ToolUnion,
    SAVE_JOB_TOOL,
  ]

  let foundCount = 0
  let iterations = 0
  const MAX_ITERATIONS = 25 // safety limit

  while (iterations < MAX_ITERATIONS) {
    iterations++

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      tools,
      messages,
    })

    // Append assistant response
    messages.push({ role: 'assistant', content: response.content })

    if (response.stop_reason === 'end_turn') {
      onEvent({ type: 'status', message: '✅ Claude 검색 완료' })
      break
    }

    // Handle server-side tool iteration limit (pause_turn)
    if (response.stop_reason === 'pause_turn') {
      onEvent({ type: 'status', message: '↩️ 검색 계속 중...' })
      // Re-send to resume — server detects trailing server_tool_use and continues
      messages = [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: response.content },
      ]
      continue
    }

    // Process tool_use blocks
    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    )

    if (toolUseBlocks.length === 0) break

    const toolResults: Anthropic.ToolResultBlockParam[] = []

    for (const toolUse of toolUseBlocks) {
      if (toolUse.name === 'save_job_import') {
        const input = toolUse.input as JobImportInput
        foundCount++

        onEvent({
          type: 'job_found',
          message: `📋 ${input.title} @ ${input.company} (${input.source_site})`,
          job: {
            status: 'pending',
            title: input.title,
            company: input.company,
            location: input.location || null,
            main_specializations: (input.main_specializations as string[]) as [],
            detailed_specialties: (input.detailed_specialties as string[]) as [],
            experience_level: (input.experience_level as import('@/lib/constants/actuary').ExperienceLevel) || null,
            employment_type: (input.employment_type as import('@/lib/constants/actuary').EmploymentType) || null,
            salary_range: input.salary_range || null,
            description: input.description || null,
            apply_url: input.apply_url || null,
            source_url: input.source_url || null,
            source_site: input.source_site || null,
            ai_notes: input.ai_notes || null,
            ai_model: MODEL,
          },
        })

        yield input

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `✓ Job saved (#${foundCount}): ${input.title} at ${input.company}`,
        })
      }
      // web_search and web_fetch are server-side — handled by Anthropic automatically
    }

    if (toolResults.length > 0) {
      messages.push({ role: 'user', content: toolResults })
    }
  }

  onEvent({ type: 'done', count: foundCount, message: `총 ${foundCount}개 공고 발견` })
}
