'use client'

import { useState, useEffect } from 'react'

const EXP_TYPES = ['신입', '경력', '경력무관'] as const
type ExpType = (typeof EXP_TYPES)[number]

function parseValue(value: string): { type: ExpType; from: string; to: string } {
  if (!value || value === '신입') return { type: '신입', from: '', to: '' }
  if (value === '경력무관') return { type: '경력무관', from: '', to: '' }
  // "경력 3~10년" format
  const m = value.match(/^경력\s*(\d*)\s*~\s*(\d*)년?$/)
  if (m) return { type: '경력', from: m[1] ?? '', to: m[2] ?? '' }
  // Any other value — treat as 경력 with no range
  return { type: '경력', from: '', to: '' }
}

function buildValue(type: ExpType, from: string, to: string): string {
  if (type !== '경력') return type
  if (from || to) return `경력 ${from || '0'}~${to || ''}년`
  return '경력'
}

export default function ExperienceField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const init = parseValue(value)
  const [type, setType] = useState<ExpType>(init.type)
  const [from, setFrom] = useState(init.from)
  const [to, setTo] = useState(init.to)

  // Sync when parent loads async data (e.g. edit page)
  useEffect(() => {
    if (value) {
      const p = parseValue(value)
      setType(p.type)
      setFrom(p.from)
      setTo(p.to)
    }
  }, [value])

  function handleType(t: ExpType) {
    setType(t)
    onChange(buildValue(t, from, to))
  }
  function handleFrom(v: string) {
    setFrom(v)
    onChange(buildValue(type, v, to))
  }
  function handleTo(v: string) {
    setTo(v)
    onChange(buildValue(type, from, v))
  }

  return (
    <div>
      <span className="form-label">경력 요건</span>
      <div className="flex flex-wrap gap-2">
        {EXP_TYPES.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => handleType(t)}
            className={`chip${type === t ? ' chip-active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>
      {type === '경력' && (
        <div className="mt-5 flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={from}
            onChange={e => handleFrom(e.target.value)}
            placeholder="0"
            className="field-box w-24 text-center"
          />
          <span className="label-sm">~</span>
          <input
            type="number"
            min={0}
            value={to}
            onChange={e => handleTo(e.target.value)}
            placeholder="10"
            className="field-box w-24 text-center"
          />
          <span className="label-sm">years</span>
        </div>
      )}
    </div>
  )
}
