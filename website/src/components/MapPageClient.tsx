'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import MapView from '@/components/MapView'
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
  viewerIsLoggedIn: boolean
}

export default function MapPageClient({
  username,
  mapId,
  initialRegions,
  initialColors,
  initialIsPublic,
  isOwner,
  viewerIsLoggedIn,
}: Props) {
  const supabase = createClient()

  const handleSave = useCallback((regions: Record<string, string>, colors: Colors) => {
    supabase.from('maps').update({ regions, colors }).eq('id', mapId).then()
  }, [mapId, supabase])

  return (
    <main className="flex-1 p-6" style={{ background: '#0a0a0a' }}>
      <div className="relative mb-6 text-center">
        <h2 className="text-3xl font-semibold text-white mb-1">World Map Tracker</h2>
        <p className="text-sm text-white/40 uppercase tracking-wide">{username}&apos;s travel tracker</p>
        {isOwner && (
          <Link
            href={`/settings?public=${initialIsPublic ? '1' : '0'}`}
            className="absolute right-0 top-0 text-white/30 hover:text-white/70 transition-colors"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        )}
      </div>

      <MapView
        initialRegions={initialRegions}
        initialColors={initialColors}
        editable={isOwner}
        onSave={isOwner ? handleSave : undefined}
      />

      {!isOwner && !viewerIsLoggedIn && (
        <p className="mt-6 text-center text-xs text-white/30">
          Want to create your own map?{' '}
          <Link href="/" className="text-white/50 hover:text-white/80 underline underline-offset-2 transition-colors">
            Click here
          </Link>
        </p>
      )}
    </main>
  )
}
