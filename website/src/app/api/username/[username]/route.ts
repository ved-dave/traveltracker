import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ username: string }>
}

// GET /api/username/[username] — returns { available: boolean }
export async function GET(_request: Request, { params }: RouteParams) {
  const { username } = await params

  // TODO: add input validation (format check) before hitting DB
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  return NextResponse.json({ available: data === null })
}
