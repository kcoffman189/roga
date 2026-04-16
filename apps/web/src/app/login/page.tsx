'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 500)
      }
    } catch (e) {
      console.error('Login exception:', e)
      setError('Something went wrong. Check console.')
      setLoading(false)
    }
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 500)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        padding: '24px 20px',
        background: '#fafafa',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px', textAlign: 'center' }}>Roga</h1>
        <p style={{ color: '#999', textAlign: 'center', marginBottom: '32px', fontSize: '15px' }}>Sign in or create an account</p>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 14px',
            marginBottom: '10px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
            minHeight: '44px',
            background: '#fff',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          style={{
            display: 'block',
            width: '100%',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            boxSizing: 'border-box',
            minHeight: '44px',
            background: '#fff',
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
        />

        {error && <p style={{ color: '#c00', marginBottom: '12px', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
        {loading && <p style={{ color: '#999', marginBottom: '12px', fontSize: '14px', textAlign: 'center' }}>Signing in...</p>}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleLogin}
            disabled={loading || !email || !password}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid #ccc',
              background: '#fff',
              minHeight: '44px',
            }}
          >
            Sign in
          </button>
          <button
            onClick={handleSignUp}
            disabled={loading || !email || !password}
            style={{
              flex: 1,
              padding: '12px',
              fontSize: '16px',
              cursor: 'pointer',
              borderRadius: '8px',
              border: 'none',
              background: '#1a1a1a',
              color: '#fff',
              minHeight: '44px',
            }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  )
}
