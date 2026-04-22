'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Session is now active — form is already visible
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/'), 2000)
    }
  }

  return (
    <>
      <style>{`
        .rp-input::placeholder { color: #B0ACA6; }
        .rp-input:focus { border-color: #C45E0A; outline: none; }
        .rp-btn:hover { background: #1A1A1A !important; }
      `}</style>
      <div
        style={{
          minHeight: '100vh',
          background: '#FAF8F4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '340px' }}>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: '28px',
              fontWeight: 400,
              color: '#1A1A1A',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            Roga
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#6B6B6B',
              marginBottom: '20px',
            }}
          >
            Set a new password
          </div>
          <hr
            style={{
              width: '44px',
              height: '2px',
              background: '#C45E0A',
              border: 'none',
              marginBottom: '20px',
              display: 'block',
              marginLeft: 0,
            }}
          />

          {success ? (
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                color: '#6B6B6B',
                lineHeight: 1.6,
              }}
            >
              Password updated. Redirecting you to sign in...
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <input
                className="rp-input"
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E4E0DA',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#1A1A1A',
                  width: '100%',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              />
              <input
                className="rp-input"
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E4E0DA',
                  borderRadius: '4px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  fontFamily: 'Inter, sans-serif',
                  color: '#1A1A1A',
                  width: '100%',
                  marginBottom: '8px',
                  boxSizing: 'border-box',
                  display: 'block',
                }}
              />
              <button
                className="rp-btn"
                type="submit"
                disabled={loading}
                style={{
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
                  marginTop: '4px',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '3px',
                    background: '#C45E0A',
                  }}
                />
                {loading ? 'Updating...' : 'Update password'}
              </button>
              {error && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#C45E0A',
                    marginTop: '8px',
                    marginBottom: 0,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {error}
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </>
  )
}
