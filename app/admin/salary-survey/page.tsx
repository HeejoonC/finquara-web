'use client'

import { useState, useRef } from 'react'
import { SURVEY_MOCK_DATA } from '@/lib/salary-survey/mockData'
import type { SurveyRecord, SurveyYear } from '@/lib/salary-survey/mockData'
import { formatKRW } from '@/lib/salary-survey/utils'

// ── CSV Parser ─────────────────────────────────────────────────────────────

function parseCSV(text: string): Omit<SurveyRecord, 'id'>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  return lines.slice(1).map((line, i) => {
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
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Salary Survey 데이터 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          연도별 설문 데이터를 CSV로 업로드하고 관리합니다.
        </p>
      </div>

      {/* Existing datasets */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">등록된 데이터셋</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-xs text-gray-500 font-medium">조사 연도</th>
                <th className="text-left pb-2 text-xs text-gray-500 font-medium">응답 수</th>
                <th className="text-left pb-2 text-xs text-gray-500 font-medium">평균 Base (참고)</th>
                <th className="text-left pb-2 text-xs text-gray-500 font-medium">상태</th>
                <th className="text-right pb-2 text-xs text-gray-500 font-medium">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.map(s => (
                <tr key={s.year} className="hover:bg-gray-50">
                  <td className="py-3 font-semibold text-gray-900">{s.year} Survey</td>
                  <td className="py-3 text-gray-600">{s.count}명</td>
                  <td className="py-3 text-gray-600">{formatKRW(s.avgBase, true)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-50 text-green-700 border border-green-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      게시 중
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">새 데이터셋 업로드</h2>
            <p className="text-xs text-gray-500 mt-0.5">CSV 파일을 업로드하여 연도별 설문 데이터를 추가합니다.</p>
          </div>
          <button
            onClick={downloadTemplate}
            className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV 템플릿 다운로드
          </button>
        </div>

        {/* Year selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-700 shrink-0">조사 연도</label>
          <select
            value={uploadYear}
            onChange={e => setUploadYear(parseInt(e.target.value) as SurveyYear)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value={2025}>2025 Survey</option>
            <option value={2026}>2026 Survey</option>
          </select>
        </div>

        {/* Drop zone */}
        {status === 'idle' || status === 'error' ? (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-10 cursor-pointer hover:border-[#2563EB] hover:bg-blue-50/30 transition-colors">
            <svg className="w-8 h-8 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">CSV 파일을 선택하세요</p>
            <p className="text-xs text-gray-400 mt-1">또는 여기에 드래그 앤 드롭</p>
            {status === 'error' && (
              <p className="text-xs text-red-500 mt-2">{errorMsg}</p>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>
        ) : null}

        {status === 'parsing' && (
          <div className="flex items-center justify-center py-10 gap-3 text-sm text-gray-500">
            <svg className="animate-spin w-4 h-4 text-[#2563EB]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            파일 파싱 중...
          </div>
        )}

        {status === 'saved' && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            데이터가 저장되었습니다.
            <button onClick={reset} className="ml-auto text-xs text-green-600 hover:underline">새 파일 업로드</button>
          </div>
        )}

        {/* Preview table */}
        {preview !== null && (status === 'ready' || status === 'saving') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-medium text-gray-700">{fileName}</span>
                <span className="text-xs text-gray-400">{preview.length}행 파싱됨</span>
              </div>
              <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">취소</button>
            </div>

            {/* Preview rows */}
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['연도', '보험권역', '직무분야', '지역', '자격', '회사유형', '연차', 'Base', 'Total'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.slice(0, 10).map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-600">{r.surveyYear}</td>
                      <td className="px-3 py-2 text-gray-600">{r.industry}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[120px] truncate">{r.function}</td>
                      <td className="px-3 py-2 text-gray-600">{r.location}</td>
                      <td className="px-3 py-2 text-gray-600">{r.credential}</td>
                      <td className="px-3 py-2 text-gray-600">{r.companyType}</td>
                      <td className="px-3 py-2 text-gray-600">{r.yearsExperience}년</td>
                      <td className="px-3 py-2 text-gray-600">{formatKRW(r.baseSalary, true)}</td>
                      <td className="px-3 py-2 text-gray-600">{formatKRW(r.totalComp, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 10 && (
                <p className="text-xs text-center text-gray-400 py-2 border-t border-gray-100">
                  +{preview.length - 10}행 더 있음 (최초 10행 미리보기)
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={reset}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={status === 'saving'}
                className="px-4 py-2 text-sm font-medium bg-[#2563EB] text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
              >
                {status === 'saving' && (
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
                {uploadYear} Survey 데이터 저장
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Field reference */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">CSV 필드 안내</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2 text-gray-500 font-medium">필드명</th>
                <th className="text-left pb-2 text-gray-500 font-medium">타입</th>
                <th className="text-left pb-2 text-gray-500 font-medium">예시</th>
                <th className="text-left pb-2 text-gray-500 font-medium">설명</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
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
              ].map(([field, type, example, desc]) => (
                <tr key={field}>
                  <td className="py-2 font-mono text-gray-800">{field}</td>
                  <td className="py-2 text-gray-500">{type}</td>
                  <td className="py-2 text-gray-500">{example}</td>
                  <td className="py-2 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
