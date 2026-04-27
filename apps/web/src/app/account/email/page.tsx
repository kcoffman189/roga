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

export default function ChangeEmailPage() {
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({ email: newEmail })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
    } else {
      setNewEmail('')
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
        Change Email
      </div>

      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          type="email"
          placeholder="New Email Address"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          required
          autoComplete="email"
        />

        {error && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-accent)', margin: '4px 0 8px' }}>
            {error}
          </p>
        )}

        {success && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2E7D32', margin: '8px 0 12px' }}>
            A confirmation link has been sent to your new email address. Your email will update once confirmed.
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
          {loading ? 'Sending...' : 'Update Email'}
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
            Roga
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
          Roga
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
