-- =============================================
-- Finquara 추가 스키마 (기존 jobs, waitlist 테이블 유지)
-- Supabase SQL 편집기에서 실행하세요.
-- =============================================

-- 기존 테이블 (이미 존재함, 참고용)
-- create table if not exists public.jobs (...)
-- create table if not exists public.waitlist (...)

-- jobs 테이블에 owner_id 컬럼 추가 (없는 경우)
alter table public.jobs add column if not exists owner_id uuid references auth.users on delete set null;

-- =============================================
-- 1. 사용자 프로필 테이블
-- =============================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null default 'job_seeker' check (role in ('job_seeker', 'employer', 'admin')),
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- 2. 구직자 세부 프로필 테이블
-- =============================================
create table if not exists public.job_seeker_profiles (
  id uuid references public.profiles on delete cascade primary key,
  education_level text,
  major text,
  school text,
  graduation_year integer,
  years_experience integer default 0,
  actuarial_exams_passed text[],
  skills text[],
  bio text,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- 3. 기업 프로필 테이블
-- =============================================
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles on delete cascade not null unique,
  company_name text not null,
  company_size text,
  industry text,
  website text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================
-- 4. RLS (Row Level Security) 설정
-- =============================================

-- profiles
alter table public.profiles enable row level security;

create policy "누구나 프로필 조회 가능" on public.profiles
  for select using (true);

create policy "본인 프로필 삽입 가능" on public.profiles
  for insert with check (auth.uid() = id);

create policy "본인 프로필 수정 가능" on public.profiles
  for update using (auth.uid() = id);

-- job_seeker_profiles
alter table public.job_seeker_profiles enable row level security;

create policy "구직자 프로필 조회 가능" on public.job_seeker_profiles
  for select using (true);

create policy "본인 구직자 프로필 관리" on public.job_seeker_profiles
  for all using (auth.uid() = id);

-- companies
alter table public.companies enable row level security;

create policy "누구나 기업 조회 가능" on public.companies
  for select using (true);

create policy "기업주 본인 기업 관리" on public.companies
  for all using (auth.uid() = owner_id);

-- jobs (기존 테이블에 RLS 추가)
alter table public.jobs enable row level security;

create policy "누구나 공개 채용공고 조회" on public.jobs
  for select using (is_published = true or auth.uid() = owner_id);

create policy "기업주 채용공고 등록" on public.jobs
  for insert with check (auth.uid() = owner_id);

create policy "기업주 본인 채용공고 수정" on public.jobs
  for update using (auth.uid() = owner_id);

create policy "기업주 본인 채용공고 삭제" on public.jobs
  for delete using (auth.uid() = owner_id);

-- waitlist (기존 테이블에 RLS 추가)
alter table public.waitlist enable row level security;

create policy "누구나 대기목록 등록 가능" on public.waitlist
  for insert with check (true);

-- =============================================
-- 5. 관리자 권한 함수
-- =============================================
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- 관리자 전체 권한 정책
create policy "관리자 모든 프로필 관리" on public.profiles
  for all using (is_admin());

create policy "관리자 모든 채용공고 관리" on public.jobs
  for all using (is_admin());

create policy "관리자 대기목록 조회" on public.waitlist
  for select using (is_admin());

-- =============================================
-- 6. 신규 회원가입 시 프로필 자동 생성 트리거
-- =============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'job_seeker')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 7. updated_at 자동 업데이트 트리거
-- =============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure update_updated_at();

create trigger companies_updated_at before update on public.companies
  for each row execute procedure update_updated_at();

create trigger job_seeker_profiles_updated_at before update on public.job_seeker_profiles
  for each row execute procedure update_updated_at();
