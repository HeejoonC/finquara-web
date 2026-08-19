import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/Form'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalUsers },
    { count: jobSeekers },
    { count: employers },
    { count: totalJobs },
    { count: pendingJobs },
    { count: waitlistCount },
    { data: recentUsers },
    { data: recentPendingJobs },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'job_seeker'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employer'),
    supabase.from('jobs').select('*', { count: 'exact', head: true }),
    supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('full_name, email, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('jobs').select('title, company, created_at').eq('is_published', false).order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: '전체 회원', value: totalUsers ?? 0 },
    { label: '구직자', value: jobSeekers ?? 0 },
    { label: '기업 담당자', value: employers ?? 0 },
    { label: '전체 채용공고', value: totalJobs ?? 0 },
    { label: '승인 대기 공고', value: pendingJobs ?? 0, highlight: true },
    { label: '대기목록', value: waitlistCount ?? 0 },
  ]

  const roleLabel = (role: string) =>
    role === 'employer' ? '기업' : role === 'admin' ? '관리자' : '구직자'

  return (
    <div className="container">
      <PageHeader
        index="Admin / Overview"
        title="Platform."
        description="Finquara 플랫폼 현황."
      />

      {/* 통계 */}
      <div className="mt-14 grid grid-cols-3 border-l border-t border-line-strong fold-720">
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`border-b border-r border-line-strong p-7 ${stat.highlight ? 'ink-block' : ''}`}
          >
            <p className="label-sm">{stat.label}</p>
            <p className="mt-5 text-[clamp(2rem,3vw,3rem)] font-bold leading-none tracking-[-0.06em] tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-2 gap-x-16 gap-y-16 fold-980">
        {/* 최근 가입 회원 */}
        <section>
          <p className="label-sm border-b border-line-strong pb-4">최근 가입 회원</p>
          {!recentUsers?.length ? (
            <p className="body py-8">없음</p>
          ) : (
            <div>
              {recentUsers.map((u, i) => (
                <div
                  key={i}
                  className="row flex items-center justify-between gap-6 border-b border-line py-5"
                >
                  <div className="min-w-0">
                    <p className="h4 truncate text-[1rem]">{u.full_name || '이름 없음'}</p>
                    <p className="body-sm mt-1 truncate text-[0.85rem]">{u.email}</p>
                  </div>
                  <span className="tag">{roleLabel(u.role)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 승인 대기 공고 */}
        <section>
          <p className="label-sm border-b border-line-strong pb-4">승인 대기 채용공고</p>
          {!recentPendingJobs?.length ? (
            <p className="body py-8">대기 중인 공고 없음</p>
          ) : (
            <div>
              {recentPendingJobs.map((job, i) => (
                <div
                  key={i}
                  className="row flex items-center justify-between gap-6 border-b border-line py-5"
                >
                  <div className="min-w-0">
                    <p className="h4 truncate text-[1rem]">{job.title}</p>
                    <p className="body-sm mt-1 truncate text-[0.85rem]">{job.company}</p>
                  </div>
                  <span className="tag tag-solid">대기</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
