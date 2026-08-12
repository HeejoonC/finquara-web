/**
 * Shared taxonomy prompt + normalization for AI job import.
 *
 * Both scraping backends use this module:
 *   - scripts/scrape-jobs.ts   (Claude Agent SDK / Claude Code 구독 토큰)
 *   - lib/ai-import/openrouter.ts (OpenRouter + DeepSeek)
 *
 * LLM 출력은 신뢰할 수 없으므로 DB에 넣기 전 반드시 normalizeJobInput()을 통과시킨다.
 */

import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
  type MainSpecialization,
  type DetailedSpecialty,
  type ExperienceLevel,
  type EmploymentType,
} from '@/lib/constants/actuary'
import type { JobImportInput, NormalizedJob, ScrapeConfig } from './types'

// ── 시스템 프롬프트 ────────────────────────────────────────────────────────

/** 분류 규칙 — 두 백엔드가 공유하는 택소노미 안내문 */
export function buildTaxonomyGuide(): string {
  return `## Finquara Taxonomy — 아래 값 중에서만 정확히 골라 쓸 것 (임의 생성 금지)

### main_specializations (보험권역, 복수 선택 가능):
${MAIN_SPECIALIZATIONS.map(s => `- ${s}`).join('\n')}

### detailed_specialties (직무분야, 복수 선택 가능, 최대 3개 권장):
${DETAILED_SPECIALTIES.map(s => `- ${s}`).join('\n')}

### experience_level (단일 선택):
${EXPERIENCE_LEVELS.map(s => `- ${s}`).join('\n')}

### employment_type (단일 선택):
${EMPLOYMENT_TYPES.map(s => `- ${s}`).join('\n')}

## 매핑 규칙
- 생명보험사 → 생명보험 / 손해보험사 → 손해보험 / 재보험사 → 재보험
- Big4·컨설팅펌 → 컨설팅 또는 회계법인
- Valuation·결산 → 계리평가 - 결산, EV 업무 → 계리평가 - EV
- ALM·ORSA·ICS·지급여력 → 리스크관리 - ALM 또는 리스크관리 - 지급여력
- 상품 가격산출·요율 → 가격산출 / 요율개발
- Reserving·손해액 추정 → 준비금 / 손해액 추정
- FP&A·경영기획 → 경영기획 / FP&A
- Prophet·AXIS·계리시스템·자동화 → 계리시스템 / Prophet / AXIS / 자동화

## 품질 기준
- 계리/보험 전문 직무만 저장한다 (일반 금융·IT 직무 제외).
- 국내 공고는 한국어로, 해외 공고는 영어로 description을 작성한다.
- description은 3~6문장. 주요 업무, 자격요건, 회사 특징을 담는다.
- 동일 공고를 중복 저장하지 않는다.
- 급여 정보가 없으면 "협의"로 적는다.
- apply_url은 반드시 지원 가능한 실제 공고 URL이어야 한다. 추측한 URL을 만들어내지 말 것.`
}

/** 실행 지시문 — config에 따라 달라지는 부분 */
export function buildScrapeInstruction(config: ScrapeConfig): string {
  return `아래 조건으로 최신 계리사(actuary) 채용공고를 찾아 저장하세요.

- 대상 지역: ${config.locations.join(', ')}
- 검색 키워드: ${config.keywords.join(', ')}
- 목표 수집 건수: 최소 ${config.maxJobs}건

## 검색 대상 (우선순위 순)
1. 🇰🇷 한국: 사람인, 잡코리아, LinkedIn Korea, 원티드, 보험개발원/보험연구원 채용
2. 🇭🇰 홍콩: LinkedIn HK, JobsDB HK, eFinancialCareers HK
3. 🇸🇬 싱가포르: LinkedIn SG, JobsDB SG, eFinancialCareers SG

## 검색어 예시
- 국내: "보험계리사 채용", "계리사 채용", "계리 신입", "액추어리 채용"
- 해외: "actuarial analyst", "actuary jobs", "actuarial consultant", "FIA FSA actuarial"

## 작업 순서
1. 국내 사이트부터 검색한다.
2. 검색 결과에서 계리 관련 공고 링크를 추린다.
3. 각 공고 상세 페이지를 열어 실제 내용을 확인한다.
4. 확인된 공고마다 즉시 save_job 도구를 호출한다 (모아서 한 번에 처리하지 말 것).
5. 목표 건수를 채우면 무엇을 찾았는지 한국어로 요약한다.`
}

// ── 정규화 ────────────────────────────────────────────────────────────────

const MAIN_SET = new Set<string>(MAIN_SPECIALIZATIONS)
const DETAIL_SET = new Set<string>(DETAILED_SPECIALTIES)
const EXP_SET = new Set<string>(EXPERIENCE_LEVELS)
const EMP_SET = new Set<string>(EMPLOYMENT_TYPES)

function clean(value: unknown, maxLength = 4000): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function pickFromSet(value: unknown, allowed: Set<string>): string | null {
  const text = clean(value, 100)
  return text && allowed.has(text) ? text : null
}

function pickManyFromSet(value: unknown, allowed: Set<string>, limit: number): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  for (const item of value) {
    const text = clean(item, 100)
    if (text && allowed.has(text)) seen.add(text)
    if (seen.size >= limit) break
  }
  return [...seen]
}

/** 추적용 쿼리 파라미터 — 같은 공고가 다른 URL로 보이게 만드는 주범 */
const TRACKING_PARAM = /^(utm_|fbclid$|gclid$|msclkid$|igshid$|ref$|referrer$|source$|src$)/i

/**
 * URL을 정규화한다. 추적 파라미터와 프래그먼트를 제거하므로,
 * 같은 공고는 항상 같은 문자열이 되어 DB 유니크 인덱스와 중복 조회가 함께 동작한다.
 */
function normalizeUrl(value: unknown): string | null {
  const text = clean(value, 2000)
  if (!text) return null
  try {
    const url = new URL(text)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAM.test(key)) url.searchParams.delete(key)
    }
    // 쿼리 순서만 다른 URL도 같은 값이 되도록 정렬
    url.searchParams.sort()
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.replace(/\/+$/, '')
    }

    return url.toString()
  } catch {
    return null
  }
}

/**
 * LLM이 뱉은 원본 입력을 DB 스키마에 맞게 정리한다.
 * title / company 가 없으면 null 을 돌려준다 (저장 불가).
 */
export function normalizeJobInput(
  raw: Partial<JobImportInput>,
  aiModel: string,
): NormalizedJob | null {
  const title = clean(raw.title, 300)
  const company = clean(raw.company, 200)
  if (!title || !company) return null

  const applyUrl = normalizeUrl(raw.apply_url)
  const sourceUrl = normalizeUrl(raw.source_url)

  return {
    title,
    company,
    location: clean(raw.location, 200),
    main_specializations: pickManyFromSet(raw.main_specializations, MAIN_SET, 3) as MainSpecialization[],
    detailed_specialties: pickManyFromSet(raw.detailed_specialties, DETAIL_SET, 4) as DetailedSpecialty[],
    experience_level: pickFromSet(raw.experience_level, EXP_SET) as ExperienceLevel | null,
    employment_type: pickFromSet(raw.employment_type, EMP_SET) as EmploymentType | null,
    salary_range: clean(raw.salary_range, 200) ?? '협의',
    description: clean(raw.description, 8000),
    apply_url: applyUrl ?? sourceUrl,
    source_url: sourceUrl ?? applyUrl,
    source_site: clean(raw.source_site, 100),
    ai_notes: clean(raw.ai_notes, 2000),
    ai_model: aiModel,
  }
}

/**
 * 중복 판정용 키 — apply_url 우선, 없으면 회사+직책.
 * apply_url 은 normalizeJobInput() 에서 이미 정규화된 값이다.
 */
export function dedupeKey(job: Pick<NormalizedJob, 'apply_url' | 'title' | 'company'>): string {
  if (job.apply_url) return `url:${job.apply_url.toLowerCase()}`
  return `tc:${job.company.toLowerCase().replace(/\s+/g, '')}|${job.title.toLowerCase().replace(/\s+/g, '')}`
}
