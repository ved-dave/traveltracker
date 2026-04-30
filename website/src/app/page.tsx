import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RootMap from '@/components/RootMap'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('users').select('username').eq('id', user.id).single()
    if (profile?.username) redirect(`/${profile.username}`)
  }

  return (
    <main className="flex-1 p-6" style={{ background: '#0a0a0a' }}>
      <div className="mb-4">
        <div className="relative">
          <h2 className="text-3xl font-semibold text-white text-center">World Map Tracker</h2>
          <div className="hidden sm:flex absolute right-0 top-0 items-center gap-3">
            <span className="text-xs text-white/30">Want to save and share your map?</span>
            <Link
              href="/login"
              className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
        <div className="flex sm:hidden justify-center items-center gap-2 mt-3">
          <span className="text-xs text-white/30">Want to save and share your map?</span>
          <Link
            href="/login"
            className="text-xs px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>

      <RootMap />
    </main>
  )
}
