import { createClient } from '@/lib/supabase/server'
import type { Job } from '@/types/database'

const JOB_TYPE_LABEL: Record<string, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract: '계약직',
  internship: '인턴',
}

export default async function JobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">채용공고</h1>
        <p className="text-gray-500 text-sm mt-1">금융·계리 분야 채용정보를 확인하세요.</p>
      </div>

      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">현재 등록된 채용공고가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: Job) => (
            <div key={job.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {job.specialization && (
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100">
                        {job.specialization}
                      </span>
                    )}
                    {job.experience_level && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {job.experience_level}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold text-[#0B1F3A] truncate">{job.title}</h2>
                  <p className="text-gray-600 text-sm mt-0.5">{job.company}</p>
                </div>

                {job.apply_url && (
                  <a
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-4 py-2 bg-[#2563EB] text-white text-sm rounded-lg hover:opacity-90 transition-opacity"
                  >
                    지원하기
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-sm text-gray-500">
                {job.location && <span>📍 {job.location}</span>}
                {job.salary_range && <span>💰 {job.salary_range}</span>}
                <span>📅 {new Date(job.created_at).toLocaleDateString('ko-KR')}</span>
              </div>

              {job.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{job.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
