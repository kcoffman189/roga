'use client'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = 'https://roga-api.fly.dev'

export default function DeleteAccountPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = useRef(createSupabaseClient()).current
  const router = useRouter()
  const isMobile = useIsMobile()

  const handleDelete = async () => {
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    const res = await fetch(`${API_URL}/delete-account`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    await supabase.auth.signOut()
    router.push('/')
  }

  const btnBase: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '11px',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    padding: '13px 24px',
    border: 'none',
    borderRadius: '2px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 150ms ease',
    display: 'block',
    boxSizing: 'border-box',
    width: '100%',
  }

  const content = (
    <div style={{ maxWidth: '400px', width: '100%', padding: isMobile ? '24px 20px' : '48px' }}>
      {step === 1 ? (
        <>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '22px',
              color: 'var(--color-text-primary)',
              marginBottom: '20px',
            }}
          >
            Delete your account
          </div>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.7,
              marginTop: 0,
              marginBottom: '32px',
            }}
          >
            This will permanently delete your account, your library, all your groups, and every conversation you&apos;ve had in Roga. This cannot be undone.
          </p>
          <a
            href="/account"
            style={{
              ...btnBase,
              background: '#272C32',
              color: '#EEECEA',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '3px', background: 'var(--color-accent)',
              }}
            />
            Cancel
          </a>
          <button
            onClick={() => setStep(2)}
            style={{
              ...btnBase,
              background: '#B94040',
              color: '#FFFFFF',
            }}
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '22px',
              color: 'var(--color-text-primary)',
              marginBottom: '20px',
            }}
          >
            Are you sure?
          </div>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: 'var(--color-text-secondary)',
              marginTop: 0,
              marginBottom: '20px',
            }}
          >
            Type <strong>DELETE</strong> to confirm.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            style={{
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
              marginBottom: '16px',
            }}
          />

          {error && (
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-accent)', margin: '0 0 12px' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || loading}
            style={{
              ...btnBase,
              background: confirmText === 'DELETE' ? '#B94040' : 'var(--color-border-light)',
              color: confirmText === 'DELETE' ? '#FFFFFF' : 'var(--color-text-tertiary)',
              cursor: confirmText !== 'DELETE' || loading ? 'default' : 'pointer',
              marginBottom: '10px',
            }}
          >
            {loading ? 'Deleting...' : 'Delete My Account'}
          </button>
          <button
            onClick={() => { setStep(1); setConfirmText(''); setError('') }}
            style={{
              ...btnBase,
              background: '#272C32',
              color: '#EEECEA',
            }}
          >
            <span
              style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '3px', background: 'var(--color-accent)',
              }}
            />
            Cancel
          </button>
        </>
      )}
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
        <div style={{ flex: 1, paddingTop: '72px' }}>{content}</div>
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
        {content}
      </div>
    </div>
  )
}
