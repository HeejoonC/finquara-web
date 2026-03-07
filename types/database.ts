export type UserRole = 'job_seeker' | 'employer' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  phone: string | null
  auth_provider: string | null
  kakao_user_id: string | null
  kakao_connected: boolean
  open_to_recommendation: boolean
  receive_job_mailing: boolean
  created_at: string
  updated_at: string
}

export interface JobSeekerProfile {
  id: string
  headline: string | null
  years_experience: number | null
  current_company: string | null
  current_title: string | null
  location: string | null
  main_specializations: string[]
  detailed_specialties: string[]
  specialty_etc: string | null
  qualifications: string[]
  korea_partial_pass_subjects: string[]
  us_partial_pass_subjects: string[]
  us_partial_pass_etc: string | null
  tools: string[]
  bio: string | null
  linkedin_url: string | null
  resume_file_path: string | null
  resume_file_name: string | null
  resume_updated_at: string | null
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  owner_id: string
  company_name: string
  company_size: string | null
  industry: string | null
  website: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  owner_id: string | null
  title: string
  company: string
  location: string | null
  /** @deprecated v1 field kept for backward compat. New records use main_specializations. */
  specialization: string | null
  main_specializations: string[]
  detailed_specialties: string[]
  experience_level: string | null
  employment_type: string | null
  salary_range: string | null
  description: string | null
  apply_url: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface Waitlist {
  id: string
  email: string
  note: string | null
  created_at: string
}
