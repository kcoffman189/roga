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

function ConversationInner() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
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
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUserId(user.id)
      const id = params.id as string
      setConversationId(id)

      if (isStreaming) {
        streamNewConversation(id, user.id)
      } else {
        const res = await fetch(`${API_URL}/conversation/${id}/messages`)
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
    const res = await fetch(`${API_URL}/conversation/${convId}/messages`)
    const data = await res.json()
    const existingMessages = data.messages || []

    if (existingMessages.length > 0) {
      const userMsg = existingMessages[existingMessages.length - 1]
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

    await fetchEventSource(`${API_URL}/conversation/continue/stream`, {
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
    if (!input.trim() || !userId || !conversationId || loading) return
    const userMessage = input.trim()
    setInput('')
    await streamContinue(conversationId, userId, userMessage)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    await fetch(`${API_URL}/conversation/${params.id}`, { method: 'DELETE' })
    router.push('/')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>

      {/* Mobile Header — hidden on desktop */}
      <div
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          alignItems: 'center',
          padding: '0 16px',
          height: '52px',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '18px', color: '#1a1a1a', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
        >
          Roga
        </button>
      </div>

      {/* Left Panel — desktop only */}
      <div
        style={{ display: isMobile ? 'none' : 'flex', width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', flexDirection: 'column', padding: '24px 16px' }}
      >
        <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>Roga</div>
        <button onClick={() => router.push('/conversation/new?mode=intentional')} style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Let's dig into something
        </button>
        <button onClick={() => router.push('/conversation/new?mode=open')} style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Tell me something interesting
        </button>
        <a href="/library" style={{ display: 'block', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0' }}>
          My Library
        </a>
      </div>

      {/* Conversation Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: isMobile ? '56px' : '40px', paddingBottom: '40px' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '24px 16px 0' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  {msg.role === 'user' ? 'You' : 'Roga'}
                </div>
                <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                  {msg.streaming && <span style={{ opacity: 0.5 }}>▊</span>}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.content === '' && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Roga</div>
                <div style={{ fontSize: '15px', color: '#999' }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid #e0e0e0', padding: '12px 16px', background: '#fff', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Reply..."
              rows={3}
              style={{ flex: 1, padding: '10px 12px', fontSize: '16px', borderRadius: '8px', border: '1px solid #e0e0e0', resize: 'none', fontFamily: 'sans-serif' }}
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
              style={{ padding: '10px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', background: '#000', color: '#fff', border: 'none', alignSelf: 'flex-end', minHeight: '44px' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ConversationPage() {
  return (
    <Suspense>
      <ConversationInner />
    </Suspense>
  )
}
