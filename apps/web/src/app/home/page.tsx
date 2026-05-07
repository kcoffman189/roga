// force redeploy
'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import OnboardingBubbles from '@/components/OnboardingBubbles'
import GroupsIntroCard from '@/components/GroupsIntroCard'
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
  const [showGroupsIntroCard, setShowGroupsIntroCard] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const libraryRef = useRef<HTMLAnchorElement>(null)
  const digInRef = useRef<HTMLButtonElement>(null)
  const interestingRef = useRef<HTMLButtonElement>(null)
  const groupsButtonRef = useRef<HTMLButtonElement>(null)
  const isMobile = useIsMobile()

  const handleFeedbackSubmit = async () => {
    if (feedbackText.trim().length < 10) return
    setFeedbackStatus('submitting')
    const { data: { user } } = await supabase.auth.getUser()
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText.trim(), user_email: user?.email ?? 'Unknown' }),
      })
      const json = await res.json()
      if (json.success) {
        setFeedbackStatus('success')
        setTimeout(() => {
          setShowFeedback(false)
          setFeedbackText('')
          setFeedbackStatus('idle')
        }, 2000)
      } else {
        setFeedbackStatus('error')
      }
    } catch {
      setFeedbackStatus('error')
    }
  }

  const handleOnboardingComplete = async () => {
    if (!userId) return
    const { data } = await supabase
      .from('user_profiles')
      .select('groups_intro_card_seen')
      .eq('id', userId)
      .single()
    if (data && data.groups_intro_card_seen === false) {
      setShowGroupsIntroCard(true)
    }
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const [convsRes, quoteRes, profileRes] = await Promise.all([
        fetch(`${API_URL}/conversations/${user.id}`),
        fetch(`${API_URL}/welcome-quote/${user.id}`),
        supabase.from('user_profiles').select('groups_intro_card_seen').eq('id', user.id).single()
      ])
      const convsData = await convsRes.json()
      const quoteData = await quoteRes.json()
      setConversations(convsData.conversations || [])
      setWelcome(quoteData)
      if (profileRes.data && profileRes.data.groups_intro_card_seen === false) {
        setShowGroupsIntroCard(true)
      }
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
          <div style={{ display: 'block', width: '100%', maxWidth: '270px', marginLeft: '-12px' }}>
            <svg width="100%" height="auto" viewBox="0 0 290 76" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              <text x="62" y="42" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="#1A1A1A">Roga</text>
              <text x="62" y="57" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">YOUR LIBRARY. MORE CONNECTED.</text>
            </svg>
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
        <div style={{ display: 'block', marginBottom: '24px', width: '100%', maxWidth: '330px', marginLeft: '-12px' }}>
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
            <text x="62" y="57" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">YOUR LIBRARY. MORE CONNECTED.</text>
          </svg>
        </div>

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
          ref={groupsButtonRef}
          onClick={() => router.push('/groups')}
          className="sidebar-cta-secondary"
          style={showGroupsIntroCard ? { outline: '2px solid #c8a96e', outlineOffset: '2px' } : undefined}
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
        <button
          onClick={() => setShowFeedback(true)}
          className="sidebar-account-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
        >
          Send feedback
        </button>
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
          onComplete={handleOnboardingComplete}
        />
      )}
      {showGroupsIntroCard && userId && (
        <GroupsIntroCard
          groupsButtonRef={groupsButtonRef}
          supabase={supabase}
          userId={userId}
          onDismiss={() => setShowGroupsIntroCard(false)}
        />
      )}

      {showFeedback && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowFeedback(false); setFeedbackText(''); setFeedbackStatus('idle') } }}
        >
          <div style={{ background: '#FAF8F4', borderRadius: '6px', padding: '28px 28px 24px', width: '420px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '20px', color: '#1A1A1A' }}>
                Send feedback
              </div>
              <button
                onClick={() => { setShowFeedback(false); setFeedbackText(''); setFeedbackStatus('idle') }}
                style={{ background: 'none', border: 'none', fontSize: '22px', color: '#6B6B6B', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {feedbackStatus === 'success' ? (
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#6B6B6B', textAlign: 'center', padding: '24px 0' }}>
                Thanks — feedback sent.
              </p>
            ) : (
              <>
                <textarea
                  rows={4}
                  placeholder="What's on your mind?"
                  value={feedbackText}
                  onChange={(e) => { setFeedbackText(e.target.value); if (feedbackStatus === 'error') setFeedbackStatus('idle') }}
                  style={{
                    width: '100%',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '14px',
                    color: '#1A1A1A',
                    background: '#FFFFFF',
                    border: '1px solid #E4E0DA',
                    borderRadius: '4px',
                    padding: '10px 12px',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />
                {feedbackStatus === 'error' && (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#C45E0A', marginBottom: '8px', marginTop: 0 }}>
                    Something went wrong. Please try again.
                  </p>
                )}
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackText.trim().length < 10 || feedbackStatus === 'submitting'}
                  style={{
                    width: '100%',
                    background: feedbackText.trim().length < 10 ? '#E4E0DA' : '#272C32',
                    color: feedbackText.trim().length < 10 ? '#B0ACA6' : '#EEECEA',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '13px 24px',
                    border: 'none',
                    borderRadius: '2px',
                    cursor: feedbackText.trim().length < 10 ? 'default' : 'pointer',
                    position: 'relative',
                    boxSizing: 'border-box',
                  }}
                >
                  {feedbackText.trim().length >= 10 && (
                    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#C45E0A' }} />
                  )}
                  {feedbackStatus === 'submitting' ? 'Sending...' : 'Send'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
