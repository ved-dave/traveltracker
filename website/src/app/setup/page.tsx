'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_COLORS } from '@/lib/map-utils'
import { DRAFT_KEY } from '@/components/RootMap'

const USERNAME_RE = /^[a-z0-9-]{3,30}$/

export default function SetupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect away if user is not logged in or already has a username
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      const { data } = await supabase.from('users').select('username').eq('id', user.id).single()
      if (data?.username) router.replace(`/${data.username}`)
    })
  }, [router])

  const checkUsername = useCallback((val: string) => {
    if (!val) { setUsernameStatus('idle'); return }
    if (!USERNAME_RE.test(val)) { setUsernameStatus('invalid'); return }
    setUsernameStatus('checking')
    fetch(`/api/username/${val}`)
      .then(r => r.json())
      .then(d => setUsernameStatus(d.available ? 'available' : 'taken'))
      .catch(() => setUsernameStatus('idle'))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => checkUsername(username), 400)
    return () => clearTimeout(t)
  }, [username, checkUsername])

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (usernameStatus !== 'available') return
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const { error: profileError } = await supabase.from('users').insert({ id: user.id, username, email: user.email })
    if (profileError) { setError(profileError.message); setLoading(false); return }

    const draft = (() => {
      try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { return null }
    })()

    await supabase.from('maps').insert({
      user_id: user.id,
      regions: draft?.regions ?? {},
      colors: draft?.colors ?? DEFAULT_COLORS,
      is_public: false,
    })

    localStorage.removeItem(DRAFT_KEY)
    router.push(`/${username}`)
  }

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-white/80 placeholder-white/25 outline-none focus:ring-1 focus:ring-white/20 border border-[#383838] bg-[#0a0a0a]"

  const usernameHint = {
    idle: null,
    checking: <span className="text-white/30">Checking…</span>,
    available: <span className="text-green-400">Available</span>,
    taken: <span className="text-red-400">Already taken</span>,
    invalid: <span className="text-red-400">3–30 chars, lowercase letters, numbers, hyphens only</span>,
  }[usernameStatus]

  return (
    <main className="flex-1 flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <h2 className="text-3xl font-semibold text-white mb-8 text-center">World Map Tracker</h2>
      <div className="w-full max-w-sm rounded-xl border border-[#383838] p-8" style={{ background: '#1e1e1f' }}>
        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide mb-2">Choose a username</h3>
        <p className="text-xs text-white/30 mb-6">This will be your public map URL.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase())}
              required
              className={inputClass}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            {usernameHint && <p className="text-xs pl-1">{usernameHint}</p>}
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || usernameStatus !== 'available'}
            className="w-full py-2 rounded-lg text-sm font-medium text-white/80 bg-[#2b2b2c] border border-[#383838] hover:bg-[#383838] hover:text-white disabled:opacity-40 transition-colors"
          >
            {loading ? 'Setting up…' : 'Continue'}
          </button>
        </form>
      </div>
    </main>
  )
}
