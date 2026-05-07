'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Message = {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

function GroupConversationInner() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = params.id as string
  const conversationId = params.conversation_id as string
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = useRef(createSupabaseClient()).current
  const isStreaming = searchParams.get('streaming') === 'true'
  const hasInitialized = useRef(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    if (hasInitialized.current) return
    hasInitialized.current = true

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      if (isStreaming) {
        streamNewConversation(conversationId, user.id)
      } else {
        const res = await fetch(`${API_URL}/group-conversation/${conversationId}/messages`)
        const data = await res.json()
        setMessages(data.messages || [])
      }
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const streamNewConversation = async (convId: string, uid: string) => {
    const res = await fetch(`${API_URL}/group-conversation/${convId}/messages`)
    const data = await res.json()
    const existingMessages = data.messages || []

    if (existingMessages.length > 0) {
      const filteredMessages = existingMessages.filter(
        (m: Message) => !(m.role === 'user' && m.content.includes('Surface something interesting'))
      )
      setMessages([...filteredMessages, { role: 'assistant', content: '', streaming: true }])
      await streamContinue(convId, uid, null, filteredMessages)
    }
  }

  const streamContinue = async (convId: string, uid: string, userMessage: string | null, existingMessages?: Message[]) => {
    setLoading(true)

    if (userMessage) {
      setMessages(prev => [...prev,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: '', streaming: true }
      ])
    }

    await fetchEventSource(`${API_URL}/group-conversation/continue/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: convId,
        message: userMessage || '__stream_existing__',
        user_id: uid,
      }),
      onmessage(ev) {
        try {
          const data = JSON.parse(ev.data)
          if (data.type === 'text') {
            setMessages(prev => {
              const updated = [...prev]
              const lastMsg = updated[updated.length - 1]
              if (lastMsg?.streaming) {
                updated[updated.length - 1] = { ...lastMsg, content: lastMsg.content + data.text }
              }
              return updated
            })
          } else if (data.type === 'done') {
            setMessages(prev => {
              const updated = [...prev]
              const lastMsg = updated[updated.length - 1]
              if (lastMsg?.streaming) {
                updated[updated.length - 1] = { ...lastMsg, streaming: false }
              }
              return updated
            })
          }
        } catch {}
      },
      onerror(err) {
        throw err
      },
      openWhenHidden: true,
    })
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !userId || loading) return
    const userMessage = input.trim()
    setInput('')
    await streamContinue(conversationId, userId, userMessage)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    await fetch(`${API_URL}/group-conversation/${conversationId}`, { method: 'DELETE' })
    router.push(`/groups/${groupId}`)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--color-bg-canvas)' }}>

      {/* Mobile Header */}
      <div style={{
        display: isMobile ? 'flex' : 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-bg-canvas)',
        borderBottom: '1px solid var(--color-border-light)',
        alignItems: 'center', height: '52px', padding: '0 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.push(`/groups/${groupId}`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '29px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
        >
          Roga
        </button>
      </div>

      {/* Desktop Left Panel */}
      <div style={{
        display: isMobile ? 'none' : 'flex',
        width: '260px', flexDirection: 'column',
        padding: '22px 20px',
        background: 'var(--color-bg-sidebar)',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: 'var(--color-accent)' }} />

        <div style={{ display: 'block', marginBottom: '28px', width: '100%', maxWidth: '330px', marginLeft: '-12px' }}>
          <svg width="300" height="auto" viewBox="0 0 290 76" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(14, 2)">
              <g transform="rotate(-30 24 24)">
                <line x1="14" y1="33" x2="36" y2="12" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="12" x2="36" y2="36" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                <line x1="12" y1="12" x2="36" y2="12" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                <line x1="36" y1="12" x2="36" y2="36" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="4" fill="#C45E0A"/>
                <circle cx="36" cy="12" r="4" fill="#C45E0A"/>
                <circle cx="14" cy="33" r="5" fill="#C45E0A"/>
                <circle cx="36" cy="36" r="4" fill="#C45E0A"/>
              </g>
            </g>
            <text x="62" y="42" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="#EEECEA">Roga</text>
            <text x="62" y="63" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">YOUR LIBRARY. MORE CONNECTED.</text>
          </svg>
        </div>

        <button
          onClick={() => router.push(`/groups/${groupId}/conversation/new?mode=intentional`)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 14px', marginBottom: '9px',
            background: 'transparent', border: 'none',
            borderLeft: '3px solid var(--color-accent)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '19.5px', color: '#B8C0C8',
            cursor: 'pointer', minHeight: '44px',
          }}
        >
          Let&apos;s dig into something
        </button>

        <button
          onClick={() => router.push(`/groups/${groupId}/conversation/new?mode=open`)}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 14px', marginBottom: '24px',
            background: 'transparent', border: 'none',
            borderLeft: '1px solid var(--color-border-dark)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '19.5px', color: '#3E4650',
            cursor: 'pointer', minHeight: '44px',
          }}
        >
          Tell me something interesting
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleDelete}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'left', padding: '8px 4px',
            fontSize: '12px', color: 'var(--color-text-muted-dark)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#e57373')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-muted-dark)')}
        >
          Delete conversation
        </button>
      </div>

      {/* Conversation Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: isMobile ? '56px' : '40px', paddingBottom: '40px' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 0' }}>
            {messages
              .filter((msg, index) => {
                if (msg.content === '__stream_existing__') return false
                if (msg.role === 'user' && index === 0) return false
                return true
              })
              .map((msg, i) => (
                <div key={i} style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    {msg.role === 'user' ? 'You' : 'Roga'}
                  </div>
                  <div style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--color-text-primary)', whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                    {msg.streaming && <span style={{ opacity: 0.5 }}>▊</span>}
                  </div>
                </div>
              ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Roga</div>
                <div style={{ fontSize: '15px', color: 'var(--color-text-tertiary)' }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid var(--color-border-light)', padding: '12px 16px', background: 'var(--color-bg-canvas)', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Reply..."
              rows={3}
              style={{
                flex: 1, padding: '10px 12px',
                fontSize: '15px',
                fontFamily: 'Inter, system-ui, sans-serif',
                color: 'var(--color-text-primary)',
                borderRadius: '4px',
                border: '1px solid var(--color-border-light)',
                background: 'var(--color-bg-surface)',
                resize: 'none', outline: 'none',
                lineHeight: 1.5,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 20px',
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                borderRadius: '2px',
                background: 'var(--color-bg-sidebar)',
                color: 'var(--color-text-on-dark)',
                border: 'none', alignSelf: 'flex-end',
                minHeight: '44px', opacity: loading || !input.trim() ? 0.5 : 1,
                position: 'relative',
              }}
            >
              <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: 'var(--color-accent)', borderRadius: '2px 0 0 2px' }} />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GroupConversationPage() {
  return (
    <Suspense>
      <GroupConversationInner />
    </Suspense>
  )
}
