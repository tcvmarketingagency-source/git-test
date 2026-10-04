import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/'
  const errorDescription = url.searchParams.get('error_description')
  if (errorDescription) return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(errorDescription), url.origin))
  if (!code) return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('Authentication callback is missing its code.'), url.origin))

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent(error.message), url.origin))
  return NextResponse.redirect(new URL(next.startsWith('/') ? next : '/', url.origin))
}
