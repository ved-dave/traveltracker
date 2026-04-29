'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('users').select('username').eq('id', session.user.id).single()
      router.replace(data?.username ? `/${data.username}` : '/')
    })
  }, [router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleSignIn(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('username').eq('id', user!.id).single()
    router.push(profile?.username ? `/${profile.username}` : '/')
  }

  async function handleForgot(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setForgotMsg('')
    setForgotLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotLoading(false)
    if (error) { setForgotMsg(error.message) } else { setForgotMsg('Check your email for a reset link.') }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-gray-100 placeholder-gray-500 outline-none focus:ring-1 focus:ring-gray-600 border border-gray-700"

  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#0a0a0a' }}>
      <h2 className="text-3xl font-semibold text-white mb-8 text-center">World Map Tracker</h2>
      <div className="w-full max-w-sm rounded-xl border border-gray-800 p-8" style={{ background: '#1d1d1e' }}>
        {forgotMode ? (
          <>
            <button
              onClick={() => { setForgotMode(false); setForgotMsg('') }}
              className="text-xs text-gray-500 hover:text-gray-300 mb-6 block"
            >
              ← Back
            </button>
            <h3 className="text-base font-medium text-gray-100 mb-4">Reset password</h3>
            <form onSubmit={handleForgot} className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
                className={inputClass}
                style={{ background: '#0a0a0a' }}
              />
              {forgotMsg && (
                <p className={`text-xs ${forgotMsg.includes('Check') ? 'text-green-400' : 'text-red-400'}`}>
                  {forgotMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-2 rounded-lg text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                {forgotLoading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleSignIn} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={inputClass}
              style={{ background: '#0a0a0a' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className={inputClass}
              style={{ background: '#0a0a0a' }}
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => { setForgotMode(true); setForgotEmail(email) }}
                className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
              >
                Forgot password?
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
