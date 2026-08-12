/**
 * AI 채용공고 수집 설정 검증.
 *
 *   npx tsx scripts/verify-setup.ts
 *
 * 확인 항목:
 *   1) .env / .env.local 환경변수 형태 (비밀값은 출력하지 않음)
 *   2) Supabase URL + anon/service_role 키 유효성
 *   3) job_imports / jobs / profiles 테이블 접근
 *   4) v6 중복 방지 유니크 인덱스 적용 여부 (테스트 행 삽입 후 즉시 삭제)
 *   5) OpenRouter 키 유효성
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'

for (const file of ['.env.local', '.env']) {
  try {
    const content = readFileSync(resolve(process.cwd(), file), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
      if (!m) continue
      if (process.env[m[1]] !== undefined) continue
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // 파일이 없으면 무시
  }
}

const TEST_URL = 'https://finquara-setup-check.invalid/verify-only'

let failures = 0
const fail = (msg: string) => { console.log(`❌ ${msg}`); failures++ }
const ok = (msg: string) => console.log(`✅ ${msg}`)
const warn = (msg: string) => console.log(`⚠️  ${msg}`)

/** 키의 형태만 설명한다. 값 자체는 절대 출력하지 않는다. */
function describeKey(name: string): string {
  const v = process.env[name]
  if (!v) return `${name}: (없음)`

  if (v.includes('...')) return `${name}: ⚠️ .env.example 의 자리표시자 그대로입니다 (${v.length}자)`
  if (v.startsWith('sb_secret_')) return `${name}: new secret key, ${v.length}자`
  if (v.startsWith('sb_publishable_')) return `${name}: new publishable key, ${v.length}자`

  const parts = v.split('.')
  if (v.startsWith('eyJ') && parts.length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'))
      const exp = payload.exp ? new Date(payload.exp * 1000) : null
      const expired = exp && exp < new Date() ? ' ⚠️만료됨' : ''
      return `${name}: legacy JWT, role=${payload.role}, ref=${payload.ref}` +
        (exp ? `, exp=${exp.toISOString().slice(0, 10)}${expired}` : '')
    } catch {
      return `${name}: JWT 형태이나 payload 해석 실패 (${v.length}자)`
    }
  }
  return `${name}: 알 수 없는 형식 (${v.length}자)`
}

async function probeRest(url: string, key: string): Promise<{ ok: boolean; detail: string }> {
  if (!key) return { ok: false, detail: '키 없음' }
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/rest/v1/job_imports?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    return { ok: res.ok, detail: `HTTP ${res.status} ${res.ok ? '' : (await res.text()).slice(0, 160)}` }
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) }
  }
}

async function main() {
  console.log('── 1. 환경변수 ──')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  console.log(`NEXT_PUBLIC_SUPABASE_URL: ${url || '(없음)'}`)
  console.log(describeKey('NEXT_PUBLIC_SUPABASE_ANON_KEY'))
  console.log(describeKey('SUPABASE_SERVICE_ROLE_KEY'))

  if (!url) {
    fail('NEXT_PUBLIC_SUPABASE_URL 이 없습니다.')
    return
  }

  console.log('\n── 2. Supabase 키 검증 ──')
  const anon = await probeRest(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')
  const service = await probeRest(url, process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')
  if (anon.ok) ok(`anon key 정상 (${anon.detail})`)
  else fail(`anon key 실패 — ${anon.detail}`)

  if (!service.ok) {
    fail(`service_role key 실패 — ${service.detail}`)
    if (anon.ok) {
      warn('URL 은 정상이므로 service_role 키만 다시 복사하면 됩니다.')
      warn('Supabase Dashboard → Project Settings → API Keys → service_role (또는 sb_secret_...)')
    }
    return
  }
  ok('service_role key 정상')

  const db = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\n── 3. 테이블 접근 ──')
  for (const table of ['job_imports', 'jobs', 'profiles']) {
    const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
    if (error) fail(`${table}: ${error.message}`)
    else ok(`${table}: ${count}행`)
  }

  console.log('\n── 4. 중복 방지 인덱스 (v6 마이그레이션) ──')
  const row = { title: '__setup_check__', company: '__setup_check__', apply_url: TEST_URL, status: 'pending' }
  const first = await db.from('job_imports').insert(row).select('id').single()
  if (first.error) {
    fail(`테스트 행 삽입 실패: ${first.error.message}`)
  } else {
    const second = await db.from('job_imports').insert(row).select('id').single()
    if (second.error) {
      ok('apply_url 유니크 인덱스 동작 확인')
    } else {
      fail('중복 apply_url 이 두 번 삽입됨 → supabase/migrations/v6_job_imports_dedup.sql 을 실행하세요.')
    }
    const { error: cleanupErr } = await db.from('job_imports').delete().eq('apply_url', TEST_URL)
    if (cleanupErr) fail(`테스트 행 정리 실패: ${cleanupErr.message}`)
    else ok('테스트 행 정리 완료')
  }

  console.log('\n── 5. OpenRouter (웹 관리자 페이지용) ──')
  const orKey = process.env.OPENROUTER_API_KEY
  if (!orKey || orKey.includes('...')) {
    warn('OPENROUTER_API_KEY 미설정 — /admin/ai-import 페이지는 동작하지 않습니다. (npm run scrape 는 무관)')
  } else {
    const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v3.2'
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: 'user', content: 'ping' }] }),
    })
    if (res.ok) ok(`OpenRouter 인증 정상 (모델: ${model})`)
    else fail(`OpenRouter 응답 ${res.status}: ${(await res.text()).slice(0, 160)}`)
  }
}

main()
  .then(() => {
    console.log(failures === 0 ? '\n🎉 모든 검증 통과 — npm run scrape 실행 준비 완료' : `\n${failures}건 실패`)
    process.exit(failures === 0 ? 0 : 1)
  })
  .catch((err) => {
    console.error('검증 중 오류:', err)
    process.exit(1)
  })
