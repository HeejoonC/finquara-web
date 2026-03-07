-- =============================================
-- Finquara v2 Migration
-- Kakao auth + actuarial taxonomy + resume support
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS)
-- Run in Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. profiles: add Kakao + notification columns
-- =============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auth_provider text,
  ADD COLUMN IF NOT EXISTS kakao_user_id text,
  ADD COLUMN IF NOT EXISTS kakao_connected boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS open_to_recommendation boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS receive_job_mailing boolean NOT NULL DEFAULT true;

-- Unique constraint on kakao_user_id (only enforced when non-null)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_kakao_user_id_unique'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_kakao_user_id_unique UNIQUE (kakao_user_id);
  END IF;
END $$;

-- =============================================
-- 2. job_seeker_profiles: drop old columns
-- =============================================
ALTER TABLE public.job_seeker_profiles
  DROP COLUMN IF EXISTS education_level,
  DROP COLUMN IF EXISTS major,
  DROP COLUMN IF EXISTS school,
  DROP COLUMN IF EXISTS graduation_year,
  DROP COLUMN IF EXISTS actuarial_exams_passed,
  DROP COLUMN IF EXISTS skills;

-- =============================================
-- 3. job_seeker_profiles: add new columns
-- =============================================
ALTER TABLE public.job_seeker_profiles
  ADD COLUMN IF NOT EXISTS headline text,
  ADD COLUMN IF NOT EXISTS years_experience integer,
  ADD COLUMN IF NOT EXISTS current_company text,
  ADD COLUMN IF NOT EXISTS current_title text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS main_specializations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS detailed_specialties text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialty_etc text,
  ADD COLUMN IF NOT EXISTS qualifications text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS korea_partial_pass_subjects text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS us_partial_pass_subjects text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS us_partial_pass_etc text,
  ADD COLUMN IF NOT EXISTS tools text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS resume_file_path text,
  ADD COLUMN IF NOT EXISTS resume_file_name text,
  ADD COLUMN IF NOT EXISTS resume_updated_at timestamptz;

-- =============================================
-- 4. Update handle_new_user trigger
--    Now handles Kakao provider metadata
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _provider text;
  _kakao_id text;
  _kakao_connected boolean;
BEGIN
  _provider := new.raw_app_meta_data->>'provider';

  IF _provider = 'kakao' THEN
    -- Kakao user_id lives in identities, but also in provider_id via raw_user_meta_data
    _kakao_id := new.raw_user_meta_data->>'provider_id';
    _kakao_connected := true;
  ELSE
    _kakao_id := NULL;
    _kakao_connected := false;
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, role,
    auth_provider, kakao_user_id, kakao_connected
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    COALESCE(new.raw_user_meta_data->>'role', 'job_seeker'),
    _provider,
    _kakao_id,
    _kakao_connected
  )
  ON CONFLICT (id) DO UPDATE SET
    auth_provider    = EXCLUDED.auth_provider,
    kakao_user_id    = COALESCE(EXCLUDED.kakao_user_id, profiles.kakao_user_id),
    kakao_connected  = EXCLUDED.kakao_connected OR profiles.kakao_connected;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger in case it wasn't there
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- 5. Storage bucket: resumes
--    NOTE: If storage extension is not available in SQL, do this manually
--    in the Supabase dashboard: Storage > New bucket > "resumes" (private)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MB
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. Storage RLS: each user owns their folder
--    Folder structure: resumes/{user_id}/filename
-- =============================================
DROP POLICY IF EXISTS "resume_insert" ON storage.objects;
DROP POLICY IF EXISTS "resume_select" ON storage.objects;
DROP POLICY IF EXISTS "resume_update" ON storage.objects;
DROP POLICY IF EXISTS "resume_delete" ON storage.objects;

CREATE POLICY "resume_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resume_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resume_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "resume_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'resumes'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 7. profiles RLS: allow update of new columns
--    (existing policies already cover update by owner/admin — no change needed)
-- =============================================

-- =============================================
-- Done
-- =============================================
