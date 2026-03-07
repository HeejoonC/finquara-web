-- =============================================
-- Finquara 추가 스키마
-- Supabase SQL 편집기에 이 내용 전체를 복사해서 실행하세요.
-- =============================================

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
-- 4. RLS 활성화
-- =============================================
alter table public.profiles enable row level security;
alter table public.job_seeker_profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.waitlist enable row level security;

-- =============================================
-- 5. 관리자 권한 함수 (정책보다 먼저 생성)
-- =============================================
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- =============================================
-- 6. profiles 정책 (기존 정책 제거 후 재생성)
-- =============================================
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (true);

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

create policy "profiles_delete" on public.profiles
  for delete using (public.is_admin());

-- =============================================
-- 7. job_seeker_profiles 정책
-- =============================================
drop policy if exists "jsp_select" on public.job_seeker_profiles;
drop policy if exists "jsp_all" on public.job_seeker_profiles;

create policy "jsp_select" on public.job_seeker_profiles
  for select using (true);

create policy "jsp_all" on public.job_seeker_profiles
  for all using (auth.uid() = id or public.is_admin());

-- =============================================
-- 8. companies 정책
-- =============================================
drop policy if exists "companies_select" on public.companies;
drop policy if exists "companies_all" on public.companies;

create policy "companies_select" on public.companies
  for select using (true);

create policy "companies_all" on public.companies
  for all using (auth.uid() = owner_id or public.is_admin());

-- =============================================
-- 9. jobs 정책
-- =============================================
drop policy if exists "jobs_select" on public.jobs;
drop policy if exists "jobs_insert" on public.jobs;
drop policy if exists "jobs_update" on public.jobs;
drop policy if exists "jobs_delete" on public.jobs;

create policy "jobs_select" on public.jobs
  for select using (is_published = true or auth.uid() = owner_id or public.is_admin());

create policy "jobs_insert" on public.jobs
  for insert with check (auth.uid() = owner_id);

create policy "jobs_update" on public.jobs
  for update using (auth.uid() = owner_id or public.is_admin());

create policy "jobs_delete" on public.jobs
  for delete using (auth.uid() = owner_id or public.is_admin());

-- =============================================
-- 10. waitlist 정책
-- =============================================
drop policy if exists "waitlist_insert" on public.waitlist;
drop policy if exists "waitlist_select" on public.waitlist;

create policy "waitlist_insert" on public.waitlist
  for insert with check (true);

create policy "waitlist_select" on public.waitlist
  for select using (public.is_admin());

-- =============================================
-- 11. 신규 회원가입 시 프로필 자동 생성 트리거
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
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =============================================
-- 12. updated_at 자동 업데이트 트리거
-- =============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.update_updated_at();

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies
  for each row execute procedure public.update_updated_at();

drop trigger if exists jsp_updated_at on public.job_seeker_profiles;
create trigger jsp_updated_at before update on public.job_seeker_profiles
  for each row execute procedure public.update_updated_at();
