import Link from 'next/link'
import MapPageClient from '@/components/MapPageClient'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_COLORS } from '@/lib/map-utils'
import type { RegionStatus } from '@/lib/map-utils'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserMapPage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single()

  if (!profile) {
    return <PrivateOrMissing />
  }

  const isOwner = user?.id === profile.id

  const { data: map } = await supabase
    .from('maps')
    .select('id, regions, colors, is_public')
    .eq('user_id', profile.id)
    .single()

  if (!map || (!map.is_public && !isOwner)) {
    return <PrivateOrMissing />
  }

  const regions = (map.regions ?? {}) as Record<string, RegionStatus>
  const colors = { ...DEFAULT_COLORS, ...(map.colors ?? {}) }

  return (
    <MapPageClient
      username={username}
      mapId={map.id}
      initialRegions={regions}
      initialColors={colors}
      initialIsPublic={map.is_public ?? false}
      isOwner={isOwner}
      viewerIsLoggedIn={!!user}
    />
  )
}

function PrivateOrMissing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0a0a0a' }}>
      <h2 className="text-3xl font-semibold text-white mb-8 text-center">World Map Tracker</h2>
      <p className="text-sm text-white/40 mb-4">This map is private or doesn&apos;t exist.</p>
      <Link href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
        ← Back to map
      </Link>
    </main>
  )
}
