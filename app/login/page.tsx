'use client'

import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: any) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
    if (error) { setError(error.message); setLoading(false); return }
    window.location.href = new URLSearchParams(window.location.search).get('next') || '/'
  }

  return <main className="auth-shell">
    <div className="auth-grid">
      <section className="auth-brand">
        <div className="brand-mark">V</div>
        <span className="auth-kicker">VENTURE INTELLIGENCE OS</span>
        <h1>Turn market signals into ventures.</h1>
        <p>One controlled system for research, evidence, opportunities, products, execution and learning.</p>
        <div className="auth-trust"><ShieldCheck size={15}/><span>Workspace isolation · server-side secrets · policy-controlled automation</span></div>
      </section>
      <section className="auth-card">
        <div className="auth-card-head"><Sparkles size={16}/><span>FOUNDER CONSOLE</span></div>
        <h2>Welcome back.</h2>
        <p className="auth-muted">Sign in to your VentureOS workspace.</p>
        <form onSubmit={submit}>
          <label>Email<input value={email} onChange={(e: any)=>setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="founder@company.com"/></label>
          <label>Password<div className="password-wrap"><input value={password} onChange={(e: any)=>setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="••••••••"/><button type="button" aria-label="Toggle password" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label>
          {error && <div className="auth-error">{error}</div>}
          <button className="auth-primary" disabled={loading}>{loading ? 'Signing in…' : <>Enter VentureOS <ArrowRight size={15}/></>}</button>
        </form>
        <div className="auth-links"><a href="/reset-password">Forgot password?</a><span>·</span><a href="/signup">Create workspace account</a></div>
      </section>
    </div>
  </main>
}
