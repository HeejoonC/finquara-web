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
  ReadOnlyField,
  ChipGroup,
  RadioGroup,
  PageHeader,
} from '@/components/ui/Form'

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), { ssr: false })

const WORKPLACE_TYPES = ['대면 근무', '원격 근무', '하이브리드'] as const

export default function PostJobPage() {
  const router = useRouter()
  const supabase = createClient()
  const taxonomy = useTaxonomy()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [ownerId, setOwnerId] = useState('')
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single()

      if (!profile) {
        router.push('/auth/login')
        return
      }

      let name = ''
      if (profile.role === 'admin') {
        name = 'Finquara'
      } else if (profile.role === 'employer') {
        const { data: company } = await supabase
          .from('companies')
          .select('company_name')
          .eq('owner_id', user.id)
          .single()
        name = company?.company_name || profile.full_name || user.email || ''
      } else {
        name = profile.full_name || user.email || ''
      }

      setDisplayName(name)
      setOwnerId(user.id)
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
    if (!ownerId || !displayName) return
    setSubmitting(true)
    setMessage('')

    const locationParts = [form.location, form.workplace_type].filter(Boolean)
    const combinedLocation = locationParts.join(' · ')

    const { error } = await supabase.from('jobs').insert({
      title: form.title,
      company: displayName,
      location: combinedLocation || null,
      experience_level: form.experience_level || null,
      employment_type: form.employment_type || null,
      salary_range: form.salary_range || null,
      description: form.description || null,
      apply_url: form.apply_url || null,
      contact_info: [form.contact_email, form.contact_phone].filter(Boolean).join(' / ') || null,
      owner_id: ownerId,
      main_specializations: mainSpecializations,
      detailed_specialties: detailedSpecialties,
      is_published: true,
    })

    if (error) {
      setMessage('등록 중 오류가 발생했습니다: ' + error.message)
    } else {
      setMessage('채용공고가 등록되었습니다.')
      setForm({
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
      setMainSpecializations([])
      setDetailedSpecialties([])
    }
    setSubmitting(false)
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
          index="Post a job"
          title={
            <>
              New
              <br />
              listing.
            </>
          }
          description="등록 즉시 공개됩니다. 분류를 정확히 선택할수록 적합한 지원자에게 도달합니다."
          aside={
            <div className="border-t border-line-strong">
              <div className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                <span className="label-sm">게시자</span>
                <span className="text-[1rem] font-semibold tracking-[-0.02em] text-ink">
                  {displayName}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-6 border-b border-line py-4">
                <span className="label-sm">공개 시점</span>
                <span className="text-[1rem] font-semibold tracking-[-0.02em] text-ink">즉시</span>
              </div>
            </div>
          }
        />

        <form onSubmit={handleSubmit} className="mt-4">
          {/* 1. 직무 정보 */}
          <FormSection step="1" title="직무 정보" note="공고 제목과 근무지를 입력합니다.">
            <TextField
              label="직책 (공고 제목)"
              value={form.title}
              onChange={v => update('title', v)}
              required
              placeholder="예: 생명보험 계리사 (신입/경력)"
            />

            <ReadOnlyField label="게시 회사" value={displayName} />

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
          <FormSection step="2" title="고용 조건" note="경력 범위는 필터 검색에 그대로 쓰입니다.">
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
            note="업무내용, 자격요건, 우대사항, 복지 등. 이미지도 삽입할 수 있습니다."
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(v => !v)}
                className="btn-text"
              >
                {showPreview ? '편집으로 돌아가기' : '미리보기'}
              </button>
            </div>

            {showPreview ? (
              <div className="min-h-[400px] border border-line-strong p-8">
                <p className="label-sm border-b border-line pb-4">
                  Preview — 공고에 표시되는 모습
                </p>
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
          <FormSection
            step="5"
            title="지원 방법"
            note="외부 채용 링크(잡코리아, 사람인, 회사 채용 페이지 등)를 입력해 주세요."
          >
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
            <button type="submit" disabled={submitting} className="btn">
              {submitting ? '등록 중' : '채용공고 등록'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
