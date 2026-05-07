'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function GroupNewConversationInner() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = params.id as string
  const mode = searchParams.get('mode') || 'intentional'
  const supabase = useRef(createSupabaseClient()).current
  const hasStarted = useRef(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      if (mode === 'open' && !hasStarted.current) {
        hasStarted.current = true
        handleStart(user.id)
      }
    }
    init()
  }, [mode])

  const handleStart = async (userId?: string, message?: string) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const uid = userId || user.id

    const ctrl = new AbortController()

    await fetchEventSource(`${API_URL}/group-conversation/start/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        message: message || input || 'I\'d like to explore something.',
        user_id: uid,
        group_id: groupId,
      }),
      signal: ctrl.signal,
      onmessage(ev) {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'conversation_id') {
            ctrl.abort()
            router.push(`/groups/${groupId}/conversation/${data.conversation_id}?streaming=true`)
          }
        } catch {}
      },
      onerror(err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        throw err
      },
      openWhenHidden: true,
    })
  }

  if (mode === 'open') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--color-bg-canvas)' }}>
        <div style={{ color: 'var(--color-text-tertiary)', fontSize: '15px' }}>Finding something interesting...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--color-bg-canvas)' }}>

      {/* Mobile Header */}
      <div
        style={{
          display: isMobile ? 'flex' : 'none',
          background: 'var(--color-bg-canvas)',
          borderBottom: '1px solid var(--color-border-light)',
          alignItems: 'center',
          height: '52px',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.push(`/groups/${groupId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '29px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
        >
          Roga
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '580px' }}>
          <span style={{ display: 'block', width: '32px', height: '2px', background: 'var(--color-accent)', marginBottom: '20px', border: 'none' }} />
          <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', fontWeight: 400, marginBottom: '24px', color: 'var(--color-text-primary)', margin: '0 0 28px 0', lineHeight: 1.4 }}>What do you want to dig into?</h2>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="A chapter, a question, an idea you can't shake..."
            rows={4}
            autoFocus
            style={{
              width: '100%',
              padding: '16px 18px',
              fontSize: '15px',
              fontFamily: 'Inter, system-ui, sans-serif',
              color: 'var(--color-text-primary)',
              lineHeight: 1.6,
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border-light)',
              borderRadius: '4px',
              resize: 'vertical',
              boxSizing: 'border-box',
              marginBottom: '20px',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!loading && input.trim()) handleStart()
              }
            }}
          />
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button
              onClick={() => handleStart()}
              disabled={loading || !input.trim()}
              style={{
                flex: 2, padding: '14px 32px',
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                background: 'var(--color-bg-sidebar)',
                color: 'var(--color-text-on-dark)',
                border: 'none', borderRadius: '2px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.5 : 1,
                position: 'relative', minHeight: '44px',
              }}
            >
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--color-accent)', borderRadius: '2px 0 0 2px' }} />
              {loading ? 'Starting...' : 'Start'}
            </button>
            <button
              onClick={() => router.push(`/groups/${groupId}`)}
              style={{
                flex: 1, padding: '14px 32px',
                fontSize: '13px', fontWeight: '400',
                background: 'transparent',
                color: 'var(--color-text-tertiary)',
                border: '1px solid var(--color-border-light)',
                borderRadius: '2px', cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GroupNewConversationPage() {
  return (
    <Suspense>
      <GroupNewConversationInner />
    </Suspense>
  )
}
