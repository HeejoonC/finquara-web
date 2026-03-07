'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function deleteJob(jobId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify ownership before deleting
  const { data: job } = await supabase
    .from('jobs')
    .select('owner_id')
    .eq('id', jobId)
    .single()

  if (!job || job.owner_id !== user.id) throw new Error('Forbidden')

  await supabase.from('jobs').delete().eq('id', jobId)

  redirect('/jobs')
}
