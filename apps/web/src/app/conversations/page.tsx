'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConversationGroupedList from '@/components/ConversationGroupedList'
import { useIsMobile } from '@/hooks/useIsMobile'
import BottomTabBar from '@/components/BottomTabBar'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://roga-api.fly.dev'

type Conversation = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)
      const res = await fetch(`${API_URL}/conversations/${user.id}`)
      const data = await res.json()
      setConversations(data.conversations || [])
      setLoading(false)
    }
    init()
  }, [])

  const resumeConversation = (id: string) => router.push(`/conversation/${id}`)

  const deleteConversation = async (id: string) => {
    await fetch(`${API_URL}/conversation/${id}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== id))
  }

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-canvas)' }}>
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
          background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-light)',
          padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={() => router.push('/home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-secondary)', padding: '4px' }}
          >
            ← Back
          </button>
          <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '17px', color: 'var(--color-text-primary)' }}>
            Past conversations
          </div>
          <div style={{ width: '48px' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '60px', paddingBottom: '80px', padding: '60px 20px 80px' }}>
          {loading ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '24px 0' }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', padding: '24px 0' }}>No conversations yet.</div>
          ) : (
            <ConversationGroupedList
              conversations={conversations}
              onSelect={resumeConversation}
              onDelete={deleteConversation}
            />
          )}
        </div>
        <BottomTabBar />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-canvas)' }}>
      {/* Left Panel */}
      <div className="sidebar-panel" style={{ width: '260px', display: 'flex', flexDirection: 'column', padding: '22px 20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <a href="/home" style={{ fontFamily: 'Georgia, serif', fontSize: '22px', fontWeight: '700', color: 'var(--color-text-on-dark)', textDecoration: 'none' }}>Cephos</a>
        </div>
        <button
          onClick={() => router.push('/home')}
          className="sidebar-nav-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%', marginBottom: '16px' }}
        >
          ← Back to home
        </button>
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          className="sidebar-logout"
        >
          Log out
        </button>
        <a href="/account" className="sidebar-account-link">Account</a>
      </div>

      {/* Main Canvas */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 64px' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: '32px' }}>
          Past conversations
        </h1>
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : conversations.length === 0 ? (
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No conversations yet.</div>
        ) : (
          <ConversationGroupedList
            conversations={conversations}
            onSelect={resumeConversation}
            onDelete={deleteConversation}
          />
        )}
      </div>
    </div>
  )
}
