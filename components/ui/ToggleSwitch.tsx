'use client'

interface ToggleSwitchProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export default function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-start justify-between gap-8 border-b border-line py-5">
      <div>
        <p className="h4 text-[1rem]">{label}</p>
        {description && <p className="body-sm mt-1.5 text-[0.85rem]">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 inline-flex h-5 w-10 shrink-0 border transition-colors duration-200 ${
          checked ? 'border-ink bg-ink' : 'border-line-strong bg-transparent'
        }`}
      >
        <span
          className={`pointer-events-none absolute top-[2px] h-[14px] w-[14px] transform transition-transform duration-200 ${
            checked ? 'translate-x-[22px] bg-bg' : 'translate-x-[2px] bg-ink'
          }`}
        />
      </button>
    </div>
  )
}
