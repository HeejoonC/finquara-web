'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { EMPLOYMENT_TYPES } from '@/lib/constants/actuary'
import ExperienceField from '@/components/jobs/ExperienceField'
import { useTaxonomy } from '@/lib/hooks/useTaxonomy'
import {
  FormSection,
  TextField,
  SelectField,
  ChipGroup,
  RadioGroup,
  PageHeader,
} from '@/components/ui/Form'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false })

const WORKPLACE_TYPES = ['대면 근무', '원격 근무', '하이브리드'] as const

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()
  const taxonomy = useTaxonomy()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [jobId, setJobId] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const [form, setForm] = useState({
    title: '',
    location: '',
    workplace_type: '',
    experience_level: '',
    employment_type: '',
    salary_range: '',
    apply_url: '',
    contact_email: '',
    contact_phone: '',
    description: '',
  })
  const [mainSpecializations, setMainSpecializations] = useState<string[]>([])
  const [detailedSpecialties, setDetailedSpecialties] = useState<string[]>([])

  const update = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    async function load() {
      const { id } = await params

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (!job || job.owner_id !== user.id) { router.push('/jobs'); return }

      // Split location back into parts
      const locParts = (job.location ?? '').split(' · ')
      const location = locParts[0] ?? ''
      const workplace_type = locParts[1] ?? ''

      // Split contact_info back
      const contactParts = (job.contact_info ?? '').split(' / ')

      setJobId(id)
      setForm({
        title: job.title ?? '',
        location,
        workplace_type,
        experience_level: job.experience_level ?? '',
        employment_type: job.employment_type ?? '',
        salary_range: job.salary_range ?? '',
        apply_url: job.apply_url ?? '',
        contact_email: contactParts[0] ?? '',
        contact_phone: contactParts[1] ?? '',
        description: job.description ?? '',
      })
      setMainSpecializations(job.main_specializations ?? [])
      setDetailedSpecialties(job.detailed_specialties ?? [])
      setLoading(false)
    }
    load()
  }, [])

  function toggleMain(value: string) {
    setMainSpecializations(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function toggleDetail(value: string) {
    setDetailedSpecialties(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const locationParts = [form.location, form.workplace_type].filter(Boolean)
    const combinedLocation = locationParts.join(' · ')

    const { error } = await supabase
      .from('jobs')
      .update({
        title: form.title,
        location: combinedLocation || null,
        experience_level: form.experience_level || null,
        employment_type: form.employment_type || null,
        salary_range: form.salary_range || null,
        description: form.description || null,
        apply_url: form.apply_url || null,
        contact_info: [form.contact_email, form.contact_phone].filter(Boolean).join(' / ') || null,
        main_specializations: mainSpecializations,
        detailed_specialties: detailedSpecialties,
      })
      .eq('id', jobId)

    if (error) {
      setMessage('수정 중 오류가 발생했습니다: ' + error.message)
      setSubmitting(false)
    } else {
      router.push(`/jobs/${jobId}`)
    }
  }

  if (loading) {
    return (
      <main className="section">
        <div className="container">
          <p className="label-sm">Loading…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="section-tight">
      <div className="container">
        <PageHeader
          index="Edit listing"
          title={
            <>
              Update
              <br />
              the post.
            </>
          }
          description="수정 내용은 저장 즉시 공고에 반영됩니다."
        />

        <form onSubmit={handleSubmit} className="mt-4">
          {/* 1. 직무 정보 */}
          <FormSection step="1" title="직무 정보">
            <TextField
              label="직책 (공고 제목)"
              value={form.title}
              onChange={v => update('title', v)}
              required
              placeholder="예: 생명보험 계리사 (신입/경력)"
            />

            <div className="grid grid-cols-2 items-start gap-8 fold-720">
              <TextField
                label="근무 지역"
                value={form.location}
                onChange={v => update('location', v)}
                placeholder="서울, 부산 등"
              />
              <RadioGroup
                label="근무 형태"
                name="workplace_type"
                options={WORKPLACE_TYPES}
                value={form.workplace_type}
                onChange={v => update('workplace_type', v)}
              />
            </div>
          </FormSection>

          {/* 2. 고용 조건 */}
          <FormSection step="2" title="고용 조건">
            <div className="grid grid-cols-2 items-start gap-8 fold-720">
              <SelectField
                label="고용형태"
                value={form.employment_type}
                onChange={v => update('employment_type', v)}
                options={[...EMPLOYMENT_TYPES]}
              />
              <ExperienceField
                value={form.experience_level}
                onChange={v => update('experience_level', v)}
              />
            </div>
            <TextField
              label="급여 범위"
              value={form.salary_range}
              onChange={v => update('salary_range', v)}
              placeholder="예: 연 5,000~7,000만원, 면접 후 결정"
            />
          </FormSection>

          {/* 3. 전문 분야 */}
          <FormSection step="3" title="전문 분야" note="복수 선택이 가능합니다.">
            <ChipGroup
              label="주요 분야"
              note="복수 선택"
              options={taxonomy.main}
              selected={mainSpecializations}
              onToggle={toggleMain}
            />
            <ChipGroup
              label="세부 전문 분야"
              note="복수 선택"
              options={taxonomy.detail}
              selected={detailedSpecialties}
              onToggle={toggleDetail}
            />
          </FormSection>

          {/* 4. 모집 요강 */}
          <FormSection
            step="4"
            title="모집 요강"
            note="업무내용, 자격요건, 우대사항, 복지 등 자유롭게 작성하세요."
          >
            <div className="flex justify-end">
              <button type="button" onClick={() => setShowPreview(v => !v)} className="btn-text">
                {showPreview ? '편집으로 돌아가기' : '미리보기'}
              </button>
            </div>

            {showPreview ? (
              <div className="min-h-[400px] border border-line-strong p-8">
                <p className="label-sm border-b border-line pb-4">Preview</p>
                {form.description && form.description !== '<p></p>' ? (
                  <div
                    className="prose-editorial mt-6"
                    dangerouslySetInnerHTML={{ __html: form.description }}
                  />
                ) : (
                  <p className="body mt-6">내용을 입력하면 여기에 미리보기가 표시됩니다.</p>
                )}
              </div>
            ) : (
              <RichTextEditor
                value={form.description}
                onChange={v => update('description', v)}
                placeholder="업무 내용, 자격 요건, 우대 사항, 복지 및 혜택 등을 자유롭게 입력하세요."
              />
            )}
          </FormSection>

          {/* 5. 지원 방법 */}
          <FormSection step="5" title="지원 방법">
            <div className="grid grid-cols-2 gap-8 fold-720">
              <TextField
                label="지원 링크"
                value={form.apply_url}
                onChange={v => update('apply_url', v)}
                placeholder="https://..."
              />
              <TextField
                label="담당자 이메일"
                value={form.contact_email}
                onChange={v => update('contact_email', v)}
                placeholder="예: recruit@example.com"
              />
              <TextField
                label="담당자 연락처"
                value={form.contact_phone}
                onChange={v => update('contact_phone', v)}
                placeholder="예: 010-1234-5678"
              />
            </div>
          </FormSection>

          <div className="border-t border-line-strong pt-10">
            {message && <div className="notice mb-8">{message}</div>}
            <div className="flex flex-wrap gap-4">
              <button type="submit" disabled={submitting} className="btn">
                {submitting ? '저장 중' : '수정 완료'}
              </button>
              <button type="button" onClick={() => router.back()} className="btn btn-ghost">
                취소
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
