'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingBubbles from '@/components/OnboardingBubbles'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'

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
  const supabase = useRef(createSupabaseClient()).current
  const libraryRef = useRef<HTMLAnchorElement>(null)
  const digInRef = useRef<HTMLButtonElement>(null)
  const interestingRef = useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

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

  const startConversation = (mode: 'intentional' | 'open') => router.push(`/conversation/new?mode=${mode}`)
  const resumeConversation = (id: string) => router.push(`/conversation/${id}`)

  const deleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await fetch(`${API_URL}/conversation/${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const renderWelcome = () => {
    if (loading) return null
    if (welcome?.empty_library) {
      return (
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Add some books to your library and Roga will have something to think about.
          </p>
          <a href="/library" style={{ display: 'inline-block', marginTop: '16px', fontSize: '14px', color: 'var(--color-accent)', textDecoration: 'underline' }}>
            Go to My Library
          </a>
        </div>
      )
    }
    if (welcome?.quote && welcome?.book) {
      return (
        <div style={{ textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontStyle: 'italic', fontSize: '21px', lineHeight: '1.65', color: 'rgba(28, 25, 23, 0.82)', textAlign: 'center', margin: '0 0 20px 0' }}>
            &ldquo;{welcome.quote}&rdquo;
          </p>
          <div>
            <hr style={{ width: '32px', height: '1px', backgroundColor: 'var(--color-border)', border: 'none', margin: '0 auto 16px' }} />
            <p style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif', fontSize: '12px', fontWeight: '500', letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', textAlign: 'center', margin: 0 }}>{welcome.book}</p>
          </div>
        </div>
      )
    }
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontSize: '22px', fontWeight: '500', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Good to see you.</div>
        <div style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Start a conversation or pick up where you left off.</div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-primary)' }}>
        {/* Mobile Header */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-border)',
          padding: '10px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontWeight: '500', fontSize: '22px', lineHeight: 1, color: 'var(--color-text-primary)' }}>Roga</div>
            <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-tertiary)', marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Beta</div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-tertiary)', padding: '4px', minHeight: '44px' }}
          >
            Log out
          </button>
        </div>

        {/* Mobile Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingTop: '84px', paddingBottom: '80px' }}>
          <div style={{ marginBottom: '24px' }}>{renderWelcome()}</div>
          <button
            onClick={() => startConversation('intentional')}
            className="sidebar-btn"
            style={{ padding: '14px 16px', marginBottom: '8px', minHeight: '44px', fontSize: '15px' }}
          >
            Let&apos;s dig into something
          </button>
          <button
            onClick={() => startConversation('open')}
            className="sidebar-btn"
            style={{ padding: '14px 16px', marginBottom: '32px', minHeight: '44px', fontSize: '15px' }}
          >
            Tell me something interesting
          </button>

          <div id="mobile-conversations">
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: '12px' }}>
              Past conversations
            </div>
            {loading ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Your conversations will appear here.</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => resumeConversation(conv.id)}
                  className="conv-item"
                  style={{ padding: '12px 4px', marginBottom: '4px', minHeight: '56px' }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <div className="conv-item-title" style={{ fontSize: '14px' }}>
                      {conv.title || 'Untitled conversation'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{formatDate(conv.created_at)}</div>
                  </div>
                  <button
                    onClick={(e) => deleteConversation(e, conv.id)}
                    className="conv-item-delete"
                    style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <BottomTabBar />
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-primary)' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid var(--color-border)', background: 'var(--color-bg-sidebar)', display: 'flex', flexDirection: 'column', padding: '20px 24px' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--font-lora), Georgia, serif', fontWeight: '500', fontSize: '22px', color: 'var(--color-text-primary)' }}>Roga</div>
          <div style={{ fontSize: '11px', fontWeight: '500', color: 'var(--color-text-tertiary)', marginTop: '4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Beta</div>
        </div>

        <button
          ref={digInRef}
          onClick={() => startConversation('intentional')}
          className="sidebar-btn"
          style={{ marginBottom: '8px' }}
        >
          Let&apos;s dig into something
        </button>
        <button
          ref={interestingRef}
          onClick={() => startConversation('open')}
          className="sidebar-btn"
        >
          Tell me something interesting
        </button>

        <a href="/groups" className="sidebar-nav-link" style={{ marginTop: '24px', marginBottom: '4px' }}>
          Groups
        </a>
        <a ref={libraryRef} href="/library" className="sidebar-nav-link">
          My Library
        </a>

        <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.10em', marginTop: '28px', marginBottom: '12px' }}>Past conversations</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', padding: '4px' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)', padding: '4px' }}>Your conversations will appear here.</div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => resumeConversation(conv.id)}
                className="conv-item"
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div className="conv-item-title">
                    {conv.title || 'Untitled conversation'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{formatDate(conv.created_at)}</div>
                </div>
                <button
                  onClick={(e) => deleteConversation(e, conv.id)}
                  className="conv-item-delete"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '8px 12px', marginTop: '8px', fontSize: '13px', color: 'var(--color-text-tertiary)', borderRadius: '6px', width: '100%' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-tertiary)')}
        >
          Log out
        </button>
      </div>

      {/* Main Area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', background: 'var(--color-bg-primary)' }}>
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
