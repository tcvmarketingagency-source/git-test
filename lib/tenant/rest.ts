import { headers } from 'next/headers'

const TENANT_PREFIX = 'ventureos_'
const GLOBAL_TABLES = new Set(['ventureos_providers'])

function serverConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ''), key }
}

async function workspaceFromDatabase(config: { url: string; key: string }) {
  const response = await fetch(
    config.url + '/rest/v1/workspaces?select=id&order=created_at.asc&limit=1',
    { headers: { apikey: config.key, Authorization: 'Bearer ' + config.key }, cache: 'no-store' }
  )
  if (!response.ok) throw new Error('Unable to resolve VentureOS system workspace: ' + response.status)
  const rows = await response.json()
  if (!rows?.[0]?.id) throw new Error('No VentureOS workspace exists')
  return String(rows[0].id)
}

export async function currentWorkspaceId() {
  const configured = serverConfig()
  if (!configured) throw new Error('Supabase server credentials are not configured')
  try {
    const requestHeaders = await headers()
    const headerWorkspace = requestHeaders.get('x-ventureos-workspace-id')
    if (headerWorkspace) return headerWorkspace
  } catch {}
  return process.env.VENTUREOS_SYSTEM_WORKSPACE_ID || workspaceFromDatabase(configured)
}

function isTenantTable(path: string) {
  const table = path.split('?')[0].split('/')[0]
  return table.startsWith(TENANT_PREFIX) && !GLOBAL_TABLES.has(table)
}

function injectQuery(path: string, workspaceId: string) {
  if (!isTenantTable(path)) return path
  const separator = path.includes('?') ? '&' : '?'
  let result = path
  if (!/[?&]workspace_id=eq\.[^&]+/.test(result)) {
    result += separator + 'workspace_id=eq.' + encodeURIComponent(workspaceId)
  }
  result = result.replace(/([?&])account_key=eq\.primary(?=&|$)/g, '$1account_key=eq.' + encodeURIComponent(workspaceId))
  result = result.replace(/([?&])founder_key=eq\.primary(?=&|$)/g, '$1founder_key=eq.' + encodeURIComponent(workspaceId))
  return result
}

function scopedBody(body: BodyInit | null | undefined, workspaceId: string): BodyInit | null | undefined {
  if (!body) return body
  let parsed: any
  try { parsed = typeof body === 'string' ? JSON.parse(body) : body } catch { return body }

  const scope = (row: any) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row
    const next = { ...row }
    if (!Object.prototype.hasOwnProperty.call(next, 'workspace_id')) next.workspace_id = workspaceId
    if (next.account_key === 'primary') next.account_key = workspaceId
    if (next.founder_key === 'primary') next.founder_key = workspaceId
    return next
  }

  return JSON.stringify(Array.isArray(parsed) ? parsed.map(scope) : scope(parsed))
}

function scopedRpcBody(body: BodyInit | null | undefined, workspaceId: string): BodyInit | null | undefined {
  if (!body || typeof body !== 'string') return body
  try {
    const parsed = JSON.parse(body)
    if (parsed && typeof parsed === 'object') {
      if (parsed.p_account_key === 'primary') parsed.p_account_key = workspaceId
      if (parsed.p_founder_key === 'primary') parsed.p_founder_key = workspaceId
    }
    return JSON.stringify(parsed)
  } catch { return body }
}

export async function ventureosRequest(path: string, init: RequestInit = {}) {
  const configured = serverConfig()
  if (!configured) throw new Error('Supabase server credentials are not configured')
  const workspaceId = await currentWorkspaceId()
  const method = String(init.method || 'GET').toUpperCase()
  const isRpc = path.startsWith('rpc/')
  const nextPath = isRpc ? path : injectQuery(path, workspaceId)
  const body: BodyInit | null | undefined = isRpc
    ? scopedRpcBody(init.body, workspaceId)
    : (method === 'POST' || method === 'PUT' ? scopedBody(init.body, workspaceId) : init.body)

  const response = await fetch(configured.url + '/rest/v1/' + nextPath, {
    ...init,
    body,
    headers: {
      apikey: configured.key,
      Authorization: 'Bearer ' + configured.key,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    cache: 'no-store'
  })
  if (!response.ok) throw new Error('Supabase ' + response.status + ': ' + await response.text())
  return response.status === 204 ? null : response.json()
}

export function ventureosConfigured() {
  return !!serverConfig()
}

export async function ventureosRpc(fn: string, args: Record<string, unknown>) {
  return ventureosRequest('rpc/' + fn, { method: 'POST', body: JSON.stringify(args) })
}
