'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('Attempting login...')
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('Login result:', { data, error })
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1>Roga</h1>
      <p>Sign in or create an account</p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{ padding: '8px', marginBottom: '8px', width: '280px', fontSize: '16px' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        style={{ padding: '8px', marginBottom: '12px', width: '280px', fontSize: '16px' }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
      />
      {error && <p style={{ color: 'red', marginBottom: '8px' }}>{error}</p>}
      {loading && <p style={{ color: '#999', marginBottom: '8px' }}>Signing in...</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer' }}
        >
          Sign in
        </button>
        <button
          onClick={handleSignUp}
          disabled={loading || !email || !password}
          style={{ padding: '10px 24px', fontSize: '16px', cursor: 'pointer' }}
        >
          Create account
        </button>
      </div>
    </div>
  )
}
