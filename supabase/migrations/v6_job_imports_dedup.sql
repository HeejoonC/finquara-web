-- =============================================
-- Finquara v6 Migration
-- AI 자동 수집: 중복 방지 인덱스
-- Supabase SQL Editor 에서 실행 (여러 번 실행해도 안전)
-- =============================================

-- 1) 같은 지원 URL 의 공고가 두 번 들어오지 않도록 (NULL 은 제외)
--    기존 중복 데이터가 있으면 인덱스 생성이 실패하므로 먼저 정리한다.
DELETE FROM public.job_imports a
USING public.job_imports b
WHERE a.apply_url IS NOT NULL
  AND a.apply_url = b.apply_url
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS job_imports_apply_url_unique
  ON public.job_imports (apply_url)
  WHERE apply_url IS NOT NULL;

-- 2) 회사+직책 중복 조회용 (store.ts 의 findExisting)
CREATE INDEX IF NOT EXISTS job_imports_company_title_idx
  ON public.job_imports (company, title);

-- 3) jobs 쪽에서도 apply_url 로 빠르게 중복을 확인할 수 있도록
CREATE INDEX IF NOT EXISTS jobs_apply_url_idx
  ON public.jobs (apply_url)
  WHERE apply_url IS NOT NULL;

-- =============================================
-- Done
-- =============================================
