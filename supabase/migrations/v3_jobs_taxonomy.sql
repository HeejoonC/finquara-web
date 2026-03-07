-- =============================================
-- Finquara v3 Migration
-- Jobs table: actuarial taxonomy fields
-- Safe to run multiple times (IF NOT EXISTS)
-- =============================================

-- Add new array columns for actuarial taxonomy
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS main_specializations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detailed_specialties  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employment_type       text,
  ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- updated_at trigger for jobs (mirrors profiles/companies pattern)
DROP TRIGGER IF EXISTS jobs_updated_at ON public.jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- =============================================
-- Done
-- =============================================
