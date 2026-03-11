/**
 * Mock salary survey data for Finquara Salary Survey page.
 * Uses same taxonomy as job postings (MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES).
 * In production this will be replaced by Supabase-backed survey data.
 */

export type SurveyIndustry =
  | '생명보험'
  | '손해보험'
  | '재보험'
  | '회계법인'
  | '계리법인'
  | '컨설팅'
  | '기타'

export type SurveyFunction =
  | '계리평가 - 결산'
  | '계리평가 - 모델링'
  | '계리평가 - EV'
  | '계리평가 - 가정관리'
  | '가격산출 / 요율개발'
  | '상품 - 개발'
  | '상품 - 관리'
  | '상품 - 위험율 개발'
  | '상품 - 가정관리'
  | '리스크관리 - ALM'
  | '리스크관리 - 지급여력'
  | '준비금 / 손해액 추정'
  | '경영기획 / FP&A'
  | '회계 / 재무보고'
  | '투자 / 자산운용'
  | '퇴직연금 / 연금계리'
  | '재보험 관리'
  | '컨설팅 / 자문'
  | '계리시스템 / Prophet / AXIS / 자동화'
  | '데이터 / 분석 / 경험통계'
  | '기타'

export type SurveyLocation = 'Seoul' | 'Korea' | 'Remote' | 'Global'
export type SurveyCredential = 'Student' | 'ASA' | 'FSA' | 'KAA' | 'Other'
export type SurveyCompanyType = '보험사' | '컨설팅' | '회계법인' | '헤드헌팅/리크루팅' | '기타'

export interface SurveyRecord {
  id: string
  surveyYear: 2025 | 2026
  industry: SurveyIndustry
  function: SurveyFunction
  location: SurveyLocation
  credential: SurveyCredential
  companyType: SurveyCompanyType
  yearsExperience: number
  baseSalary: number   // KRW, annual
  totalComp: number    // KRW, annual (base + bonus + other)
  bonusRatio: number   // 0.0 ~ 1.0 (bonus as fraction of base)
}

// ── Salary scale helpers ──────────────────────────────────────────────────
// Base salary grows roughly log-linearly with experience.
// Premium modifiers applied per industry/credential.

function salaryBase(yoe: number): number {
  // Starts ~55M KRW at 0yr, reaches ~200M at 20yr
  return Math.round((55_000_000 + Math.pow(yoe, 1.45) * 6_000_000))
}

function jitter(val: number, pct = 0.12): number {
  return Math.round(val * (1 + (Math.random() * 2 - 1) * pct))
}

const industryMultiplier: Record<SurveyIndustry, number> = {
  '생명보험': 1.00,
  '손해보험': 0.97,
  '재보험':   1.08,
  '회계법인': 1.12,
  '계리법인': 1.05,
  '컨설팅':   1.15,
  '기타':     0.92,
}

const credentialMultiplier: Record<SurveyCredential, number> = {
  'Student': 0.88,
  'ASA':     1.05,
  'FSA':     1.20,
  'KAA':     1.10,
  'Other':   0.95,
}

const companyBonus: Record<SurveyCompanyType, number> = {
  '보험사':           0.15,
  '컨설팅':           0.22,
  '회계법인':         0.25,
  '헤드헌팅/리크루팅': 0.10,
  '기타':             0.12,
}

// ── Weighted random helpers ───────────────────────────────────────────────
function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

// ── Generate mock records ─────────────────────────────────────────────────
function generateRecord(id: string, surveyYear: 2025 | 2026): SurveyRecord {
  const industries: SurveyIndustry[] = ['생명보험', '손해보험', '재보험', '회계법인', '계리법인', '컨설팅', '기타']
  const industryWeights = [30, 22, 8, 12, 8, 14, 6]

  const functions: SurveyFunction[] = [
    '계리평가 - 결산', '계리평가 - 모델링', '계리평가 - EV', '계리평가 - 가정관리',
    '가격산출 / 요율개발', '상품 - 개발', '상품 - 관리', '상품 - 위험율 개발',
    '상품 - 가정관리', '리스크관리 - ALM', '리스크관리 - 지급여력',
    '준비금 / 손해액 추정', '경영기획 / FP&A', '회계 / 재무보고',
    '투자 / 자산운용', '퇴직연금 / 연금계리', '재보험 관리', '컨설팅 / 자문',
    '계리시스템 / Prophet / AXIS / 자동화', '데이터 / 분석 / 경험통계', '기타',
  ]
  const functionWeights = [12, 10, 8, 5, 6, 5, 4, 4, 3, 6, 5, 4, 4, 3, 3, 2, 3, 5, 5, 6, 7]

  const locations: SurveyLocation[] = ['Seoul', 'Korea', 'Remote', 'Global']
  const locationWeights = [55, 25, 12, 8]

  const credentials: SurveyCredential[] = ['Student', 'ASA', 'FSA', 'KAA', 'Other']
  const credentialWeights = [15, 25, 20, 18, 22]

  const companyTypes: SurveyCompanyType[] = ['보험사', '컨설팅', '회계법인', '헤드헌팅/리크루팅', '기타']
  const companyWeights = [40, 22, 18, 12, 8]

  const industry = weightedRandom(industries, industryWeights)
  const fn      = weightedRandom(functions, functionWeights)
  const location = weightedRandom(locations, locationWeights)
  const credential = weightedRandom(credentials, credentialWeights)
  const companyType = weightedRandom(companyTypes, companyWeights)

  // Experience skewed toward 0-10 years
  const yoe = Math.round(Math.pow(Math.random(), 0.65) * 22)

  const base = jitter(
    salaryBase(yoe)
    * industryMultiplier[industry]
    * credentialMultiplier[credential]
    * (surveyYear === 2026 ? 1.035 : 1.0)  // YoY 3.5% growth
  )

  const bonusRatio = jitter(companyBonus[companyType], 0.3)
  const totalComp  = Math.round(base * (1 + bonusRatio))

  return {
    id,
    surveyYear,
    industry,
    function: fn,
    location,
    credential,
    companyType,
    yearsExperience: yoe,
    baseSalary: base,
    totalComp,
    bonusRatio,
  }
}

function seedRandom(seed: number) {
  // Deterministic seeded pseudo-random for reproducible mock data
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateDataset(count: number, year: 2025 | 2026, seedBase: number): SurveyRecord[] {
  // Temporarily override Math.random with seeded version for reproducibility
  const orig = Math.random
  const rng = seedRandom(seedBase)
  Math.random = rng
  const records: SurveyRecord[] = []
  for (let i = 0; i < count; i++) {
    records.push(generateRecord(`${year}-${String(i + 1).padStart(3, '0')}`, year))
  }
  Math.random = orig
  return records
}

export const SURVEY_MOCK_DATA: SurveyRecord[] = [
  ...generateDataset(120, 2025, 42),
  ...generateDataset(95, 2026, 99),
]

export const SURVEY_YEARS = [2025, 2026] as const
export type SurveyYear = (typeof SURVEY_YEARS)[number]
