'use client'

interface MultiSelectChipsProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function MultiSelectChips({
  options,
  selected,
  onChange,
}: MultiSelectChipsProps) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option}
          type="button"
          onClick={() => toggle(option)}
          className={`chip${selected.includes(option) ? ' chip-active' : ''}`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
