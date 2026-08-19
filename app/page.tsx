import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import WaitlistForm from '@/components/home/WaitlistForm'
import { DETAILED_SPECIALTIES, MAIN_SPECIALIZATIONS } from '@/lib/constants/actuary'
import type { Job } from '@/types/database'

function formatDate(dateStr: string): string {
  return new Date(dateStr)
    .toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
    })
    .replace(/\.\s+/g, '.')
    .replace(/\.$/, '')
}

export default async function Home() {
  let jobs: Job[] = []
  let jobCount = 0

  try {
    const supabase = await createClient()
    const { data, count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(6)
    jobs = (data ?? []) as Job[]
    jobCount = count ?? jobs.length
  } catch {
    // DB 미연결 시에도 페이지는 렌더링된다
  }

  const companyCount = new Set(jobs.map(j => j.company)).size

  return (
    <main>
      {/* ══════════ 01 — Hero ══════════ */}
      <section className="section pt-24">
        <div className="container">
          <div className="grid grid-cols-[1.55fr_1fr] items-end gap-x-16 gap-y-14 fold-980">
            <div>
              <p className="label-sm">Finquara — Actuarial Talent Network</p>
              <h1 className="display mt-8">
                Beyond jobs,
                <br />
                toward insight.
              </h1>
              <p className="body mt-10 max-w-[46ch]">
                계리 직군 하나만 다루는 채용·데이터 플랫폼입니다. 공고, 연봉, 커리어
                경로를 같은 기준으로 정리합니다.
              </p>

              <div className="mt-12 flex flex-wrap items-center gap-4">
                <Link href="/jobs" className="btn">
                  채용공고 보기
                </Link>
                <Link href="/auth/signup" className="btn btn-ghost">
                  회원가입
                </Link>
              </div>
            </div>

            {/* 우측 — 사실만 나열한 메타 블록 */}
            <div className="border-t border-line-strong">
              <MetaRow label="Open positions" value={String(jobCount)} />
              <MetaRow label="Main sectors" value={String(MAIN_SPECIALIZATIONS.length)} />
              <MetaRow label="Specialties" value={String(DETAILED_SPECIALTIES.length)} />
              <MetaRow label="Coverage" value="Korea" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 02 — Statement ══════════ */}
      <section className="ink-block">
        <div className="container">
          <div className="grid grid-cols-[1fr_1.15fr] gap-x-16 gap-y-12 py-28 fold-980">
            <div>
              <p className="label-sm">02 / Statement</p>
            </div>
            <div>
              <h2 className="h2">
                One profession.
                <br />
                Not fifty.
              </h2>
              <p className="body mt-10 max-w-[52ch]">
                종합 채용 사이트는 계리 직무를 &lsquo;금융/보험&rsquo; 한 칸으로 처리합니다.
                Finquara는 결산, 모델링, EV, 요율개발, ALM을 각각 다른 일로 봅니다.
              </p>
              <p className="body mt-6 max-w-[52ch]">
                분류가 정확해야 비교가 가능합니다. 비교가 가능해야 커리어 판단이
                가능합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 03 — Index (실데이터) ══════════ */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-[1fr_1.15fr] items-start gap-x-16 gap-y-10 fold-980">
            <div>
              <p className="label-sm">03 / Index</p>
              <h2 className="h2 mt-6">Latest roles.</h2>
            </div>
            <div className="flex items-end justify-between gap-6 md:pb-3">
              <p className="body max-w-[40ch]">
                현재 공개된 공고 {jobCount}건. 분야·세부전문·경력 기준으로 필터링할 수
                있습니다.
              </p>
              <Link href="/jobs" className="label link whitespace-nowrap">
                전체 보기
              </Link>
            </div>
          </div>

          <div className="mt-16 border-t border-line-strong">
            {jobs.length === 0 ? (
              <p className="body py-12">등록된 공고가 아직 없습니다.</p>
            ) : (
              jobs.map((job, i) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="row grid grid-cols-[3.5rem_1.9fr_1fr_auto] items-baseline gap-x-8 border-b border-line py-7 fold-720"
                >
                  <span className="num">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="h4 block">{job.title}</span>
                    <span className="body-sm mt-1 block">{job.company}</span>
                  </span>
                  <span className="body-sm">
                    {job.main_specializations?.[0] ?? job.specialization ?? '—'}
                  </span>
                  <span className="label-sm whitespace-nowrap">
                    {job.experience_level || formatDate(job.created_at)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ══════════ 04 — Salary ══════════ */}
      <section className="section-tight">
        <div className="container">
          <div className="panel-strong">
            <div className="grid grid-cols-[1.2fr_1fr] gap-x-16 gap-y-12 p-12 md:p-16 fold-980">
              <div>
                <p className="label-sm">04 / Data</p>
                <h2 className="h2 mt-6">
                  Salary,
                  <br />
                  in the open.
                </h2>
                <p className="body mt-8 max-w-[44ch]">
                  경력 구간, 회사 유형, 세부 전문분야별 연봉 분포를 봅니다. 체감이 아니라
                  분포로 확인하세요.
                </p>
                <div className="mt-10">
                  <Link href="/salary-survey" className="btn">
                    Salary Survey
                  </Link>
                </div>
              </div>

              <div className="border-t border-line-strong">
                <MetaRow label="구분 축" value="경력 · 업권 · 전문분야" />
                <MetaRow label="표시" value="중앙값 · 사분위" />
                <MetaRow label="갱신" value="연 1회" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 05 — Access ══════════ */}
      <section className="section">
        <div className="container">
          <div className="grid grid-cols-[1fr_1.35fr] gap-x-16 gap-y-12 fold-980">
            <div>
              <p className="label-sm">05 / Access</p>
              <h2 className="h2 mt-6">
                Get it
                <br />
                first.
              </h2>
              <p className="body mt-8 max-w-[36ch]">
                공고가 공개되기 전에, 데이터가 갱신되기 전에 알림을 받습니다.
              </p>
              {companyCount > 0 && (
                <p className="label-sm mt-10">
                  Currently listing {companyCount} companies
                </p>
              )}
            </div>

            <WaitlistForm />
          </div>
        </div>
      </section>
    </main>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-5">
      <span className="label-sm">{label}</span>
      <span className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
        {value}
      </span>
    </div>
  )
}
