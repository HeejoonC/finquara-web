import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import JobFilters from '@/components/jobs/JobFilters'
import type { Job } from '@/types/database'

type SearchParams = Promise<{
  q?: string
  main?: string
  detail?: string
  exp?: string
  type?: string
}>

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  if (diffDays === 0) return '오늘'
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
}

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('jobs')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,company.ilike.%${params.q}%`)
  }
  if (params.main) {
    query = query.contains('main_specializations', [params.main])
  }
  if (params.detail) {
    query = query.contains('detailed_specialties', [params.detail])
  }
  if (params.exp) {
    query = query.eq('experience_level', params.exp)
  }
  if (params.type) {
    query = query.eq('employment_type', params.type)
  }

  const { data: jobs } = await query

  const hasActiveFilters = !!(params.q || params.main || params.detail || params.exp || params.type)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0B1F3A]">채용공고</h1>
        <p className="text-gray-500 text-sm mt-1">계리·보험 분야 채용정보를 찾아보세요.</p>
      </div>

      {/* Filters (client component) */}
      <JobFilters current={params} />

      {/* Result count */}
      <p className="text-sm text-gray-500 mb-5">
        {hasActiveFilters && '필터 적용 중 · '}
        {jobs?.length ?? 0}개의 채용공고
      </p>

      {/* Job list */}
      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-base mb-1">검색 결과가 없습니다.</p>
          <p className="text-sm">다른 검색어나 필터를 사용해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job: Job) => {
            const mainTags = job.main_specializations ?? []
            const detailTags = job.detailed_specialties ?? []
            // Fall back to legacy specialization field for old records
            const displayMain = mainTags.length ? mainTags : (job.specialization ? [job.specialization] : [])

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-[#2563EB] hover:shadow-sm transition-all group"
              >
                {/* Specialization tags */}
                {(displayMain.length > 0 || detailTags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {displayMain.slice(0, 2).map(s => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100"
                      >
                        {s}
                      </span>
                    ))}
                    {detailTags.slice(0, 2).map(s => (
                      <span
                        key={s}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                    {detailTags.length > 2 && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                        +{detailTags.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* Title */}
                <h2 className="text-base font-semibold text-gray-900 group-hover:text-[#2563EB] transition-colors">
                  {job.title}
                </h2>

                {/* Company · location · exp · type */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1 text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{job.company}</span>
                  {job.location && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span>{job.location}</span>
                    </>
                  )}
                  {job.experience_level && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span>{job.experience_level}</span>
                    </>
                  )}
                  {job.employment_type && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span>{job.employment_type}</span>
                    </>
                  )}
                </div>

                {/* Description excerpt */}
                {job.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{job.description}</p>
                )}

                {/* Date */}
                <div className="mt-3 text-xs text-gray-400">{formatDate(job.created_at)}</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
