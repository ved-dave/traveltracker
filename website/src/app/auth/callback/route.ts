import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('users').select('username').eq('id', user.id).single()
        if (profile?.username) {
          return NextResponse.redirect(`${origin}/${profile.username}`)
        }
        return NextResponse.redirect(`${origin}/setup`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
