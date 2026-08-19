import Link from 'next/link'

/**
 * 인증 페이지 공통 셸.
 * 가운데 정렬 카드 대신 좌: 선언문 / 우: 폼 의 비대칭 2단 구성.
 */
export default function AuthShell({
  index,
  heading,
  statement,
  children,
}: {
  index: string
  heading: React.ReactNode
  statement: string
  children: React.ReactNode
}) {
  return (
    <main className="section">
      <div className="container">
        <div className="grid grid-cols-[1fr_1.1fr] gap-x-20 gap-y-16 fold-980">
          {/* 좌 — 선언 */}
          <div>
            <p className="label-sm">{index}</p>
            <h1 className="h2 mt-6">{heading}</h1>
            <p className="body mt-8 max-w-[38ch]">{statement}</p>
            <p className="label-sm mt-14">
              <Link href="/" className="link">
                ← Finquara
              </Link>
            </p>
          </div>

          {/* 우 — 폼 */}
          <div className="border-t border-line-strong pt-10">{children}</div>
        </div>
      </div>
    </main>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null
  return <div className="notice mb-8">{message}</div>
}

export function AuthFooterLink({
  prefix,
  href,
  label,
}: {
  prefix: string
  href: string
  label: string
}) {
  return (
    <p className="body-sm mt-10">
      {prefix}{' '}
      <Link href={href} className="link font-medium text-ink">
        {label}
      </Link>
    </p>
  )
}
