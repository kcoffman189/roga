'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, Users, MessageSquare, User } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useRef, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Tab = {
  label: string
  icon: React.ElementType
  href?: string
  matchPrefix?: string
  action?: 'feedback'
}

const tabs: Tab[] = [
  { label: 'Home', icon: Home, href: '/home' },
  { label: 'Groups', icon: Users, href: '/groups', matchPrefix: '/groups' },
  { label: 'Library', icon: BookOpen, href: '/library', matchPrefix: '/library' },
  { label: 'Feedback', icon: MessageSquare, action: 'feedback' },
  { label: 'Account', icon: User, href: '/account', matchPrefix: '/account' },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const supabase = useRef(createSupabaseClient()).current

  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  if (!isMobile) return null

  const isActive = (tab: Tab) => {
    if (tab.action) return false
    if (tab.matchPrefix) return pathname.startsWith(tab.matchPrefix)
    return pathname === tab.href
  }

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

  return (
    <>
      {showFeedback && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowFeedback(false); setFeedbackText(''); setFeedbackStatus('idle') } }}
        >
          <div
            style={{
              background: '#FAF8F4',
              width: '100%',
              borderRadius: '16px 16px 0 0',
              padding: '24px 20px calc(20px + env(safe-area-inset-bottom))',
            }}
          >
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

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#fff',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'stretch',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabs.map((tab) => {
          const active = isActive(tab)
          const Icon = tab.icon
          return (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.action === 'feedback') {
                  setShowFeedback(true)
                } else if (tab.href) {
                  router.push(tab.href)
                }
              }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? '#1a1a1a' : '#bbb',
                fontSize: '10px',
                fontFamily: 'sans-serif',
                minHeight: '56px',
                paddingTop: '8px',
                paddingBottom: '8px',
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span style={{ fontWeight: active ? '600' : '400' }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
