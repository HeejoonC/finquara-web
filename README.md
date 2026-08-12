This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI 채용공고 자동 수집

계리사 채용공고를 AI가 검색·분류해 DB에 자동 등록합니다. 두 가지 실행 경로가 있습니다.

| 경로 | 모델 | 비용 | 실행 위치 |
| --- | --- | --- | --- |
| `npm run scrape` | Claude Sonnet 5 (Agent SDK) | **Claude Code 구독 토큰** (추가 과금 없음) | 로컬 PC |
| `/admin/ai-import` 페이지 | DeepSeek V3.2 (OpenRouter) | OpenRouter 종량 과금 | 서버(Vercel 포함) |

Claude Agent SDK는 Claude Code CLI를 서브프로세스로 띄워 로컬 로그인 자격증명을 사용하므로,
서버리스 환경에서는 동작하지 않습니다. 그래서 서버 경로는 OpenRouter를 씁니다.

### 최초 설정

1. **환경변수** — `.env.example`을 `.env.local`로 복사하고 값을 채웁니다.
   - `SUPABASE_SERVICE_ROLE_KEY` (필수 — 자동 등록에 사용)
   - `OPENROUTER_API_KEY` (웹 페이지 경로를 쓸 때만)

2. **DB 마이그레이션** — Supabase Dashboard → SQL Editor에서 순서대로 실행합니다.
   - `supabase/migrations/20260311_create_job_imports.sql`
   - `supabase/migrations/v6_job_imports_dedup.sql`

3. **Claude Code 로그인** (로컬 스크립트를 쓸 경우) — 터미널에서 `claude` 실행 후 `/login`.

4. **의존성 설치** — `npm install`

### 로컬 스크립트 사용법

```bash
npm run scrape                                     # 기본값 (목표 15건, 자동 등록·비공개)
npm run scrape -- --max 30                         # 목표 30건
npm run scrape -- --keywords "보험계리사,actuary"   # 검색 키워드 지정
npm run scrape -- --locations "Korea,Singapore"    # 대상 지역 지정
npm run scrape -- --publish                        # 등록과 동시에 즉시 공개
npm run scrape -- --pending                        # 자동 등록 없이 검토 대기로만 저장
npm run scrape -- --dry-run                        # DB 저장 없이 무엇을 찾는지만 확인
```

### 정기 자동 실행 (Windows 작업 스케줄러)

`scripts/scrape-jobs.bat`을 등록하면 매일 자동으로 수집됩니다.

1. `Win+R` → `taskschd.msc` → **작업 만들기**
2. **일반** 탭: 이름 입력, **"사용자가 로그온할 때만 실행"** 선택
   (Claude Code 자격증명이 사용자 프로필에 있어 "로그온 여부에 관계없이 실행"은 동작하지 않습니다)
3. **트리거** 탭: 매일 / 원하는 시각
4. **동작** 탭: 프로그램 시작 → `scripts\scrape-jobs.bat` 전체 경로, 시작 위치는 프로젝트 루트

실행 로그는 `logs/scrape-YYYYMMDD.log`에 쌓입니다.

### 동작 방식

- 수집한 공고는 `job_imports`(이력)와 `jobs`(실제 공고)에 **동시에** 기록됩니다.
- 기본값은 `is_published=false` — 사이트에 바로 노출되지 않으며 `/admin/jobs`에서 게시할 수 있습니다.
- 중복은 `apply_url` 또는 `회사명+직책명` 기준으로 자동 제거됩니다.
- AI가 만들어낸 분류값은 `lib/constants/actuary.ts`의 허용 목록과 대조해 걸러냅니다.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
