import SalarySurveyClient from './SalarySurveyClient'

export const metadata = {
  title: 'Salary Survey | Finquara',
  description: 'Benchmark actuarial compensation by experience, specialty, and profile.',
}

export default function SalarySurveyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#2563EB]">
                  Finquara
                </span>
                <span className="text-xs text-gray-300">/</span>
                <span className="text-xs text-gray-400 uppercase tracking-widest">
                  Data
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">
                Salary Survey
              </h1>
              <p className="text-sm text-gray-500 mt-1 max-w-xl">
                Benchmark actuarial compensation by experience, specialty, and profile.
                Explore trends across industries, credentials, and company types.
              </p>
            </div>

            {/* Survey year badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-medium text-blue-700">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                2025 · 2026 Survey
              </span>
            </div>
          </div>

          {/* Disclaimer banner */}
          <div className="mt-5 flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-100 rounded-lg">
            <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-amber-700">
              Salary figures are <strong>directional estimates</strong> based on survey-style aggregated data.
              Individual compensation varies significantly by company, negotiation, and performance.
              Data should not be used for formal benchmarking without additional validation.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SalarySurveyClient />
      </div>
    </div>
  )
}
