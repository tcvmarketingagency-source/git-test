'use client'

import { useEffect, useState } from 'react'
import { Building2, LogOut, Save, ShieldCheck, UserCircle2 } from 'lucide-react'

type Context = { user: { id: string; email: string | null }; active_workspace: any; workspaces: any[] }

export default function SettingsPage() {
  const [ctx, setCtx] = useState<Context | null>(null)
  const [workspace, setWorkspace] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/context', { cache: 'no-store' }).then(async (r) => {
      const data = await r.json()
      if (data.ok) { setCtx(data); setWorkspace(String(data.active_workspace?.workspace_id || '')) }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function switchWorkspace() {
    setStatus('Switching…')
    const response = await fetch('/api/auth/workspace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: workspace }) })
    const data = await response.json()
    setStatus(data.ok ? 'Workspace switched.' : data.error || 'Unable to switch workspace.')
    if (data.ok) window.location.reload()
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return <main className="settings-shell">
    <div className="settings-header"><div><span className="eyebrow">VENTUREOS / SETTINGS</span><h1>Workspace & security.</h1><p>Identity, tenant access and operating context.</p></div><button className="settings-logout" onClick={logout}><LogOut size={15}/> Sign out</button></div>
    {loading ? <div className="settings-card">Loading workspace context…</div> : !ctx ? <div className="settings-card">Unable to load account context.</div> : <div className="settings-grid">
      <section className="settings-card"><div className="settings-icon"><UserCircle2 size={18}/></div><div className="settings-title">Founder identity</div><div className="settings-value">{ctx.user.email || 'Authenticated user'}</div><small>{ctx.user.id}</small></section>
      <section className="settings-card"><div className="settings-icon"><Building2 size={18}/></div><div className="settings-title">Active workspace</div><div className="settings-value">{ctx.active_workspace?.workspace?.name || 'Workspace'}</div><small>{ctx.active_workspace?.role || 'viewer'} · {ctx.active_workspace?.workspace?.plan || 'founder'}</small></section>
      <section className="settings-card settings-wide"><div className="settings-title">Workspace switcher</div><p>Select the workspace whose VentureOS intelligence, products, costs and billing context you want to operate.</p><div className="settings-row"><select value={workspace} onChange={(e: any)=>setWorkspace(e.target.value)}>{ctx.workspaces.map((item:any)=><option key={item.workspace_id} value={item.workspace_id}>{item.workspace?.name || item.workspace_id} · {item.role}</option>)}</select><button onClick={switchWorkspace}><Save size={15}/> Apply</button></div>{status && <small>{status}</small>}</section>
      <section className="settings-card settings-wide"><div className="settings-title">Security posture</div><div className="security-list"><div><ShieldCheck size={16}/><span>Supabase Auth session + server-side claim validation</span><b>Ready</b></div><div><ShieldCheck size={16}/><span>Workspace-scoped VentureOS tables + RLS</span><b>Ready</b></div><div><ShieldCheck size={16}/><span>Provider secrets stay server-side</span><b>Ready</b></div><div><ShieldCheck size={16}/><span>Billing / execution approvals remain policy-controlled</span><b>Ready</b></div></div></section>
    </div>}
  </main>
}
