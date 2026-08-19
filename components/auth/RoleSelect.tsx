'use client'

const ROLE_OPTIONS = [
  { value: 'job_seeker', label: '구직자', desc: '채용공고 검색 및 지원' },
  { value: 'employer', label: '기업 담당자', desc: '채용공고 등록 및 관리' },
] as const

export type SignupRole = (typeof ROLE_OPTIONS)[number]['value']

export default function RoleSelect({
  value,
  onChange,
}: {
  value: SignupRole
  onChange: (v: SignupRole) => void
}) {
  return (
    <div>
      <span className="form-label">가입 유형</span>
      <div className="grid grid-cols-2 border-l border-t border-line-strong fold-520">
        {ROLE_OPTIONS.map(opt => {
          const active = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`border-b border-r border-line-strong p-5 text-left transition-colors ${
                active ? 'ink-block' : 'hover:bg-bg-strong'
              }`}
            >
              <span className="h4 block">{opt.label}</span>
              <span className="body-sm mt-2 block text-[0.82rem]">{opt.desc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
