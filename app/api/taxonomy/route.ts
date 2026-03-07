import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('taxonomy_items')
      .select('type, label')
      .order('sort_order')

    if (error || !data?.length) {
      return NextResponse.json({
        main: [...MAIN_SPECIALIZATIONS],
        detail: [...DETAILED_SPECIALTIES],
      })
    }

    return NextResponse.json({
      main: data.filter(d => d.type === 'main').map(d => d.label),
      detail: data.filter(d => d.type === 'detail').map(d => d.label),
    })
  } catch {
    return NextResponse.json({
      main: [...MAIN_SPECIALIZATIONS],
      detail: [...DETAILED_SPECIALTIES],
    })
  }
}
