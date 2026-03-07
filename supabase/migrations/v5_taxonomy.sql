-- Taxonomy items table for admin-managed specialization lists
create table if not exists taxonomy_items (
  id uuid default gen_random_uuid() primary key,
  type text not null check (type in ('main', 'detail')),
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  unique (type, label)
);

alter table taxonomy_items enable row level security;

-- Anyone can read
create policy "Public read taxonomy" on taxonomy_items
  for select using (true);

-- Only admins can write
create policy "Admin write taxonomy" on taxonomy_items
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed main specializations
insert into taxonomy_items (type, label, sort_order) values
  ('main', '생명보험', 1),
  ('main', '손해보험', 2),
  ('main', '재보험', 3),
  ('main', '회계법인', 4),
  ('main', '계리법인', 5),
  ('main', '컨설팅', 6),
  ('main', '기타', 7)
on conflict (type, label) do nothing;

-- Seed detailed specialties
insert into taxonomy_items (type, label, sort_order) values
  ('detail', '계리평가 - 결산', 1),
  ('detail', '계리평가 - 모델링', 2),
  ('detail', '계리평가 - EV', 3),
  ('detail', '계리평가 - 가정관리', 4),
  ('detail', '가격산출 / 요율개발', 5),
  ('detail', '상품 - 개발', 6),
  ('detail', '상품 - 관리', 7),
  ('detail', '상품 - 위험율 개발', 8),
  ('detail', '상품 - 가정관리', 9),
  ('detail', '리스크관리 - ALM', 10),
  ('detail', '리스크관리 - 지급여력', 11),
  ('detail', '준비금 / 손해액 추정', 12),
  ('detail', '경영기획 / FP&A', 13),
  ('detail', '회계 / 재무보고', 14),
  ('detail', '투자 / 자산운용', 15),
  ('detail', '퇴직연금 / 연금계리', 16),
  ('detail', '재보험 관리', 17),
  ('detail', '컨설팅 / 자문', 18),
  ('detail', '계리시스템 / Prophet / AXIS / 자동화', 19),
  ('detail', '데이터 / 분석 / 경험통계', 20),
  ('detail', '기타', 21)
on conflict (type, label) do nothing;
