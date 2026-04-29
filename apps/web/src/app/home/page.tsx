// force redeploy
'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingBubbles from '@/components/OnboardingBubbles'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'
import ConversationGroupedList from '@/components/ConversationGroupedList'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Conversation = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

type WelcomeQuote = {
  quote: string | null
  author: string | null
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

  const deleteConversation = async (id: string) => {
    await fetch(`${API_URL}/conversation/${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  const renderWelcome = () => {
    if (loading) return null
    if (welcome?.empty_library) {
      return (
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '48px' }}>
          <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Add some books to your library and Roga will have something to think about.
          </p>
          <a href="/library" style={{ display: 'inline-block', marginTop: '16px', fontSize: '14px', color: 'var(--color-accent)', textDecoration: 'underline' }}>
            Go to My Library
          </a>
        </div>
      )
    }
    if (welcome?.quote) {
      return (
        <div style={{ textAlign: 'center', maxWidth: '400px', margin: '0 auto', padding: '48px' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '21px', lineHeight: '1.68', color: 'var(--color-text-primary)', textAlign: 'center', margin: 0 }}>
            &ldquo;{welcome.quote}&rdquo;
          </p>
          {welcome.author && (
            <>
              <hr style={{ width: '44px', height: '2px', backgroundColor: 'var(--color-accent)', border: 'none', display: 'block', margin: '22px auto 14px' }} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-tertiary)', textAlign: 'center', margin: 0 }}>{welcome.author}</p>
            </>
          )}
        </div>
      )
    }
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '400', color: 'var(--color-text-primary)', marginBottom: '8px' }}>Good to see you.</div>
        <div style={{ fontSize: '15px', color: 'var(--color-text-secondary)' }}>Start a conversation or pick up where you left off.</div>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg-canvas)' }}>
        {/* Mobile Header */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-light)',
          padding: '10px 20px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '29px', letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--color-text-primary)' }}>Roga</div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginTop: '5px' }}>Beta</div>
          </div>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--color-text-tertiary)', padding: '4px', minHeight: '44px' }}
          >
            Log out
          </button>
        </div>

        {/* Mobile Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', paddingTop: '84px', paddingBottom: '80px' }}>
          <div style={{ marginBottom: '24px' }}>{renderWelcome()}</div>
          <button
            onClick={() => startConversation('intentional')}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: '9px', background: 'transparent', border: 'none', borderLeft: '3px solid var(--color-accent)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: 'var(--color-text-primary)', cursor: 'pointer', minHeight: '44px' }}
          >
            Let&apos;s dig into something
          </button>
          <button
            onClick={() => startConversation('open')}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: '9px', background: 'transparent', border: 'none', borderLeft: '1px solid var(--color-border-light)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: 'var(--color-text-secondary)', cursor: 'pointer', minHeight: '44px' }}
          >
            Tell me something interesting
          </button>
          <button
            onClick={() => router.push('/groups')}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: '32px', background: 'transparent', border: 'none', borderLeft: '1px solid var(--color-border-light)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px', color: 'var(--color-text-secondary)', cursor: 'pointer', minHeight: '44px' }}
          >
            Groups
          </button>

          <div id="mobile-conversations">
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '9px', borderTop: '1px solid var(--color-border-light)', paddingTop: '13px', marginTop: '20px' }}>
              Past conversations
            </div>
            {loading ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Your conversations will appear here.</div>
            ) : (
              <ConversationGroupedList
                conversations={conversations}
                onSelect={resumeConversation}
                onDelete={deleteConversation}
              />
            )}
          </div>
        </div>

        <BottomTabBar />
      </div>
    )
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-canvas)' }}>
      {/* Left Panel */}
      <div className="sidebar-panel" style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '22px 20px' }}>
        <div style={{ fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '58px', letterSpacing: '-0.02em', color: 'var(--color-text-on-dark)', lineHeight: 1 }}>Roga</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-subtle-dark)', marginTop: '5px', marginBottom: '28px' }}>Beta</div>

        <button
          ref={digInRef}
          onClick={() => startConversation('intentional')}
          className="sidebar-cta-primary"
        >
          Let&apos;s dig into something
        </button>
        <button
          ref={interestingRef}
          onClick={() => startConversation('open')}
          className="sidebar-cta-secondary"
        >
          Tell me something interesting
        </button>
        <button
          onClick={() => router.push('/groups')}
          className="sidebar-cta-secondary"
        >
          Groups
        </button>

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-dark)', margin: '16px 0' }} />
        <a ref={libraryRef} href="/library" className="sidebar-nav-link">
          My Library
        </a>

        <div className="sidebar-section-label">Past conversations</div>
        <div className="conv-list-scroll" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted-dark)', padding: '4px 2px' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ fontSize: '11.5px', color: 'var(--color-text-muted-dark)', padding: '4px 2px' }}>Your conversations will appear here.</div>
          ) : (
            <ConversationGroupedList
              conversations={conversations}
              onSelect={resumeConversation}
              onDelete={deleteConversation}
            />
          )}
        </div>

        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          className="sidebar-logout"
        >
          Log out
        </button>
        <a href="/account" className="sidebar-account-link">Account</a>
      </div>

      {/* Main Canvas */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-canvas)' }}>
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
