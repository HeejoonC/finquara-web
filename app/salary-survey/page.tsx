import SalarySurveyClient from './SalarySurveyClient'

export const metadata = {
  title: 'Salary Survey | Finquara',
  description: 'Benchmark actuarial compensation by experience, specialty, and profile.',
}

export default function SalarySurveyPage() {
  return (
    <main className="section-tight">
      <div className="container">
        {/* ── Page Header ────────────────────────────────────────── */}
        <header className="grid grid-cols-[1.4fr_1fr] items-end gap-x-16 gap-y-10 border-b border-line-strong pb-12 fold-980">
          <div>
            <p className="label-sm">03 / Data</p>
            <h1 className="h2 mt-6">
              Salary
              <br />
              Survey.
            </h1>
            <p className="body mt-8 max-w-[52ch]">
              경력, 세부 전문분야, 회사 유형별 계리 직군 보상 분포입니다. 체감이 아니라
              분포로 확인하세요.
            </p>
          </div>

          <div className="border-t border-line-strong">
            <MetaRow label="Survey" value="2025 · 2026" />
            <MetaRow label="Basis" value="Base + Bonus" />
            <MetaRow label="Scope" value="Korea" />
          </div>
        </header>

        {/* Disclaimer */}
        <div className="notice-quiet mt-10">
          수치는 설문 기반 집계에 따른 <strong className="font-semibold text-ink">방향성 추정치</strong>입니다.
          개인 보상은 회사, 협상, 성과에 따라 크게 달라지며, 추가 검증 없이 공식 벤치마킹
          용도로 사용하지 마세요.
        </div>

        {/* ── Main Content ───────────────────────────────────────── */}
        <div className="mt-14">
          <SalarySurveyClient />
        </div>
      </div>
    </main>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-4">
      <span className="label-sm">{label}</span>
      <span className="text-[1rem] font-semibold tracking-[-0.02em] text-ink">{value}</span>
    </div>
  )
}
