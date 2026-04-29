'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import MapView from '@/components/MapView'
import PrivacyToggle from '@/components/PrivacyToggle'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_COLORS } from '@/lib/map-utils'

type Colors = typeof DEFAULT_COLORS

interface Props {
  username: string
  mapId: string
  initialRegions: Record<string, string>
  initialColors: Colors
  initialIsPublic: boolean
  isOwner: boolean
}

export default function MapPageClient({
  username,
  mapId,
  initialRegions,
  initialColors,
  initialIsPublic,
  isOwner,
}: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const supabase = createClient()

  const handleSave = useCallback((regions: Record<string, string>, colors: Colors) => {
    supabase.from('maps').update({ regions, colors }).eq('id', mapId).then()
  }, [mapId, supabase])

  function handlePrivacyToggle(next: boolean) {
    setIsPublic(next)
    supabase.from('maps').update({ is_public: next }).eq('id', mapId).then()
  }

  return (
    <main className="min-h-screen p-6" style={{ background: '#0a0a0a' }}>
      <div className="relative mb-6 text-center">
        <h2 className="text-3xl font-semibold text-white mb-1">World Map Tracker</h2>
        <p className="text-sm text-white/40 uppercase tracking-wide">{username}&apos;s travel tracker</p>
        {isOwner && (
          <div className="absolute right-0 top-0 flex items-center gap-3">
            <PrivacyToggle
              isPublic={isPublic}
              mapId={mapId}
              onToggle={handlePrivacyToggle}
            />
            <Link
              href="/settings"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Settings
            </Link>
          </div>
        )}
      </div>

      <MapView
        initialRegions={initialRegions}
        initialColors={initialColors}
        editable={isOwner}
        onSave={isOwner ? handleSave : undefined}
      />
    </main>
  )
}
