import type { MainSpecialization, DetailedSpecialty, ExperienceLevel, EmploymentType } from '@/lib/constants/actuary'

// ── Job import record (mirrors Supabase job_imports table) ────────────────

export type ImportStatus = 'pending' | 'approved' | 'rejected'

export interface JobImport {
  id: string
  status: ImportStatus
  title: string
  company: string
  location: string | null
  main_specializations: MainSpecialization[]
  detailed_specialties: DetailedSpecialty[]
  experience_level: ExperienceLevel | null
  employment_type: EmploymentType | null
  salary_range: string | null
  description: string | null
  apply_url: string | null
  source_url: string | null
  source_site: string | null
  ai_notes: string | null
  ai_model: string | null
  created_at: string
  approved_at: string | null
  approved_by: string | null
  job_id: string | null
}

// ── What the LLM emits via the save_job tool (untrusted) ──────────────────

export interface JobImportInput {
  title: string
  company: string
  location: string
  main_specializations: string[]
  detailed_specialties: string[]
  experience_level: string
  employment_type: string
  salary_range: string
  description: string
  apply_url: string
  source_url: string
  source_site: string
  ai_notes: string
}

/** normalizeJobInput() 통과 후의 DB 삽입 가능한 형태 */
export interface NormalizedJob {
  title: string
  company: string
  location: string | null
  main_specializations: MainSpecialization[]
  detailed_specialties: DetailedSpecialty[]
  experience_level: ExperienceLevel | null
  employment_type: EmploymentType | null
  salary_range: string | null
  description: string | null
  apply_url: string | null
  source_url: string | null
  source_site: string | null
  ai_notes: string | null
  ai_model: string
}

// ── 저장 결과 ─────────────────────────────────────────────────────────────

export type SaveStatus =
  | 'uploaded'   // jobs 테이블까지 자동 등록 완료
  | 'pending'    // job_imports 에 검토 대기로만 저장
  | 'duplicate'  // 이미 있는 공고 — 건너뜀
  | 'invalid'    // 필수 필드 누락 등으로 저장 불가
  | 'error'      // DB 오류

export interface SaveResult {
  status: SaveStatus
  message: string
  importId?: string
  jobId?: string
}

// ── SSE event types sent from the scrape API route ───────────────────────

export type ScrapeEventType =
  | 'status'       // general log message
  | 'job_found'    // a job was processed (see result for the outcome)
  | 'done'         // scraping complete
  | 'error'        // an error occurred

export interface ScrapeEvent {
  type: ScrapeEventType
  message?: string
  job?: Omit<JobImport, 'id' | 'created_at' | 'approved_at' | 'approved_by' | 'job_id'>
  result?: SaveResult
  count?: number
}

// ── Search config ─────────────────────────────────────────────────────────

export interface ScrapeConfig {
  keywords: string[]     // e.g. ['보험계리사', 'actuarial', 'actuary']
  locations: string[]    // e.g. ['Korea', 'Hong Kong', 'Singapore']
  maxJobs: number        // target number of jobs to find
  /** true면 job_imports 저장 후 jobs 테이블에도 자동 생성 (is_published=false) */
  autoUpload: boolean
  /** autoUpload 시 즉시 공개할지 여부. 기본 false */
  autoPublish?: boolean
}
