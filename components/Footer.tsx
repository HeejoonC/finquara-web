import Link from 'next/link'

const YEAR = 2026

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="grid grid-cols-[1.6fr_1fr] gap-x-12 gap-y-16 py-24 fold-980">
          {/* 좌 — 큰 브랜드 문구 */}
          <div>
            <p
              className="font-extrabold text-[clamp(2.4rem,5vw,5.4rem)] leading-[0.95] tracking-[-0.07em]"
              style={{ color: '#f6f4f0' }}
            >
              Built for the
              <br />
              actuarial career.
            </p>
            <p
              className="mt-8 max-w-[46ch] text-[1.02rem] leading-[1.65]"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              보험사 · 재보험사 · 회계법인 · 컨설팅. 계리 직군 하나만 다룹니다.
            </p>
          </div>

          {/* 우 — 메타정보 */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-12 fold-520">
            <FooterCol
              title="Index"
              items={[
                { label: '채용공고', href: '/jobs' },
                { label: 'Salary Survey', href: '/salary-survey' },
                { label: '공고 등록', href: '/post' },
              ]}
            />
            <FooterCol
              title="Account"
              items={[
                { label: '로그인', href: '/auth/login' },
                { label: '회원가입', href: '/auth/signup' },
                { label: '프로필', href: '/profile' },
              ]}
            />
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-4 border-t py-8"
          style={{ borderColor: 'rgba(255,255,255,0.14)' }}
        >
          <span
            className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            © {YEAR} Finquara
          </span>
          <span
            className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
            style={{ color: 'rgba(255,255,255,0.45)' }}
          >
            Seoul, Republic of Korea
          </span>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  items,
}: {
  title: string
  items: { label: string; href: string }[]
}) {
  return (
    <div>
      <p
        className="text-[0.68rem] font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        {title}
      </p>
      <ul className="mt-5 space-y-3">
        {items.map(i => (
          <li key={i.href}>
            <Link href={i.href} className="link row text-[0.96rem]">
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
