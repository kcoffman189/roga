'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

function NewConversationInner() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'intentional'
  const supabase = useRef(createSupabaseClient()).current
  const hasStarted = useRef(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
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

    await fetchEventSource(`${API_URL}/conversation/start/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        initial_message: message || input || undefined,
        user_id: uid,
      }),
      signal: ctrl.signal,
      onmessage(ev) {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'conversation_id') {
            ctrl.abort()
            router.push(`/conversation/${data.conversation_id}?streaming=true`)
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF8F4' }}>
        <div style={{ color: '#6B6B6B', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', fontStyle: 'italic' }}>Finding something interesting...</div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .cn-textarea:focus {
          border-color: #C45E0A !important;
          outline: none !important;
          box-shadow: none !important;
        }
        .cn-textarea::placeholder {
          color: #B0ACA6;
        }
        .cn-btn-start {
          background: #272C32;
          color: #EEECEA;
          font-family: Inter, system-ui, sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 14px 32px;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          position: relative;
          flex: 2;
          transition: background 150ms ease;
          overflow: hidden;
        }
        .cn-btn-start::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #C45E0A;
        }
        .cn-btn-start:hover:not(:disabled) {
          background: #1A1A1A;
        }
        .cn-btn-start:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .cn-btn-cancel {
          background: transparent;
          color: #B0ACA6;
          font-family: Inter, system-ui, sans-serif;
          font-size: 13px;
          font-weight: 400;
          border: 1px solid #E4E0DA;
          border-radius: 2px;
          padding: 14px 32px;
          cursor: pointer;
          flex: 1;
          transition: color 150ms ease, border-color 150ms ease;
        }
        .cn-btn-cancel:hover {
          color: #6B6B6B;
          border-color: #B0ACA6;
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FAF8F4', fontFamily: 'Inter, system-ui, sans-serif' }}>

        {/* Mobile Header — hidden on desktop */}
        <div
          style={{
            display: isMobile ? 'flex' : 'none',
            borderBottom: '1px solid #E4E0DA',
            background: '#FAF8F4',
            alignItems: 'center',
            padding: '0 16px',
            height: '52px',
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => router.push('/home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '29px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
          >
            Cephos
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <div style={{ width: '100%', maxWidth: '580px' }}>
            <span style={{ display: 'block', width: '32px', height: '2px', background: '#C45E0A', marginBottom: '20px' }} />
            <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '26px', fontWeight: 400, color: '#1A1A1A', marginBottom: '28px', lineHeight: 1.4, margin: '0 0 28px 0' }}>
              What do you want to dig into?
            </h2>
            <textarea
              className="cn-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="A chapter, a question, an idea you can't shake..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '16px 18px',
                fontSize: '15px',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#1A1A1A',
                lineHeight: 1.6,
                background: '#FFFFFF',
                border: '1px solid #E4E0DA',
                borderRadius: '4px',
                resize: 'vertical',
                boxSizing: 'border-box',
                marginBottom: '20px',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleStart()
                }
              }}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                className="cn-btn-start"
                onClick={() => handleStart()}
                disabled={loading || !input.trim()}
              >
                {loading ? 'Starting...' : 'Start'}
              </button>
              <button
                className="cn-btn-cancel"
                onClick={() => router.push('/home')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function NewConversationPage() {
  return (
    <Suspense>
      <NewConversationInner />
    </Suspense>
  )
}
