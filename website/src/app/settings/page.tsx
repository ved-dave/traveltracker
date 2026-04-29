'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [deleteState, setDeleteState] = useState<'idle' | 'confirming' | 'deleting'>('idle')
  const [deleteError, setDeleteError] = useState('')
  const [mapId, setMapId] = useState<string | null>(null)

  // Initialize from search param so the button renders immediately
  const [isPublic, setIsPublic] = useState<boolean | null>(() => {
    const p = searchParams.get('public')
    return p === null ? null : p === '1'
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('maps').select('id, is_public').eq('user_id', user.id).single()
      if (data) {
        setMapId(data.id)
        // Only override if we had no param (navigated directly to /settings)
        if (searchParams.get('public') === null) setIsPublic(data.is_public)
      }
    })
  }, [searchParams])

  async function handlePrivacyToggle() {
    if (!mapId || isPublic === null) return
    const next = !isPublic
    setIsPublic(next)
    const supabase = createClient()
    supabase.from('maps').update({ is_public: next }).eq('id', mapId).then()
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDeleteConfirm() {
    setDeleteState('deleting')
    setDeleteError('')
    const res = await fetch('/api/delete-account', { method: 'DELETE' })
    if (!res.ok) {
      const { error } = await res.json()
      setDeleteError(error ?? 'Something went wrong.')
      setDeleteState('confirming')
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const btnClass = "w-full py-2 rounded-lg text-sm font-medium text-white/80 bg-[#2b2b2c] border border-[#383838] hover:bg-[#383838] hover:text-white transition-colors"

  return (
    <main className="flex-1 flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <h2 className="text-3xl font-semibold text-white mb-8 text-center">World Map Tracker</h2>
      <div className="w-full max-w-sm rounded-xl border border-[#383838] p-8" style={{ background: '#1e1e1f' }}>
        <button
          onClick={() => router.back()}
          className="text-xs text-white/30 hover:text-white/60 mb-6 block transition-colors"
        >
          ← Back
        </button>
        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wide mb-6">Settings</h3>

        <div className="space-y-3">
          {isPublic !== null && (
            <button onClick={handlePrivacyToggle} className={btnClass}>
              {isPublic ? 'Make map private' : 'Make map public'}
            </button>
          )}

          <button onClick={handleLogout} className={btnClass}>
            Log out
          </button>

          <div className="pt-4 border-t border-[#383838]">
            {deleteState === 'idle' && (
              <button
                onClick={() => setDeleteState('confirming')}
                className="w-full py-2 rounded-lg text-sm font-medium text-red-400/80 border border-red-900/40 hover:bg-red-950/50 hover:text-red-300 transition-colors"
              >
                Delete account
              </button>
            )}

            {(deleteState === 'confirming' || deleteState === 'deleting') && (
              <div className="space-y-3">
                <p className="text-xs text-white/40 text-center leading-relaxed">
                  This will permanently delete your account and all map data. This cannot be undone.
                </p>
                {deleteError && (
                  <p className="text-xs text-red-400 text-center">{deleteError}</p>
                )}
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteState === 'deleting'}
                  className="w-full py-2 rounded-lg text-sm font-medium text-white bg-red-900/60 border border-red-900/60 hover:bg-red-800/60 disabled:opacity-40 transition-colors"
                >
                  {deleteState === 'deleting' ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => { setDeleteState('idle'); setDeleteError('') }}
                  disabled={deleteState === 'deleting'}
                  className="w-full py-2 rounded-lg text-sm font-medium text-white/40 hover:text-white/70 disabled:opacity-40 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
