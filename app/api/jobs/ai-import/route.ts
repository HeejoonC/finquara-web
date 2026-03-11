/**
 * PATCH /api/jobs/ai-import
 *
 * Approve or reject a job import.
 * Approve: creates a new job in the `jobs` table (is_published=false),
 *          updates job_import status to 'approved'.
 * Reject:  updates job_import status to 'rejected'.
 *
 * Auth: admin only
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { JobImport } from '@/lib/ai-import/types'

interface PatchBody {
  id: string
  action: 'approve' | 'reject'
  // Fields that admin may have edited before approving:
  edits?: Partial<Pick<JobImport,
    | 'title' | 'company' | 'location'
    | 'main_specializations' | 'detailed_specialties'
    | 'experience_level' | 'employment_type'
    | 'salary_range' | 'description' | 'apply_url'
  >>
}

export async function PATCH(request: Request) {
  // ── Auth ───────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Parse body ─────────────────────────────────────────────────────────
  let body: PatchBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { id, action, edits } = body
  if (!id || !action) {
    return NextResponse.json({ error: 'id and action are required' }, { status: 400 })
  }

  // ── Fetch the import ───────────────────────────────────────────────────
  const { data: importRecord, error: fetchErr } = await supabase
    .from('job_imports')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !importRecord) {
    return NextResponse.json({ error: 'Import not found' }, { status: 404 })
  }

  if (importRecord.status !== 'pending') {
    return NextResponse.json(
      { error: `Import already ${importRecord.status}` },
      { status: 409 },
    )
  }

  // ── Reject ─────────────────────────────────────────────────────────────
  if (action === 'reject') {
    const { error } = await supabase
      .from('job_imports')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, action: 'rejected' })
  }

  // ── Approve ────────────────────────────────────────────────────────────
  // Merge edits (if admin modified fields)
  const merged = { ...importRecord, ...(edits ?? {}) }

  const { data: newJob, error: jobErr } = await supabase
    .from('jobs')
    .insert({
      title:                merged.title,
      company:              merged.company,
      location:             merged.location,
      main_specializations: merged.main_specializations ?? [],
      detailed_specialties: merged.detailed_specialties ?? [],
      experience_level:     merged.experience_level,
      employment_type:      merged.employment_type,
      salary_range:         merged.salary_range,
      description:          merged.description,
      apply_url:            merged.apply_url,
      owner_id:             user.id,          // admin is the owner
      is_published:         false,            // admin must explicitly publish
    })
    .select('id')
    .single()

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 })
  }

  // Update job_import record
  const { error: updateErr } = await supabase
    .from('job_imports')
    .update({
      status:      'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      job_id:      newJob.id,
    })
    .eq('id', id)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, action: 'approved', job_id: newJob.id })
}

// ── GET /api/jobs/ai-import — list pending imports ─────────────────────────

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'pending'
  const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

  const { data, error } = await supabase
    .from('job_imports')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── DELETE /api/jobs/ai-import?id=... — hard delete ──────────────────────

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('job_imports').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
