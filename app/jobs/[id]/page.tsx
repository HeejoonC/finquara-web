import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (!job) notFound()

  const mainTags: string[] = job.main_specializations ?? []
  const detailTags: string[] = job.detailed_specialties ?? []
  // Fall back to legacy field for old records
  const displayMain = mainTags.length ? mainTags : (job.specialization ? [job.specialization] : [])

  const postedDate = new Date(job.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back nav */}
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2563EB] transition-colors mb-6"
      >
        ← 채용공고 목록
      </Link>

      {/* Header card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-[#0B1F3A] leading-snug">{job.title}</h1>

        {/* Company / location / date / poster */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-2 text-sm text-gray-600">
          <span className="font-medium text-gray-800">{job.company}</span>
          {job.location && (
            <>
              <span className="text-gray-300">·</span>
              <span>📍 {job.location}</span>
            </>
          )}
          <span className="text-gray-300">·</span>
          <span className="text-gray-400 text-xs">{postedDate} 등록</span>
        </div>

        {/* 분야 / 경력 / 세부전문 */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
          {displayMain.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0 pt-0.5">분야</span>
              <div className="flex flex-wrap gap-1.5">
                {displayMain.slice(0, 4).map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-blue-50 text-[#2563EB] rounded-full border border-blue-100">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
          {job.experience_level && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">경력</span>
              <span className="text-sm text-gray-700">{job.experience_level}</span>
              {job.employment_type && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-semibold text-gray-500">고용형태</span>
                  <span className="text-sm text-gray-700">{job.employment_type}</span>
                </>
              )}
              {job.salary_range && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs font-semibold text-gray-500">급여</span>
                  <span className="text-sm text-gray-700">{job.salary_range}</span>
                </>
              )}
            </div>
          )}
          {!job.experience_level && (job.employment_type || job.salary_range) && (
            <div className="flex items-center gap-3">
              {job.employment_type && (
                <>
                  <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0">고용형태</span>
                  <span className="text-sm text-gray-700">{job.employment_type}</span>
                </>
              )}
              {job.salary_range && (
                <>
                  {job.employment_type && <span className="text-gray-300">·</span>}
                  <span className="text-xs font-semibold text-gray-500">급여</span>
                  <span className="text-sm text-gray-700">{job.salary_range}</span>
                </>
              )}
            </div>
          )}
          {detailTags.length > 0 && (
            <div className="flex items-start gap-3">
              <span className="text-xs font-semibold text-gray-500 w-16 flex-shrink-0 pt-0.5">세부전문</span>
              <div className="flex flex-wrap gap-1.5">
                {detailTags.slice(0, 4).map(s => (
                  <span key={s} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact info */}
        {(job as any).contact_info && (() => {
          const parts = ((job as any).contact_info as string).split(' / ')
          const email = parts[0] || ''
          const phone = parts[1] || ''
          return (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4">
              {email && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">담당자 이메일</span>
                  <span className="mx-2 text-gray-300">|</span>
                  {email}
                </p>
              )}
              {phone && (
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">담당자 연락처</span>
                  <span className="mx-2 text-gray-300">|</span>
                  {phone}
                </p>
              )}
            </div>
          )
        })()}

        {/* Primary CTA */}
        {job.apply_url && (
          <div className="mt-5">
            <a
              href={job.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              지원하기 →
            </a>
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">공고 내용</h2>
          {job.description.startsWith('<') ? (
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA */}
      {job.apply_url && (
        <div className="mt-6 text-center">
          <a
            href={job.apply_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#2563EB] text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            지원하기 →
          </a>
        </div>
      )}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="mx-1.5 text-gray-300">|</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  )
}
