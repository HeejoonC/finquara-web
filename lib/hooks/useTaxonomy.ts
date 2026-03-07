'use client'

import { useState, useEffect } from 'react'
import { MAIN_SPECIALIZATIONS, DETAILED_SPECIALTIES } from '@/lib/constants/actuary'

interface Taxonomy {
  main: string[]
  detail: string[]
}

const fallback: Taxonomy = {
  main: [...MAIN_SPECIALIZATIONS],
  detail: [...DETAILED_SPECIALTIES],
}

export function useTaxonomy(): Taxonomy {
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(fallback)

  useEffect(() => {
    fetch('/api/taxonomy')
      .then(r => r.json())
      .then((data: Taxonomy) => {
        if (data.main?.length) setTaxonomy(data)
      })
      .catch(() => {/* use fallback */})
  }, [])

  return taxonomy
}
