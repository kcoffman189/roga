'use client'
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export default function ConversationPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const id = params.id as string
      setConversationId(id)
      const res = await fetch(`${API_URL}/conversation/${id}/messages`)
      const data = await res.json()
      setMessages(data.messages || [])
    }
    init()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !userId || !conversationId || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    const res = await fetch(`${API_URL}/conversation/continue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: userMessage,
        user_id: userId,
      }),
    })
    const data = await res.json()
    setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '40px 0' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  {msg.role === 'user' ? 'You' : 'Roga'}
                </div>
                <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#1a1a1a', whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>Roga</div>
                <div style={{ fontSize: '15px', color: '#999' }}>Thinking...</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div style={{ borderTop: '1px solid #e0e0e0', padding: '16px 24px', background: '#fff' }}>
          <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', gap: '8px' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Reply..."
              rows={2}
              style={{ flex: 1, padding: '10px 12px', fontSize: '15px', borderRadius: '8px', border: '1px solid #e0e0e0', resize: 'none', fontFamily: 'sans-serif' }}
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
              style={{ padding: '10px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '8px', background: '#000', color: '#fff', border: 'none', alignSelf: 'flex-end' }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
