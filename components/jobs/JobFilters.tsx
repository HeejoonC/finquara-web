'use client'

import React, { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'

interface Filters {
  q?: string
  main?: string   // comma-separated
  detail?: string // comma-separated
  exp?: string    // comma-separated
  type?: string   // comma-separated
}

const DETAIL_PREVIEW_COUNT = 5

export default function JobFilters({
  current,
  mainOptions = [...MAIN_SPECIALIZATIONS],
  detailOptions = [...DETAILED_SPECIALTIES],
}: {
  current: Filters
  mainOptions?: string[]
  detailOptions?: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [keyword, setKeyword] = useState(current.q ?? '')
  const [detailExpanded, setDetailExpanded] = useState(false)

  const selectedMain = current.main ? current.main.split(',').filter(Boolean) : []
  const selectedDetail = current.detail ? current.detail.split(',').filter(Boolean) : []
  const selectedExp = current.exp ? current.exp.split(',').filter(Boolean) : []
  const selectedType = current.type ? current.type.split(',').filter(Boolean) : []

  function navigate(overrides: Record<string, string | null>) {
    const merged: Record<string, string> = {}
    ;(Object.entries({ ...current, ...overrides }) as [string, string | null][]).forEach(
      ([k, v]) => {
        if (v) merged[k] = v
      }
    )
    const qs = new URLSearchParams(merged).toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  function toggleValue(key: string, selected: string[], value: string) {
    const next = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    navigate({ [key]: next.length ? next.join(',') : null })
  }

  const hasFilters = !!(current.q || current.main || current.detail || current.exp || current.type)

  return (
    <div className="mb-12 mt-10">
      {/* Keyword search */}
      <form
        onSubmit={e => {
          e.preventDefault()
          navigate({ q: keyword.trim() || null })
        }}
        className="flex items-end gap-6"
      >
        <div className="flex-1">
          <label htmlFor="job-q" className="form-label">
            Search
          </label>
          <input
            id="job-q"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="직무명, 회사명"
            className="field"
          />
        </div>
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      {/* Inline chip filters */}
      <div className="mt-10 space-y-6 border-t border-line pt-8">
        <FilterRow
          label="Sector"
          options={mainOptions}
          selected={selectedMain}
          onToggle={v => toggleValue('main', selectedMain, v)}
        />
        <FilterRow
          label="Specialty"
          options={detailExpanded ? detailOptions : detailOptions.slice(0, DETAIL_PREVIEW_COUNT)}
          selected={selectedDetail}
          onToggle={v => toggleValue('detail', selectedDetail, v)}
          expandButton={
            detailOptions.length > DETAIL_PREVIEW_COUNT ? (
              <button
                type="button"
                onClick={() => setDetailExpanded(v => !v)}
                className="chip"
              >
                {detailExpanded ? '접기' : `+${detailOptions.length - DETAIL_PREVIEW_COUNT} more`}
              </button>
            ) : undefined
          }
        />
        <FilterRow
          label="Experience"
          options={[...EXPERIENCE_LEVELS]}
          selected={selectedExp}
          onToggle={v => toggleValue('exp', selectedExp, v)}
        />
        <FilterRow
          label="Type"
          options={[...EMPLOYMENT_TYPES]}
          selected={selectedType}
          onToggle={v => toggleValue('type', selectedType, v)}
        />
        {hasFilters && (
          <div className="border-t border-line pt-6">
            <button
              type="button"
              onClick={() => {
                setKeyword('')
                startTransition(() => router.push(pathname))
              }}
              className="btn-text"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterRow({
  label,
  options,
  selected,
  onToggle,
  expandButton,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
  expandButton?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-x-6 gap-y-3 fold-520">
      <span className="label-sm pt-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(o => {
          const active = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={`chip${active ? ' chip-active' : ''}`}
            >
              {o}
            </button>
          )
        })}
        {expandButton}
      </div>
    </div>
  )
}
