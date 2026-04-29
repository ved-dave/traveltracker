'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const router = useRouter()
  const [deleteState, setDeleteState] = useState<'idle' | 'confirming' | 'deleting'>('idle')
  const [deleteError, setDeleteError] = useState('')

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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <h2 className="text-3xl font-semibold text-white mb-8 text-center">World Map Tracker</h2>
      <div className="w-full max-w-sm rounded-xl border border-gray-800 p-8" style={{ background: '#1d1d1e' }}>
        <button
          onClick={() => router.back()}
          className="text-xs text-gray-500 hover:text-gray-300 mb-6 block"
        >
          ← Back
        </button>
        <h2 className="text-base font-medium text-gray-100 mb-6">Settings</h2>

        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full py-2 rounded-lg text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            Log out
          </button>

          <div className="pt-4 border-t border-gray-800">
            {deleteState === 'idle' && (
              <button
                onClick={() => setDeleteState('confirming')}
                className="w-full py-2 rounded-lg text-sm font-medium text-red-400 border border-red-900 hover:bg-red-950 transition-colors"
              >
                Delete account
              </button>
            )}

            {(deleteState === 'confirming' || deleteState === 'deleting') && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 text-center">
                  This will permanently delete your account and all map data. This cannot be undone.
                </p>
                {deleteError && (
                  <p className="text-xs text-red-400 text-center">{deleteError}</p>
                )}
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteState === 'deleting'}
                  className="w-full py-2 rounded-lg text-sm font-medium text-white bg-red-800 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteState === 'deleting' ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => { setDeleteState('idle'); setDeleteError('') }}
                  disabled={deleteState === 'deleting'}
                  className="w-full py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors"
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
