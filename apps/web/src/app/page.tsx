'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingBubbles from '@/components/OnboardingBubbles'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Conversation = {
  id: string
  title: string | null
  created_at: string
}

type WelcomeQuote = {
  quote: string | null
  book: string | null
  empty_library: boolean
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [welcome, setWelcome] = useState<WelcomeQuote | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const libraryRef = useRef<HTMLAnchorElement>(null)
  const digInRef = useRef<HTMLButtonElement>(null)
  const interestingRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUserId(user.id)

      // Fetch conversations and welcome quote in parallel
      const [convsRes, quoteRes] = await Promise.all([
        fetch(`${API_URL}/conversations/${user.id}`),
        fetch(`${API_URL}/welcome-quote/${user.id}`)
      ])

      const convsData = await convsRes.json()
      const quoteData = await quoteRes.json()

      setConversations(convsData.conversations || [])
      setWelcome(quoteData)
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
    await fetch(`${API_URL}/conversation/${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const renderWelcome = () => {
    if (loading) return null

    if (welcome?.empty_library) {
      return (
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <p style={{ fontSize: '15px', color: '#999', lineHeight: '1.6' }}>
            Add some books to your library and Roga will have something to think about.
          </p>
          <a href="/library" style={{ display: 'inline-block', marginTop: '16px', fontSize: '14px', color: '#333', textDecoration: 'underline' }}>
            Go to My Library
          </a>
        </div>
      )
    }

    if (welcome?.quote && welcome?.book) {
      return (
        <div style={{ textAlign: 'center', maxWidth: '520px' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.7', color: '#1a1a1a', fontStyle: 'italic', marginBottom: '12px' }}>
            &ldquo;{welcome.quote}&rdquo;
          </p>
          <p style={{ fontSize: '13px', color: '#999', letterSpacing: '0.02em' }}>
            {welcome.book}
          </p>
        </div>
      )
    }

    return (
      <div style={{ textAlign: 'center', color: '#999' }}>
        <div style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>Good to see you.</div>
        <div style={{ fontSize: '15px' }}>Start a conversation or pick up where you left off.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px' }}>Roga</div>

        <button
          ref={digInRef}
          onClick={() => startConversation('intentional')}
          style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
        >
          Let's dig into something
        </button>
        <button
          ref={interestingRef}
          onClick={() => startConversation('open')}
          style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}
        >
          Tell me something interesting
        </button>

        <a ref={libraryRef} href="/library" style={{ display: 'block', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0' }}>
          My Library
        </a>

        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>Past conversations</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>Your conversations will appear here.</div>
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

        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px 12px', marginTop: '8px', fontSize: '13px', color: '#999', borderRadius: '6px', width: '100%' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#555')}
          onMouseLeave={e => (e.currentTarget.style.color = '#999')}
        >
          Log out
        </button>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        {renderWelcome()}
      </div>

      {userId && (
        <OnboardingBubbles
          userId={userId}
          supabase={supabase}
          libraryRef={libraryRef}
          digInRef={digInRef}
          interestingRef={interestingRef}
        />
      )}
    </div>
  )
}
