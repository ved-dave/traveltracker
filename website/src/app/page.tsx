import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MapView from '@/components/MapView'
import { DEFAULT_COLORS } from '@/lib/map-utils'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('users').select('username').eq('id', user.id).single()
    if (profile?.username) redirect(`/${profile.username}`)
  }

  return (
    <main className="min-h-screen p-6" style={{ background: '#0a0a0a' }}>
      <div className="relative mb-4">
        <h2 className="text-3xl font-semibold text-white mb-8 text-center">World Map Tracker</h2>
        <Link
          href="/login"
          className="absolute right-0 top-0 text-xs px-3 py-1.5 rounded-md border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors"
        >
          Log in
        </Link>
      </div>

      <MapView
        initialRegions={{}}
        initialColors={{ ...DEFAULT_COLORS }}
        editable={true}
      />
    </main>
  )
}
