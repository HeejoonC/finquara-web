-- ============================================================
-- AI Job Import Queue
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.job_imports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Core job fields (same structure as jobs table)
  title                TEXT NOT NULL,
  company              TEXT NOT NULL,
  location             TEXT,
  main_specializations TEXT[]    DEFAULT '{}',
  detailed_specialties TEXT[]    DEFAULT '{}',
  experience_level     TEXT,
  employment_type      TEXT,
  salary_range         TEXT,
  description          TEXT,
  apply_url            TEXT,

  -- AI-import metadata
  source_url    TEXT,          -- URL where the job was found
  source_site   TEXT,          -- 사람인 | 잡코리아 | LinkedIn | JobsDB HK | JobsDB SG | ...
  ai_notes      TEXT,          -- AI notes / confidence explanation
  ai_model      TEXT,          -- which model processed this

  -- Audit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at   TIMESTAMPTZ,
  approved_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  job_id        UUID REFERENCES public.jobs(id)     ON DELETE SET NULL  -- populated after approve
);

-- Enable Row Level Security
ALTER TABLE public.job_imports ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "admin_all" ON public.job_imports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index for the admin queue page
CREATE INDEX IF NOT EXISTS job_imports_status_idx ON public.job_imports (status, created_at DESC);

-- Grant permissions
GRANT ALL ON public.job_imports TO authenticated;
