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

// ── What Claude saves via save_job_import tool call ───────────────────────

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

// ── SSE event types sent from the scrape API route ───────────────────────

export type ScrapeEventType =
  | 'status'       // general log message
  | 'job_found'    // a job was saved to DB
  | 'done'         // scraping complete
  | 'error'        // an error occurred

export interface ScrapeEvent {
  type: ScrapeEventType
  message?: string
  job?: Omit<JobImport, 'id' | 'created_at' | 'approved_at' | 'approved_by' | 'job_id'>
  count?: number
}

// ── Search config sent by admin ───────────────────────────────────────────

export interface ScrapeConfig {
  keywords: string[]     // e.g. ['보험계리사', 'actuarial', 'actuary']
  locations: string[]    // e.g. ['Korea', 'Hong Kong', 'Singapore']
  maxJobs: number        // target number of jobs to find
}
