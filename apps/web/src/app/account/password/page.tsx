'use client'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useRef, useState } from 'react'
import { useIsMobile } from '@/hooks/useIsMobile'

const inputStyle: React.CSSProperties = {
  background: '#FFFFFF',
  border: '1px solid var(--color-border-light)',
  borderRadius: '4px',
  padding: '10px 14px',
  fontSize: '13px',
  fontFamily: 'Inter, sans-serif',
  color: 'var(--color-text-primary)',
  width: '100%',
  boxSizing: 'border-box',
  display: 'block',
  marginBottom: '4px',
}

const fieldErrorStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: '12px',
  color: 'var(--color-accent)',
  marginBottom: '10px',
  marginTop: 0,
  display: 'block',
}

export default function ChangePasswordPage() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [currentError, setCurrentError] = useState('')
  const [newError, setNewError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentError('')
    setNewError('')
    setConfirmError('')
    setSuccess(false)

    let valid = true
    if (newPass.length < 6) { setNewError('Password must be at least 6 characters.'); valid = false }
    if (newPass !== confirm) { setConfirmError('Passwords do not match.'); valid = false }
    if (!valid) return

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) { setLoading(false); return }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    })
    if (signInError) {
      setCurrentError('Current password is incorrect.')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPass })
    setLoading(false)
    if (error) {
      setNewError(error.message)
    } else {
      setCurrent('')
      setNewPass('')
      setConfirm('')
      setSuccess(true)
    }
  }

  const form = (
    <div style={{ maxWidth: '360px', width: '100%', padding: isMobile ? '24px 20px' : '48px' }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '22px',
          color: 'var(--color-text-primary)',
          marginBottom: '28px',
        }}
      >
        Change Password
      </div>

      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          type="password"
          placeholder="Current Password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
          autoComplete="current-password"
        />
        {currentError && <span style={fieldErrorStyle}>{currentError}</span>}

        <div style={{ marginTop: currentError ? 0 : '10px' }}>
          <input
            style={inputStyle}
            type="password"
            placeholder="New Password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
            autoComplete="new-password"
          />
          {newError && <span style={fieldErrorStyle}>{newError}</span>}
        </div>

        <div style={{ marginTop: newError ? 0 : '10px' }}>
          <input
            style={inputStyle}
            type="password"
            placeholder="Confirm New Password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
          {confirmError && <span style={fieldErrorStyle}>{confirmError}</span>}
        </div>

        {success && (
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#2E7D32',
              marginTop: '12px',
              marginBottom: '12px',
            }}
          >
            Password updated.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '16px',
            background: '#272C32',
            color: '#EEECEA',
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '13px 24px',
            border: 'none',
            borderRadius: '2px',
            width: '100%',
            cursor: loading ? 'default' : 'pointer',
            position: 'relative',
            transition: 'background 150ms ease',
            display: 'block',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: '3px', background: 'var(--color-accent)',
            }}
          />
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-canvas)' }}>
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-light)',
            padding: '10px 20px', display: 'flex', alignItems: 'flex-end',
          }}
        >
          <a
            href="/account"
            style={{
              fontFamily: 'Georgia, serif', fontSize: '29px', letterSpacing: '-0.02em',
              lineHeight: 1, color: 'var(--color-text-primary)', textDecoration: 'none',
            }}
          >
            Cephos
          </a>
        </div>
        <div style={{ flex: 1, paddingTop: '72px' }}>{form}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-canvas)' }}>
      <div className="sidebar-panel" style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '22px 20px' }}>
        <a
          href="/account"
          style={{
            fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: '58px',
            letterSpacing: '-0.02em', color: 'var(--color-text-on-dark)', lineHeight: 1, textDecoration: 'none',
          }}
        >
          Cephos
        </a>
        <div
          style={{
            fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--color-text-subtle-dark)', marginTop: '5px',
          }}
        >
          Beta
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'flex-start' }}>
        {form}
      </div>
    </div>
  )
}
