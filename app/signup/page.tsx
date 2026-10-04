'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: any) {
    e.preventDefault(); setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirmation) return setError('Passwords do not match.')
    setLoading(true)
    const { data, error } = await createClient().auth.signUp({
      email: email.trim(), password,
      options: { emailRedirectTo: window.location.origin + '/auth/callback?next=/' }
    })
    setLoading(false)
    if (error) return setError(error.message)
    if (data.session) window.location.href = '/'
    else setMessage('Account created. Check your email to confirm the account, then sign in.')
  }

  return <main className="auth-shell">
    <div className="auth-grid auth-grid-single">
      <section className="auth-card">
        <div className="auth-card-head"><Sparkles size={16}/><span>VENTUREOS ACCOUNT</span></div>
        <h2>Create your founder account.</h2>
        <p className="auth-muted">Your account gets an isolated VentureOS workspace automatically.</p>
        <form onSubmit={submit}>
          <label>Email<input value={email} onChange={(e: any)=>setEmail(e.target.value)} type="email" autoComplete="email" required placeholder="founder@company.com"/></label>
          <label>Password<div className="password-wrap"><input value={password} onChange={(e: any)=>setPassword(e.target.value)} type={showPassword ? 'text' : 'password'} autoComplete="new-password" required placeholder="At least 8 characters"/><button type="button" aria-label="Toggle password" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={15}/>:<Eye size={15}/>}</button></div></label>
          <label>Confirm password<input value={confirmation} onChange={(e: any)=>setConfirmation(e.target.value)} type="password" autoComplete="new-password" required placeholder="Repeat password"/></label>
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-success"><CheckCircle2 size={16}/><span>{message}</span></div>}
          <button className="auth-primary" disabled={loading}>{loading ? 'Creating account…' : <>Create account <ArrowRight size={15}/></>}</button>
        </form>
        <div className="auth-links"><a href="/login">Already have an account? Sign in</a></div>
      </section>
    </div>
  </main>
}
