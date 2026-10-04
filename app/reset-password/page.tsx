'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { createClient().auth.getSession().then(({ data }) => setSessionReady(Boolean(data.session))) }, [])

  async function requestReset(e: any) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin + '/auth/callback?next=/reset-password' })
    setLoading(false)
    if (error) return setError(error.message)
    setMessage('Password reset email sent. Open the link to continue.')
  }

  async function updatePassword(e: any) {
    e.preventDefault(); setLoading(true); setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); setLoading(false); return }
    if (password !== confirm) { setError('Passwords do not match.'); setLoading(false); return }
    const { error } = await createClient().auth.updateUser({ password })
    setLoading(false)
    if (error) return setError(error.message)
    setMessage('Password updated successfully.')
  }

  return <main className="auth-shell">
    <div className="auth-grid auth-grid-single">
      <section className="auth-card">
        <div className="auth-card-head"><Sparkles size={16}/><span>ACCOUNT RECOVERY</span></div>
        <h2>{sessionReady ? 'Set a new password.' : 'Reset your password.'}</h2>
        <p className="auth-muted">{sessionReady ? 'Choose a new secure password.' : 'We will email you a secure recovery link.'}</p>
        {!sessionReady ? <form onSubmit={requestReset}><label>Email<input value={email} onChange={(e: any)=>setEmail(e.target.value)} type="email" required placeholder="founder@company.com"/></label><button className="auth-primary" disabled={loading}>{loading ? 'Sending…' : <>Send reset link <ArrowRight size={15}/></>}</button></form> : <form onSubmit={updatePassword}><label>New password<input value={password} onChange={(e: any)=>setPassword(e.target.value)} type="password" required placeholder="At least 8 characters"/></label><label>Confirm password<input value={confirm} onChange={(e: any)=>setConfirm(e.target.value)} type="password" required placeholder="Repeat password"/></label><button className="auth-primary" disabled={loading}>{loading ? 'Saving…' : <>Update password <ArrowRight size={15}/></>}</button></form>}
        {message && <div className="auth-success"><CheckCircle2 size={16}/><span>{message}</span></div>}
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-links"><a href="/login">Back to sign in</a></div>
      </section>
    </div>
  </main>
}
