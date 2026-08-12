/**
 * AI 수집 공고 저장 로직 (중복 제거 + 자동 업로드).
 *
 * 두 스크래핑 백엔드가 공유한다:
 *   - scripts/scrape-jobs.ts       (Claude Agent SDK)
 *   - app/api/jobs/ai-scrape/route.ts (OpenRouter + DeepSeek)
 *
 * autoUpload=true 이면 job_imports(approved) + jobs 를 한 번에 만들고,
 * false 이면 기존처럼 job_imports(pending) 으로만 쌓는다.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { dedupeKey, normalizeJobInput } from './taxonomy'
import type { JobImportInput, NormalizedJob, SaveResult } from './types'

export interface SaveOptions {
  /** jobs 테이블까지 자동 등록할지 */
  autoUpload: boolean
  /** 자동 등록 시 즉시 공개할지 (기본 false — 관리자가 게시 버튼을 눌러야 노출) */
  autoPublish?: boolean
  /** 생성되는 jobs 레코드의 소유자. 없으면 null (관리자만 조회 가능) */
  ownerId?: string | null
  /** 이번 실행에서 이미 처리한 공고 키 — 같은 실행 안의 중복을 즉시 걸러낸다 */
  seen?: Set<string>
}

/** 이미 DB에 있는 공고인지 확인한다. */
async function findExisting(
  supabase: SupabaseClient,
  job: NormalizedJob,
): Promise<{ table: 'job_imports' | 'jobs'; id: string } | null> {
  if (job.apply_url) {
    const { data: imported } = await supabase
      .from('job_imports')
      .select('id')
      .eq('apply_url', job.apply_url)
      .limit(1)
      .maybeSingle()
    if (imported) return { table: 'job_imports', id: imported.id }

    const { data: existingJob } = await supabase
      .from('jobs')
      .select('id')
      .eq('apply_url', job.apply_url)
      .limit(1)
      .maybeSingle()
    if (existingJob) return { table: 'jobs', id: existingJob.id }
  }

  // apply_url 이 없거나 다르더라도 같은 회사의 같은 직책이면 중복으로 본다
  const { data: sameTitle } = await supabase
    .from('job_imports')
    .select('id')
    .eq('company', job.company)
    .eq('title', job.title)
    .limit(1)
    .maybeSingle()
  if (sameTitle) return { table: 'job_imports', id: sameTitle.id }

  return null
}

/**
 * 공고 하나를 저장한다. 예외를 던지지 않고 항상 SaveResult 를 돌려준다.
 */
export async function saveScrapedJob(
  supabase: SupabaseClient,
  raw: Partial<JobImportInput>,
  aiModel: string,
  options: SaveOptions,
): Promise<SaveResult> {
  const job = normalizeJobInput(raw, aiModel)
  if (!job) {
    return { status: 'invalid', message: '직책명 또는 회사명이 비어 있어 저장하지 않았습니다.' }
  }

  const key = dedupeKey(job)
  if (options.seen?.has(key)) {
    return { status: 'duplicate', message: `이번 실행에서 이미 수집한 공고입니다: ${job.title}` }
  }

  try {
    const existing = await findExisting(supabase, job)
    if (existing) {
      options.seen?.add(key)
      return {
        status: 'duplicate',
        message: `이미 등록된 공고입니다: ${job.title} @ ${job.company}`,
      }
    }

    // 1) 자동 업로드면 jobs 부터 만든다 (실패 시 job_imports 도 만들지 않음)
    let jobId: string | null = null
    if (options.autoUpload) {
      const { data: created, error: jobErr } = await supabase
        .from('jobs')
        .insert({
          title: job.title,
          company: job.company,
          location: job.location,
          main_specializations: job.main_specializations,
          detailed_specialties: job.detailed_specialties,
          experience_level: job.experience_level,
          employment_type: job.employment_type,
          salary_range: job.salary_range,
          description: job.description,
          apply_url: job.apply_url,
          owner_id: options.ownerId ?? null,
          is_published: options.autoPublish ?? false,
        })
        .select('id')
        .single()

      if (jobErr) {
        return { status: 'error', message: `jobs 저장 실패: ${jobErr.message}` }
      }
      jobId = created.id
    }

    // 2) job_imports 이력 기록
    const now = new Date().toISOString()
    const { data: importRow, error: importErr } = await supabase
      .from('job_imports')
      .insert({
        title: job.title,
        company: job.company,
        location: job.location,
        main_specializations: job.main_specializations,
        detailed_specialties: job.detailed_specialties,
        experience_level: job.experience_level,
        employment_type: job.employment_type,
        salary_range: job.salary_range,
        description: job.description,
        apply_url: job.apply_url,
        source_url: job.source_url,
        source_site: job.source_site,
        ai_notes: job.ai_notes,
        ai_model: job.ai_model,
        status: options.autoUpload ? 'approved' : 'pending',
        approved_at: options.autoUpload ? now : null,
        approved_by: options.autoUpload ? (options.ownerId ?? null) : null,
        job_id: jobId,
      })
      .select('id')
      .single()

    if (importErr) {
      // jobs 는 이미 생성됐는데 이력만 실패한 경우 — 고아 레코드를 남기지 않도록 되돌린다
      if (jobId) await supabase.from('jobs').delete().eq('id', jobId)
      return { status: 'error', message: `job_imports 저장 실패: ${importErr.message}` }
    }

    options.seen?.add(key)

    if (options.autoUpload) {
      return {
        status: 'uploaded',
        message: options.autoPublish
          ? `게시 완료: ${job.title} @ ${job.company}`
          : `등록 완료(비공개): ${job.title} @ ${job.company}`,
        importId: importRow.id,
        jobId: jobId ?? undefined,
      }
    }

    return {
      status: 'pending',
      message: `검토 대기로 저장: ${job.title} @ ${job.company}`,
      importId: importRow.id,
    }
  } catch (err) {
    return {
      status: 'error',
      message: `저장 중 오류: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/** 로그/이벤트 표시용 아이콘 */
export function saveStatusIcon(status: SaveResult['status']): string {
  switch (status) {
    case 'uploaded':  return '✅'
    case 'pending':   return '📋'
    case 'duplicate': return '⏭️'
    case 'invalid':   return '⚠️'
    case 'error':     return '❌'
  }
}
