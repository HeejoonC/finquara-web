'use client'

import { useState } from 'react'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'
import type { SurveyFilters } from '@/lib/salary-survey/utils'
import type {
  SurveyIndustry,
  SurveyFunction,
  SurveyLocation,
  SurveyCredential,
  SurveyCompanyType,
  SurveyYear,
} from '@/lib/salary-survey/mockData'

interface Props {
  filters: SurveyFilters
  onChange: (f: SurveyFilters) => void
}

// ── Generic toggle helpers ────────────────────────────────────────────────
function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
}

// ── Chip component ────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-[#2563EB] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}

// ── FilterSection ─────────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

// ── Toggle row (radio-style) ──────────────────────────────────────────────
function ToggleRow({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
            i > 0 ? 'border-l border-gray-200' : ''
          } ${
            value === opt.value
              ? 'bg-[#2563EB] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

const LOCATIONS: SurveyLocation[] = ['Seoul', 'Korea', 'Remote', 'Global']
const CREDENTIALS: SurveyCredential[] = ['Student', 'ASA', 'FSA', 'KAA', 'Other']
const COMPANY_TYPES: SurveyCompanyType[] = ['보험사', '컨설팅', '회계법인', '헤드헌팅/리크루팅', '기타']
const SURVEY_YEARS: SurveyYear[] = [2025, 2026]

export default function SalarySurveyFilters({ filters, onChange }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [fnExpanded, setFnExpanded] = useState(false)

  function set(partial: Partial<SurveyFilters>) {
    onChange({ ...filters, ...partial })
  }

  const isActive = (
    filters.industry.length ||
    filters.function.length ||
    filters.location.length ||
    filters.credential.length ||
    filters.companyType.length
  ) > 0

  const displayedFunctions = fnExpanded
    ? DETAILED_SPECIALTIES
    : DETAILED_SPECIALTIES.slice(0, 8)

  const panel = (
    <div className="space-y-5">
      {/* Survey Year */}
      <FilterSection title="조사 연도">
        {SURVEY_YEARS.map(y => (
          <Chip
            key={y}
            label={String(y)}
            active={filters.surveyYear.includes(y)}
            onClick={() => set({ surveyYear: toggle(filters.surveyYear, y) })}
          />
        ))}
      </FilterSection>

      <div className="border-t border-gray-100" />

      {/* Compensation metric */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">보상 기준</p>
        <ToggleRow
          options={[
            { label: 'Base Salary', value: 'baseSalary' },
            { label: 'Total Comp', value: 'totalComp' },
          ]}
          value={filters.compensation}
          onChange={v => set({ compensation: v as 'baseSalary' | 'totalComp' })}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">표시 방식</p>
        <ToggleRow
          options={[
            { label: 'Median', value: 'median' },
            { label: 'Average', value: 'average' },
          ]}
          value={filters.metric}
          onChange={v => set({ metric: v as 'median' | 'average' })}
        />
        <label className="flex items-center gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={filters.showP25P75}
            onChange={e => set({ showP25P75: e.target.checked })}
            className="rounded border-gray-300 text-[#2563EB] focus:ring-[#2563EB]"
          />
          <span className="text-xs text-gray-600">P25 / P75 밴드 표시</span>
        </label>
      </div>

      <div className="border-t border-gray-100" />

      {/* Industry (보험권역) */}
      <FilterSection title="보험권역">
        {MAIN_SPECIALIZATIONS.map(ind => (
          <Chip
            key={ind}
            label={ind}
            active={filters.industry.includes(ind as SurveyIndustry)}
            onClick={() => set({ industry: toggle(filters.industry, ind as SurveyIndustry) })}
          />
        ))}
      </FilterSection>

      {/* Function (직무분야) */}
      <FilterSection title="직무분야">
        {displayedFunctions.map(fn => (
          <Chip
            key={fn}
            label={fn}
            active={filters.function.includes(fn as SurveyFunction)}
            onClick={() => set({ function: toggle(filters.function, fn as SurveyFunction) })}
          />
        ))}
        <button
          onClick={() => setFnExpanded(!fnExpanded)}
          className="text-xs text-[#2563EB] hover:underline px-1"
        >
          {fnExpanded ? '접기 ↑' : `+${DETAILED_SPECIALTIES.length - 8}개 더보기`}
        </button>
      </FilterSection>

      {/* Location */}
      <FilterSection title="지역">
        {LOCATIONS.map(loc => (
          <Chip
            key={loc}
            label={loc}
            active={filters.location.includes(loc)}
            onClick={() => set({ location: toggle(filters.location, loc) })}
          />
        ))}
      </FilterSection>

      {/* Credential */}
      <FilterSection title="자격 / 크리덴셜">
        {CREDENTIALS.map(c => (
          <Chip
            key={c}
            label={c}
            active={filters.credential.includes(c)}
            onClick={() => set({ credential: toggle(filters.credential, c) })}
          />
        ))}
      </FilterSection>

      {/* Company Type */}
      <FilterSection title="회사 유형">
        {COMPANY_TYPES.map(ct => (
          <Chip
            key={ct}
            label={ct}
            active={filters.companyType.includes(ct)}
            onClick={() => set({ companyType: toggle(filters.companyType, ct) })}
          />
        ))}
      </FilterSection>

      {/* Reset */}
      {isActive && (
        <button
          onClick={() =>
            onChange({
              ...filters,
              industry: [],
              function: [],
              location: [],
              credential: [],
              companyType: [],
            })
          }
          className="w-full text-xs text-gray-500 hover:text-[#2563EB] py-2 border border-gray-200 rounded-lg transition-colors"
        >
          필터 초기화
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            필터 조건
            {isActive && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs bg-[#2563EB] text-white rounded-full">
                {filters.industry.length + filters.function.length + filters.location.length + filters.credential.length + filters.companyType.length}
              </span>
            )}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileOpen && (
          <div className="mt-2 bg-white border border-gray-200 rounded-xl p-4">
            {panel}
          </div>
        )}
      </div>

      {/* Desktop sticky sidebar */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-xl p-5 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">필터 조건</h2>
            {isActive && (
              <span className="text-xs text-[#2563EB] font-medium">
                {filters.industry.length + filters.function.length + filters.location.length + filters.credential.length + filters.companyType.length}개 적용됨
              </span>
            )}
          </div>
          {panel}
        </div>
      </div>
    </>
  )
}
