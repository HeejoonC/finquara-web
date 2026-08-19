'use client'

/**
 * 폼 공통 프리미티브.
 * 섹션은 카드가 아니라 좌: 번호+제목 / 우: 필드 의 에디토리얼 2단으로 놓는다.
 */

export function FormSection({
  step,
  title,
  note,
  children,
}: {
  step: string
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section className="grid grid-cols-[1fr_2.2fr] items-start gap-x-16 gap-y-8 border-t border-line-strong py-12 fold-980">
      <div className="md:sticky md:top-[96px]">
        <p className="num">{step.padStart(2, '0')}</p>
        <h2 className="h4 mt-3">{title}</h2>
        {note && <p className="body-sm mt-3 max-w-[30ch] text-[0.85rem]">{note}</p>}
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  type?: string
}) {
  const id = `f-${label.replace(/\s+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
        {required && ' *'}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="field"
      />
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  const id = `f-${label.replace(/\s+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="field"
      />
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  const id = `f-${label.replace(/\s+/g, '-')}`
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)} className="field">
        <option value="">선택</option>
        {options.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}

export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="form-label">{label}</span>
      <p className="border-b border-line py-[0.85rem] text-[1rem] text-muted">{value}</p>
    </div>
  )
}

export function ChipGroup({
  label,
  note,
  options,
  selected,
  onToggle,
}: {
  label: string
  note?: string
  options: readonly string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div>
      <span className="form-label">
        {label}
        {note && <span className="normal-case tracking-[0.08em] opacity-70"> — {note}</span>}
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`chip${selected.includes(o) ? ' chip-active' : ''}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string
  name: string
  options: readonly string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <span className="form-label">{label}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map(o => (
          <button
            key={o}
            type="button"
            name={name}
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={`chip${value === o ? ' chip-active' : ''}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

/** 페이지 상단 공통 헤더 (좌: 번호/제목, 우: 보조 정보) */
export function PageHeader({
  index,
  title,
  description,
  aside,
}: {
  index: string
  title: React.ReactNode
  description?: string
  aside?: React.ReactNode
}) {
  return (
    <header className="grid grid-cols-[1.4fr_1fr] items-end gap-x-16 gap-y-8 border-b border-line-strong pb-12 fold-980">
      <div>
        <p className="label-sm">{index}</p>
        <h1 className="h2 mt-6">{title}</h1>
        {description && <p className="body mt-6 max-w-[48ch]">{description}</p>}
      </div>
      {aside && <div>{aside}</div>}
    </header>
  )
}
