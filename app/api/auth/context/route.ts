import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  const claims = data?.claims as Record<string, unknown> | undefined
  const userId = typeof claims?.sub === 'string' ? claims.sub : null
  if (error || !userId) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces!inner(id, name, slug, plan)')
    .eq('user_id', userId)

  if (membershipError) return NextResponse.json({ ok: false, error: membershipError.message }, { status: 500 })

  const items = (memberships || []).map((item: any) => ({
    workspace_id: item.workspace_id,
    role: item.role,
    workspace: Array.isArray(item.workspaces) ? item.workspaces[0] : item.workspaces
  }))
  const cookieStore = await cookies()
  const cookieWorkspace = cookieStore.get('ventureos-workspace-id')?.value
  const active = items.find((item) => String(item.workspace_id) === String(cookieWorkspace)) || items[0] || null
  const email = typeof claims?.email === 'string' ? claims.email : null

  return NextResponse.json({
    ok: true,
    user: { id: userId, email },
    active_workspace: active,
    workspaces: items,
    generatedAt: new Date().toISOString()
  }, { headers: { 'Cache-Control': 'no-store' } })
}
