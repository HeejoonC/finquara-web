'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  MAIN_SPECIALIZATIONS,
  DETAILED_SPECIALTIES,
  EXPERIENCE_LEVELS,
  EMPLOYMENT_TYPES,
} from '@/lib/constants/actuary'

interface Filters {
  q?: string
  main?: string
  detail?: string
  exp?: string
  type?: string
}

export default function JobFilters({ current }: { current: Filters }) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [keyword, setKeyword] = useState(current.q ?? '')

  function navigate(overrides: Record<string, string | null>) {
    const merged: Record<string, string> = {}
    // Carry all current params then apply overrides
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

  const hasFilters = !!(current.q || current.main || current.detail || current.exp || current.type)

  return (
    <div className="space-y-3 mb-6">
      {/* Keyword search */}
      <form
        onSubmit={e => {
          e.preventDefault()
          navigate({ q: keyword.trim() || null })
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="직무명, 회사명으로 검색"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-[#2563EB] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          검색
        </button>
      </form>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSelect
          label="분야"
          value={current.main ?? ''}
          options={[...MAIN_SPECIALIZATIONS]}
          onChange={v => navigate({ main: v || null })}
        />
        <FilterSelect
          label="세부 전문"
          value={current.detail ?? ''}
          options={[...DETAILED_SPECIALTIES]}
          onChange={v => navigate({ detail: v || null })}
        />
        <FilterSelect
          label="경력"
          value={current.exp ?? ''}
          options={[...EXPERIENCE_LEVELS]}
          onChange={v => navigate({ exp: v || null })}
        />
        <FilterSelect
          label="고용형태"
          value={current.type ?? ''}
          options={[...EMPLOYMENT_TYPES]}
          onChange={v => navigate({ type: v || null })}
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setKeyword('')
              startTransition(() => router.push(pathname))
            }}
            className="px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            초기화
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {current.q && (
            <ActiveChip
              label={`"${current.q}"`}
              onRemove={() => {
                setKeyword('')
                navigate({ q: null })
              }}
            />
          )}
          {current.main && (
            <ActiveChip label={current.main} onRemove={() => navigate({ main: null })} />
          )}
          {current.detail && (
            <ActiveChip label={current.detail} onRemove={() => navigate({ detail: null })} />
          )}
          {current.exp && (
            <ActiveChip label={current.exp} onRemove={() => navigate({ exp: null })} />
          )}
          {current.type && (
            <ActiveChip label={current.type} onRemove={() => navigate({ type: null })} />
          )}
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-white transition-colors cursor-pointer ${
        value
          ? 'border-[#2563EB] text-[#2563EB] bg-blue-50'
          : 'border-gray-200 text-gray-600 hover:border-gray-300'
      }`}
    >
      <option value="">{label}</option>
      {options.map(o => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-[#2563EB] text-xs rounded-full border border-blue-100">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label="필터 제거"
        className="ml-0.5 hover:text-blue-800 transition-colors leading-none"
      >
        ×
      </button>
    </span>
  )
}
