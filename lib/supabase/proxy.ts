import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PAGE_PREFIXES = ['/login', '/signup', '/auth/']
const PUBLIC_API_PATHS = new Set(['/api/health', '/api/billing/webhook'])

function isPublicPath(pathname: string) {
  return PUBLIC_PAGE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))
    || PUBLIC_API_PATHS.has(pathname)
    || /^\/api\/(?:[^/]+\/)cron$/.test(pathname)
}

function copyCookiesAndHeaders(source: NextResponse, target: NextResponse) {
  source.headers.forEach((value, key) => target.headers.set(key, value))
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie))
  return target
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers || {}).forEach(([key, value]) => response.headers.set(key, value))
        }
      }
    }
  )

  const pathname = request.nextUrl.pathname
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims as Record<string, unknown> | undefined
  const userId = typeof claims?.sub === 'string' ? claims.sub : null

  if (!userId) {
    if (isPublicPath(pathname)) return response
    if (pathname.startsWith('/api/')) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return copyCookiesAndHeaders(response, NextResponse.redirect(url))
  }

  let workspaceId = request.cookies.get('ventureos-workspace-id')?.value || null
  let role = 'viewer'

  try {
    const { data: memberships } = await supabase
      .from('workspace_members')
      .select('workspace_id, role, workspaces!inner(id, name, slug, plan)')
      .eq('user_id', userId)

    const list = memberships || []
    if (!workspaceId || !list.some((item: any) => String(item.workspace_id) === String(workspaceId))) {
      workspaceId = list[0]?.workspace_id ? String(list[0].workspace_id) : null
      if (workspaceId) response.cookies.set('ventureos-workspace-id', workspaceId, {
        httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/'
      })
    }
    const selected = list.find((item: any) => String(item.workspace_id) === String(workspaceId))
    if (selected?.role) role = String(selected.role)
  } catch {}

  const requestHeaders = new Headers(request.headers)
  if (workspaceId) requestHeaders.set('x-ventureos-workspace-id', workspaceId)
  requestHeaders.set('x-ventureos-user-id', userId)
  requestHeaders.set('x-ventureos-role', role)

  const finalResponse = NextResponse.next({ request: { headers: requestHeaders } })
  return copyCookiesAndHeaders(response, finalResponse)
}
