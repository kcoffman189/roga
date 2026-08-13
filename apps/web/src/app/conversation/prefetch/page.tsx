'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function PrefetchConversationPage() {
  const [content, setContent] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const prefetch = sessionStorage.getItem('tmsi_prefetch')
      sessionStorage.removeItem('tmsi_prefetch')

      if (!prefetch) {
        router.push('/conversation/new?mode=open')
        return
      }

      setContent(prefetch)
      setSaving(true)

      // Save to DB as a real conversation
      const ctrl = new AbortController()
      await fetchEventSource(`${API_URL}/conversation/start/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'open',
          user_id: user.id,
          prefetch_content: prefetch,
        }),
        signal: ctrl.signal,
        onmessage(ev) {
          try {
            const data = JSON.parse(ev.data)
            if (data.type === 'conversation_id') {
              ctrl.abort()
              setConversationId(data.conversation_id)
              setSaving(false)
            }
          } catch {}
        },
        onerror(err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
          setSaving(false)
          throw err
        },
        openWhenHidden: true,
      })
    }
    init()
  }, [])

  const handleContinue = () => {
    if (conversationId) {
      router.push(`/conversation/${conversationId}`)
    }
  }

  if (!content) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF8F4' }}>
        <div style={{ color: '#6B6B6B', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', fontStyle: 'italic' }}>Finding connections in your library...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#FAF8F4', flexDirection: isMobile ? 'column' : 'row' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 32px' }}>
        <div style={{ maxWidth: '640px', width: '100%' }}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: isMobile ? '17px' : '19px',
            lineHeight: '1.75',
            color: '#1A1A1A',
            marginBottom: '32px',
            whiteSpace: 'pre-wrap',
          }}>
            {content}
          </div>
          <hr style={{ width: '44px', height: '2px', background: '#C45E0A', border: 'none', marginBottom: '24px', display: 'block', marginLeft: 0 }} />
          <button
            onClick={handleContinue}
            disabled={saving || !conversationId}
            style={{
              background: conversationId ? '#272C32' : '#E4E0DA',
              color: conversationId ? '#EEECEA' : '#B0ACA6',
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '13px 24px',
              border: 'none',
              borderRadius: '2px',
              cursor: conversationId ? 'pointer' : 'default',
              position: 'relative',
              transition: 'background 150ms ease',
            }}
          >
            {conversationId && <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#C45E0A' }} />}
            {saving ? 'Preparing...' : 'Continue this conversation'}
          </button>
          <button
            onClick={() => router.push('/home')}
            style={{
              background: 'transparent',
              color: '#6B6B6B',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              border: 'none',
              padding: '12px 0',
              cursor: 'pointer',
              display: 'block',
              marginTop: '12px',
            }}
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  )
}