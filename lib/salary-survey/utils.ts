import type { SurveyRecord, SurveyIndustry, SurveyFunction, SurveyLocation, SurveyCredential, SurveyCompanyType, SurveyYear } from './mockData'

// ── Experience Buckets ────────────────────────────────────────────────────

export interface ExperienceBucket {
  label: string
  min: number
  max: number  // exclusive upper bound (Infinity for last)
}

export const EXPERIENCE_BUCKETS: ExperienceBucket[] = [
  { label: '0~3년',   min: 0,  max: 3 },
  { label: '3~5년',   min: 3,  max: 5 },
  { label: '5~8년',   min: 5,  max: 8 },
  { label: '8~12년',  min: 8,  max: 12 },
  { label: '12~15년', min: 12, max: 15 },
  { label: '15년+',   min: 15, max: Infinity },
]

// ── Filter State ──────────────────────────────────────────────────────────

export interface SurveyFilters {
  surveyYear: SurveyYear[]
  industry: SurveyIndustry[]
  function: SurveyFunction[]
  location: SurveyLocation[]
  credential: SurveyCredential[]
  companyType: SurveyCompanyType[]
  metric: 'average' | 'median'
  compensation: 'baseSalary' | 'totalComp'
  showP25P75: boolean
}

export const DEFAULT_FILTERS: SurveyFilters = {
  surveyYear: [2025, 2026],
  industry: [],
  function: [],
  location: [],
  credential: [],
  companyType: [],
  metric: 'median',
  compensation: 'baseSalary',
  showP25P75: false,
}

// ── Filtering ─────────────────────────────────────────────────────────────

export function applyFilters(data: SurveyRecord[], filters: SurveyFilters): SurveyRecord[] {
  return data.filter(r => {
    if (filters.surveyYear.length && !filters.surveyYear.includes(r.surveyYear)) return false
    if (filters.industry.length   && !filters.industry.includes(r.industry))     return false
    if (filters.function.length   && !filters.function.includes(r.function))     return false
    if (filters.location.length   && !filters.location.includes(r.location))     return false
    if (filters.credential.length && !filters.credential.includes(r.credential)) return false
    if (filters.companyType.length && !filters.companyType.includes(r.companyType)) return false
    return true
  })
}

// ── Aggregation ───────────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

function average(arr: number[]): number {
  if (!arr.length) return 0
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
}

function percentile(arr: number[], p: number): number {
  if (!arr.length) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const idx = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo))
}

export interface BucketDataPoint {
  bucket: string
  value: number
  p25: number
  p75: number
  count: number
}

export function aggregateByBucket(
  data: SurveyRecord[],
  filters: SurveyFilters,
): BucketDataPoint[] {
  const key: keyof Pick<SurveyRecord, 'baseSalary' | 'totalComp'> = filters.compensation
  const aggFn = filters.metric === 'median' ? median : average

  return EXPERIENCE_BUCKETS.map(bucket => {
    const inBucket = data.filter(r => r.yearsExperience >= bucket.min && r.yearsExperience < bucket.max)
    const vals = inBucket.map(r => r[key])
    return {
      bucket: bucket.label,
      value:  aggFn(vals),
      p25:    percentile(vals, 25),
      p75:    percentile(vals, 75),
      count:  inBucket.length,
    }
  })
}

// ── KPI Summary ───────────────────────────────────────────────────────────

export interface SurveySummary {
  medianBase: number
  medianTotal: number
  avgBonusRatio: number
  sampleSize: number
}

export function computeSummary(data: SurveyRecord[]): SurveySummary {
  if (!data.length) return { medianBase: 0, medianTotal: 0, avgBonusRatio: 0, sampleSize: 0 }
  return {
    medianBase:    median(data.map(r => r.baseSalary)),
    medianTotal:   median(data.map(r => r.totalComp)),
    avgBonusRatio: Math.round(average(data.map(r => r.bonusRatio * 100))),
    sampleSize:    data.length,
  }
}

// ── Formatting ────────────────────────────────────────────────────────────

export function formatKRW(val: number, compact = false): string {
  if (!val) return '—'
  if (compact) {
    if (val >= 100_000_000) return `${(val / 100_000_000).toFixed(1)}억`
    if (val >= 10_000_000)  return `${(val / 10_000_000).toFixed(0)}천만`
    return `${(val / 1_000_000).toFixed(0)}M`
  }
  return `₩${val.toLocaleString('ko-KR')}`
}

export function formatKRWAxis(val: number): string {
  if (val >= 100_000_000) return `${(val / 100_000_000).toFixed(0)}억`
  if (val >= 10_000_000)  return `${(val / 10_000_000).toFixed(0)}천만`
  return `${(val / 1_000_000).toFixed(0)}M`
}
