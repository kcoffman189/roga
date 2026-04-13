'use client'
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function NewConversationInner() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'intentional'
  const supabase = createClient()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (mode === 'open' && !hasStarted.current) {
      hasStarted.current = true
      handleStart()
    }
  }, [mode])

  const handleStart = async (message?: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const res = await fetch(`${API_URL}/conversation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        initial_message: message || input || undefined,
        user_id: user.id,
      }),
    })
    const data = await res.json()
    router.push(`/conversation/${data.conversation_id}`)
  }

  if (mode === 'open') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif' }}>
        <div style={{ color: '#999', fontSize: '15px' }}>Finding something interesting...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px', color: '#333' }}>What do you want to dig into?</h2>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="A chapter, a question, an idea you can't shake..."
          rows={4}
          style={{ width: '100%', padding: '12px', fontSize: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', resize: 'none', boxSizing: 'border-box', fontFamily: 'sans-serif' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleStart()
            }
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button
            onClick={() => handleStart()}
            disabled={loading || !input.trim()}
            style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', background: '#000', color: '#fff', border: 'none' }}
          >
            {loading ? 'Starting...' : 'Start'}
          </button>
          <button
            onClick={() => router.push('/')}
            style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function NewConversationPage() {
  return (
    <Suspense>
      <NewConversationInner />
    </Suspense>
  )
}
