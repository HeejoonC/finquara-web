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
    <button type="button" onClick={onClick} className={`chip${active ? ' chip-active' : ''}`}>
      {label}
    </button>
  )
}

// ── FilterSection ─────────────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="label-sm">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
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
    <div className="flex border border-line-strong">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 py-2.5 text-[0.66rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
            i > 0 ? 'border-l border-line-strong' : ''
          } ${value === opt.value ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
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

  const activeCount =
    filters.industry.length +
    filters.function.length +
    filters.location.length +
    filters.credential.length +
    filters.companyType.length

  const isActive = activeCount > 0

  const displayedFunctions = fnExpanded
    ? DETAILED_SPECIALTIES
    : DETAILED_SPECIALTIES.slice(0, 8)

  const panel = (
    <div className="space-y-8">
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

      <hr className="rule" />

      {/* Compensation metric */}
      <div>
        <p className="label-sm mb-3">보상 기준</p>
        <ToggleRow
          options={[
            { label: 'Base', value: 'baseSalary' },
            { label: 'Total', value: 'totalComp' },
          ]}
          value={filters.compensation}
          onChange={v => set({ compensation: v as 'baseSalary' | 'totalComp' })}
        />
      </div>

      <div>
        <p className="label-sm mb-3">표시 방식</p>
        <ToggleRow
          options={[
            { label: 'Median', value: 'median' },
            { label: 'Average', value: 'average' },
          ]}
          value={filters.metric}
          onChange={v => set({ metric: v as 'median' | 'average' })}
        />
        <label className="mt-4 flex cursor-pointer select-none items-center gap-2.5">
          <input
            type="checkbox"
            checked={filters.showP25P75}
            onChange={e => set({ showP25P75: e.target.checked })}
            className="h-3.5 w-3.5 accent-ink"
          />
          <span className="label-sm normal-case tracking-[0.08em]">P25 / P75 밴드 표시</span>
        </label>
      </div>

      <hr className="rule" />

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
        <button type="button" onClick={() => setFnExpanded(!fnExpanded)} className="chip">
          {fnExpanded ? '접기' : `+${DETAILED_SPECIALTIES.length - 8} more`}
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
          type="button"
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
          className="btn btn-ghost btn-sm w-full"
        >
          Reset filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between border-y border-line-strong py-4"
        >
          <span className="label-sm">Filters{isActive && ` · ${activeCount}`}</span>
          <span className="label-sm">{mobileOpen ? '−' : '+'}</span>
        </button>
        {mobileOpen && <div className="py-8">{panel}</div>}
      </div>

      {/* Desktop sticky sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-[92px] max-h-[calc(100vh-8rem)] overflow-y-auto border-t border-line-strong pr-2 pt-6">
          <div className="mb-8 flex items-baseline justify-between gap-4">
            <h2 className="label-sm">Filters</h2>
            {isActive && <span className="num">{activeCount}</span>}
          </div>
          {panel}
        </div>
      </div>
    </>
  )
}
