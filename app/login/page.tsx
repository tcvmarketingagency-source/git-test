'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const FOUNDER_EMAIL = 'tcvmarketingagency@gmail.com'

export default function LoginPage() {
  const [email, setEmail] = useState(FOUNDER_EMAIL)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [showPasswordLogin, setShowPasswordLogin] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const message = params.get('error')
    if (message) setError(message)
  }, [])

  async function continueWithGoogle() {
    setGoogleLoading(true)
    setError('')
    const next = new URLSearchParams(window.location.search).get('next') || '/'
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback?next=' + encodeURIComponent(next),
        queryParams: {
          login_hint: email.trim() || FOUNDER_EMAIL,
                  }
      }
    })
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  async function submit(e: any) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
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
        <p className="auth-muted">Use your Google account for passwordless founder access.</p>

        <div className="auth-founder">
          <div className="auth-founder-avatar">G</div>
          <div><b>{FOUNDER_EMAIL}</b><small>Google workspace identity</small></div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="auth-google" onClick={continueWithGoogle} disabled={googleLoading || loading}>
          <span className="google-glyph">G</span>
          {googleLoading ? 'Connecting to Google…' : <>Continue with Google <ArrowRight size={15}/></>}
        </button>

        <div className="auth-divider"><span>or use password</span></div>

        {!showPasswordLogin ? (
          <button className="auth-secondary" onClick={() => setShowPasswordLogin(true)}>Use password instead</button>
        ) : (
          <form onSubmit={submit}>
            <label>Email<input value={email} onChange={(e: any)=>setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="founder@company.com"/></label>
            <label>Password<div className="password-wrap"><input value={password} onChange={(e: any)=>setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="••••••••"/><button type="button" aria-label="Toggle password" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label>
            <button className="auth-primary" disabled={loading}>{loading ? 'Signing in…' : <>Enter VentureOS <ArrowRight size={15}/></>}</button>
          </form>
        )}

        <div className="auth-links"><a href="/reset-password">Forgot password?</a><span>·</span><a href="/signup">Create workspace account</a></div>
      </section>
    </div>
  </main>
}
