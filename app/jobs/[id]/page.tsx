import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JobOwnerActions from './JobOwnerActions'

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: job }, { data: { user } }] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', id).single(),
    supabase.auth.getUser(),
  ])

  if (!job) notFound()

  const isOwner = !!user && user.id === job.owner_id

  const mainTags: string[] = job.main_specializations ?? []
  const detailTags: string[] = job.detailed_specialties ?? []
  // Fall back to legacy field for old records
  const displayMain = mainTags.length ? mainTags : (job.specialization ? [job.specialization] : [])

  const postedDate = new Date(job.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const contactInfo = (job as { contact_info?: string | null }).contact_info ?? ''
  const [contactEmail = '', contactPhone = ''] = contactInfo.split(' / ')

  return (
    <main className="section-tight">
      <div className="container">
        {/* Back nav + owner actions */}
        <div className="flex items-center justify-between gap-6 border-b border-line pb-6">
          <Link href="/jobs" className="label link">
            ← Back to index
          </Link>
          {isOwner && <JobOwnerActions jobId={id} />}
        </div>

        {/* ── Header ── */}
        <header className="grid grid-cols-[1.5fr_1fr] items-start gap-x-16 gap-y-10 py-16 fold-980">
          <div>
            <p className="label-sm">{job.company}</p>
            <h1 className="h2 mt-6">{job.title}</h1>
            <div className="mt-8 flex flex-wrap items-center gap-2">
              {displayMain.slice(0, 4).map(s => (
                <span key={s} className="tag tag-solid">
                  {s}
                </span>
              ))}
              {detailTags.slice(0, 4).map(s => (
                <span key={s} className="tag">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* 우측 — 사실 나열 */}
          <div className="border-t border-line-strong">
            {job.location && <MetaRow label="Location" value={job.location} />}
            {job.experience_level && <MetaRow label="Experience" value={job.experience_level} />}
            {job.employment_type && <MetaRow label="Type" value={job.employment_type} />}
            {job.salary_range && <MetaRow label="Salary" value={job.salary_range} />}
            <MetaRow label="Posted" value={postedDate} />
          </div>
        </header>

        {/* ── Body ── */}
        <div className="grid grid-cols-[1fr_2.2fr] items-start gap-x-16 gap-y-12 border-t border-line-strong pt-16 fold-980">
          <div>
            <p className="label-sm">Description</p>
          </div>

          <div>
            {job.description ? (
              job.description.startsWith('<') ? (
                <div
                  className="prose-editorial"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              ) : (
                <div className="prose-editorial whitespace-pre-wrap">{job.description}</div>
              )
            ) : (
              <p className="body">상세 내용이 등록되지 않았습니다.</p>
            )}

            {/* Contact */}
            {(contactEmail || contactPhone) && (
              <div className="mt-16 border-t border-line pt-8">
                <p className="label-sm">Contact</p>
                <div className="mt-5 grid grid-cols-2 gap-6 fold-520">
                  {contactEmail && <MetaStack label="Email" value={contactEmail} />}
                  {contactPhone && <MetaStack label="Phone" value={contactPhone} />}
                </div>
              </div>
            )}

            {/* Apply */}
            {job.apply_url && (
              <div className="mt-12">
                <a
                  href={job.apply_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                >
                  지원하기
                </a>
                <p className="body-sm mt-4 break-all">{job.apply_url}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-4">
      <span className="label-sm">{label}</span>
      <span className="text-right text-[0.98rem] font-medium tracking-[-0.01em] text-ink">
        {value}
      </span>
    </div>
  )
}

function MetaStack({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-sm">{label}</p>
      <p className="mt-2 break-all text-[0.98rem] text-ink">{value}</p>
    </div>
  )
}
