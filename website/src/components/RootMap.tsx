'use client'

import { useCallback } from 'react'
import MapView from '@/components/MapView'
import { DEFAULT_COLORS } from '@/lib/map-utils'

type Colors = typeof DEFAULT_COLORS

export const DRAFT_KEY = 'wmt-draft'

export default function RootMap() {
  const handleSave = useCallback((regions: Record<string, string>, colors: Colors) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ regions, colors }))
  }, [])

  return (
    <MapView
      initialRegions={{}}
      initialColors={{ ...DEFAULT_COLORS }}
      editable={true}
      onSave={handleSave}
    />
  )
}
