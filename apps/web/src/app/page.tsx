'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Conversation = {
  id: string
  title: string | null
  created_at: string
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversations/${user.id}`)
      const data = await res.json()
      setConversations(data.conversations || [])
      setLoading(false)
    }
    init()
  }, [])

  const startConversation = (mode: 'intentional' | 'open') => {
    router.push(`/conversation/new?mode=${mode}`)
  }

  const resumeConversation = (id: string) => {
    router.push(`/conversation/${id}`)
  }

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/conversation/${id}`, {
      method: 'DELETE',
    })
    const data = await res.json()
    console.log('Delete response:', res.status, data)
    if (res.ok) {
      setConversations(prev => prev.filter(c => c.id !== id))
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px' }}>Roga</div>

        <button
          onClick={() => startConversation('intentional')}
          style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
        >
          Let's dig into something
        </button>
        <button
          onClick={() => startConversation('open')}
          style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
        >
          Tell me something interesting
        </button>

        <a href="/library" style={{ display: 'block', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0' }}>
          My Library
        </a>

        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>Past conversations</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => resumeConversation(conv.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: '2px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#333' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title || 'Untitled conversation'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>{formatDate(conv.created_at)}</div>
                </div>
                <button
                  onClick={(e) => deleteConversation(e, conv.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '14px', padding: '2px 4px', borderRadius: '4px', flexShrink: 0, lineHeight: 1 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#999')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Good to see you.</div>
          <div style={{ fontSize: '15px' }}>Start a conversation or pick up where you left off.</div>
        </div>
      </div>
    </div>
  )
}
