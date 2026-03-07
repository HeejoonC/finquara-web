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
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            selected.includes(option)
              ? 'bg-[#2563EB] text-white border-[#2563EB]'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
