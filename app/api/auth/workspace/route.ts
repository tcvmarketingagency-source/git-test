import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const workspaceId = String(body.workspace_id || '')
  if (!workspaceId) return NextResponse.json({ ok: false, error: 'workspace_id is required' }, { status: 400 })

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims as Record<string, unknown> | undefined
  const userId = typeof claims?.sub === 'string' ? claims.sub : null
  if (!userId) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) return NextResponse.json({ ok: false, error: 'Workspace access denied' }, { status: 403 })

  const cookieStore = await cookies()
  cookieStore.set('ventureos-workspace-id', workspaceId, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/'
  })
  return NextResponse.json({ ok: true, workspace_id: workspaceId, role: membership.role })
}
