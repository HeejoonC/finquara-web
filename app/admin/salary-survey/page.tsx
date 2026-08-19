'use client'

import { useState, useRef } from 'react'
import { SURVEY_MOCK_DATA } from '@/lib/salary-survey/mockData'
import type { SurveyRecord, SurveyYear } from '@/lib/salary-survey/mockData'
import { formatKRW } from '@/lib/salary-survey/utils'
import { PageHeader } from '@/components/ui/Form'

// ── CSV Parser ─────────────────────────────────────────────────────────────

function parseCSV(text: string): Omit<SurveyRecord, 'id'>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = vals[idx] || '' })
    return {
      surveyYear:     (parseInt(row.surveyYear) || 2025) as SurveyYear,
      industry:       row.industry as SurveyRecord['industry'],
      function:       row.function as SurveyRecord['function'],
      location:       (row.location || 'Seoul') as SurveyRecord['location'],
      credential:     (row.credential || 'Other') as SurveyRecord['credential'],
      companyType:    (row.companyType || '기타') as SurveyRecord['companyType'],
      yearsExperience: parseFloat(row.yearsExperience) || 0,
      baseSalary:     parseInt(row.baseSalary) || 0,
      totalComp:      parseInt(row.totalComp) || 0,
      bonusRatio:     parseFloat(row.bonusRatio) || 0,
    }
  })
}

// ── Stats by year ──────────────────────────────────────────────────────────

function statsByYear(data: SurveyRecord[]) {
  const years = [...new Set(data.map(r => r.surveyYear))].sort()
  return years.map(y => {
    const subset = data.filter(r => r.surveyYear === y)
    const avgBase = Math.round(subset.reduce((a, b) => a + b.baseSalary, 0) / subset.length)
    return { year: y, count: subset.length, avgBase }
  })
}

const CSV_FIELDS: [string, string, string, string][] = [
  ['surveyYear', 'number', '2026', '조사 연도'],
  ['industry', 'string', '생명보험', '보험권역 (MAIN_SPECIALIZATIONS 값 사용)'],
  ['function', 'string', '계리평가 - 결산', '직무분야 (DETAILED_SPECIALTIES 값 사용)'],
  ['location', 'string', 'Seoul', 'Seoul / Korea / Remote / Global'],
  ['credential', 'string', 'ASA', 'Student / ASA / FSA / KAA / Other'],
  ['companyType', 'string', '보험사', '보험사 / 컨설팅 / 회계법인 / 헤드헌팅/리크루팅 / 기타'],
  ['yearsExperience', 'number', '5', '경력 연수 (소수점 가능)'],
  ['baseSalary', 'number', '90000000', '연간 기본급 (KRW)'],
  ['totalComp', 'number', '105000000', '연간 총보상 (KRW, 보너스 포함)'],
  ['bonusRatio', 'number', '0.17', '보너스 비율 (0.0~1.0, 예: 17% → 0.17)'],
]

// ── Component ─────────────────────────────────────────────────────────────

export default function AdminSalarySurveyPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadYear, setUploadYear] = useState<SurveyYear>(2026)
  const [preview, setPreview] = useState<Omit<SurveyRecord, 'id'>[] | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  // Existing dataset overview
  const stats = statsByYear(SURVEY_MOCK_DATA)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setStatus('parsing')
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = parseCSV(ev.target?.result as string)
        setPreview(parsed)
        setStatus('ready')
      } catch {
        setStatus('error')
        setErrorMsg('CSV 파싱 중 오류가 발생했습니다. 형식을 확인해주세요.')
      }
    }
    reader.readAsText(file)
  }

  function handleSave() {
    if (!preview?.length) return
    setStatus('saving')
    // In production: POST to Supabase or API endpoint with surveyYear tag
    setTimeout(() => {
      setStatus('saved')
      setPreview(null)
      setFileName(null)
    }, 1200)
  }

  function reset() {
    setPreview(null)
    setFileName(null)
    setStatus('idle')
    setErrorMsg('')
    if (fileRef.current) fileRef.current.value = ''
  }

  // CSV template download
  function downloadTemplate() {
    const headers = 'surveyYear,industry,function,location,credential,companyType,yearsExperience,baseSalary,totalComp,bonusRatio'
    const example = '2026,생명보험,계리평가 - 결산,Seoul,ASA,보험사,5,90000000,105000000,0.17'
    const blob = new Blob([`${headers}\n${example}\n`], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'salary_survey_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container">
      <PageHeader
        index="Admin / Salary"
        title="Survey data."
        description="연도별 설문 데이터를 CSV로 업로드하고 관리합니다."
      />

      {/* Existing datasets */}
      <section className="mt-16">
        <p className="label-sm border-b border-line-strong pb-4">등록된 데이터셋</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="table-head">
                <th className="py-4 font-semibold">Year</th>
                <th className="py-4 font-semibold">Responses</th>
                <th className="py-4 font-semibold">Avg base</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(s => (
                <tr key={s.year} className="border-b border-line transition-colors hover:bg-bg-strong">
                  <td className="py-5 text-[1rem] font-semibold tracking-[-0.02em] text-ink">
                    {s.year} Survey
                  </td>
                  <td className="body-sm py-5 tabular-nums">{s.count}</td>
                  <td className="body-sm py-5 tabular-nums">{formatKRW(s.avgBase, true)}</td>
                  <td className="py-5">
                    <span className="tag">게시 중</span>
                  </td>
                  <td className="py-5 text-right">
                    <button type="button" className="btn-text">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Upload section */}
      <section className="mt-20">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line-strong pb-4">
          <p className="label-sm">새 데이터셋 업로드</p>
          <button type="button" onClick={downloadTemplate} className="btn-text">
            CSV 템플릿 다운로드
          </button>
        </div>

        <div className="mt-8 space-y-8">
          {/* Year selector */}
          <div className="max-w-[240px]">
            <label htmlFor="upload-year" className="form-label">
              조사 연도
            </label>
            <select
              id="upload-year"
              value={uploadYear}
              onChange={e => setUploadYear(parseInt(e.target.value) as SurveyYear)}
              className="field"
            >
              <option value={2025}>2025 Survey</option>
              <option value={2026}>2026 Survey</option>
            </select>
          </div>

          {/* Drop zone */}
          {(status === 'idle' || status === 'error') && (
            <label className="block cursor-pointer border border-dashed border-line-strong px-8 py-14 text-center transition-colors hover:border-ink">
              <p className="label-sm">CSV</p>
              <p className="h4 mt-3">파일을 선택하세요</p>
              <p className="body-sm mt-2 text-[0.85rem]">또는 여기에 드래그 앤 드롭</p>
              {status === 'error' && <p className="notice-quiet mt-6 text-left">{errorMsg}</p>}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </label>
          )}

          {status === 'parsing' && <p className="label-sm py-10">Parsing…</p>}

          {status === 'saved' && (
            <div className="notice flex flex-wrap items-center justify-between gap-4">
              <span>데이터가 저장되었습니다.</span>
              <button type="button" onClick={reset} className="btn-text">
                새 파일 업로드
              </button>
            </div>
          )}

          {/* Preview table */}
          {preview !== null && (status === 'ready' || status === 'saving') && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4">
                <span className="flex flex-wrap items-baseline gap-4">
                  <span className="text-[1rem] font-medium text-ink">{fileName}</span>
                  <span className="num">{preview.length} rows</span>
                </span>
                <button type="button" onClick={reset} className="btn-text">
                  Cancel
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead>
                    <tr className="table-head">
                      {['연도', '보험권역', '직무분야', '지역', '자격', '회사유형', '연차', 'Base', 'Total'].map(h => (
                        <th key={h} className="py-3 pr-4 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-b border-line">
                        <td className="body-sm py-3 pr-4 text-[0.85rem] tabular-nums">{r.surveyYear}</td>
                        <td className="body-sm py-3 pr-4 text-[0.85rem]">{r.industry}</td>
                        <td className="body-sm max-w-[160px] truncate py-3 pr-4 text-[0.85rem]">{r.function}</td>
                        <td className="body-sm py-3 pr-4 text-[0.85rem]">{r.location}</td>
                        <td className="body-sm py-3 pr-4 text-[0.85rem]">{r.credential}</td>
                        <td className="body-sm py-3 pr-4 text-[0.85rem]">{r.companyType}</td>
                        <td className="body-sm py-3 pr-4 text-[0.85rem] tabular-nums">{r.yearsExperience}년</td>
                        <td className="body-sm py-3 pr-4 text-[0.85rem] tabular-nums">{formatKRW(r.baseSalary, true)}</td>
                        <td className="body-sm py-3 text-[0.85rem] tabular-nums">{formatKRW(r.totalComp, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="label-sm py-4">+{preview.length - 10} rows (최초 10행 미리보기)</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  className="btn"
                >
                  {status === 'saving' ? '저장 중' : `${uploadYear} Survey 데이터 저장`}
                </button>
                <button type="button" onClick={reset} className="btn btn-ghost">
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Field reference */}
      <section className="mt-20">
        <p className="label-sm border-b border-line-strong pb-4">CSV 필드 안내</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="table-head">
                <th className="py-4 font-semibold">Field</th>
                <th className="py-4 font-semibold">Type</th>
                <th className="py-4 font-semibold">Example</th>
                <th className="py-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {CSV_FIELDS.map(([field, type, example, desc]) => (
                <tr key={field} className="border-b border-line">
                  <td className="py-3.5 pr-6 font-mono text-[0.86rem] text-ink">{field}</td>
                  <td className="body-sm py-3.5 pr-6 text-[0.85rem]">{type}</td>
                  <td className="body-sm py-3.5 pr-6 text-[0.85rem]">{example}</td>
                  <td className="body-sm py-3.5 text-[0.85rem]">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
