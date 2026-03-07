export type UserRole = 'job_seeker' | 'employer' | 'admin'

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface JobSeekerProfile {
  id: string
  education_level: string | null
  major: string | null
  school: string | null
  graduation_year: number | null
  years_experience: number
  actuarial_exams_passed: string[] | null
  skills: string[] | null
  bio: string | null
  linkedin_url: string | null
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
  specialization: string | null
  experience_level: string | null
  salary_range: string | null
  description: string | null
  apply_url: string | null
  is_published: boolean
  created_at: string
}

export interface Waitlist {
  id: string
  email: string
  note: string | null
  created_at: string
}
