import { createClient } from '@/lib/supabase/server'

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
    { label: '전체 회원', value: totalUsers ?? 0, color: 'bg-blue-50 text-blue-700' },
    { label: '구직자', value: jobSeekers ?? 0, color: 'bg-green-50 text-green-700' },
    { label: '기업 담당자', value: employers ?? 0, color: 'bg-purple-50 text-purple-700' },
    { label: '전체 채용공고', value: totalJobs ?? 0, color: 'bg-orange-50 text-orange-700' },
    { label: '승인 대기 공고', value: pendingJobs ?? 0, color: 'bg-red-50 text-red-700' },
    { label: '대기목록', value: waitlistCount ?? 0, color: 'bg-gray-50 text-gray-700' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[#0B1F3A] mb-2">대시보드</h1>
      <p className="text-gray-500 text-sm mb-8">Finquara 플랫폼 현황</p>

      {/* 통계 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {stats.map(stat => (
          <div key={stat.label} className={`rounded-xl p-5 ${stat.color}`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm mt-0.5 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 최근 가입 회원 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">최근 가입 회원</h2>
          {recentUsers?.length === 0 ? (
            <p className="text-gray-400 text-sm">없음</p>
          ) : (
            <div className="space-y-3">
              {recentUsers?.map((u, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.full_name || '이름 없음'}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.role === 'employer' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'admin' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {u.role === 'employer' ? '기업' : u.role === 'admin' ? '관리자' : '구직자'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 승인 대기 공고 */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">승인 대기 채용공고</h2>
          {recentPendingJobs?.length === 0 ? (
            <p className="text-gray-400 text-sm">대기 중인 공고 없음</p>
          ) : (
            <div className="space-y-3">
              {recentPendingJobs?.map((job, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.company}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                    대기 중
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
