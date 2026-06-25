'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Group = {
  id: string
  name: string
  is_paused: boolean
  created_at: string
  updated_at: string
  book_count: number
  last_conversation_at: string | null
}

const formatRelativeDate = (dateStr: string) => {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Last active today'
  if (days === 1) return 'Last active yesterday'
  return `Last active ${days} days ago`
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const [res, profileRes] = await Promise.all([
        fetch(`${API_URL}/groups/${user.id}`),
        supabase.from('user_profiles').select('groups_first_visited_at').eq('id', user.id).single()
      ])
      const data = await res.json()
      setGroups(data.groups || [])
      if (profileRes.data && profileRes.data.groups_first_visited_at === null) {
        fetch(`${API_URL}/groups/first-visit/${user.id}`)
      }
      setLoading(false)
    }
    init()
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--color-bg-canvas)' }}>

      {/* Mobile Header — hidden on desktop */}
      <div
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 10,
          background: 'var(--color-bg-canvas)',
          borderBottom: '1px solid var(--color-border-light)',
          padding: '10px 20px',
          alignItems: 'center',
          gap: '12px',
          minHeight: '56px',
        }}
      >
        <button
          onClick={() => router.push('/home')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '29px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
        >
          Cephos
        </button>
        <div style={{ fontWeight: '600', fontSize: '17px', color: 'var(--color-text-primary)' }}>Groups</div>
      </div>

      {/* Left Panel — desktop only */}
      <div
        style={{
          display: isMobile ? 'none' : 'flex',
          width: '260px',
          flexDirection: 'column',
          padding: '22px 20px',
          background: 'var(--color-bg-sidebar)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: '3px', background: 'var(--color-accent)',
        }} />

        <a href="/home" style={{ display: 'block', cursor: 'pointer', marginBottom: '28px', width: '100%', maxWidth: '330px', marginLeft: '-12px' }}>
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
            <text x="62" y="42" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="#EEECEA">Cephos</text>
            <text x="62" y="63" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">MANY BOOKS. ONE MIND.</text>
          </svg>
        </a>

        <button
          onClick={() => router.push('/home')}
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
          onClick={() => router.push('/home')}
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

        <a href="/groups" style={{
          display: 'block', padding: '7px 2px',
          fontFamily: 'Inter, sans-serif', fontSize: '17px',
          color: '#EEECEA', fontWeight: '500',
          textDecoration: 'none', marginBottom: '4px',
        }}>
          Groups
        </a>

        <a href="/library" style={{
          display: 'block', padding: '7px 2px',
          fontFamily: 'Inter, sans-serif', fontSize: '17px',
          color: '#4E5660', textDecoration: 'none',
        }}>
          My Library
        </a>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', padding: isMobile ? '72px 16px 80px' : '48px 56px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <span style={{ display: 'block', width: '32px', height: '2px', background: 'var(--color-accent)', marginBottom: '16px', border: 'none' }} />
              <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', fontWeight: 400, color: 'var(--color-text-primary)', margin: 0 }}>Groups</h1>
            </div>
            <button
              onClick={() => router.push('/groups/new')}
              style={{
                background: 'var(--color-bg-sidebar)',
                color: 'var(--color-text-on-dark)',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px', fontWeight: '500',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '12px 24px', border: 'none',
                borderRadius: '2px', cursor: 'pointer',
                position: 'relative', marginLeft: 'auto',
                minHeight: '44px',
              }}
            >
              <span style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: '3px', background: 'var(--color-accent)',
                borderRadius: '2px 0 0 2px',
              }} />
              + New Group
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <p style={{ color: 'var(--color-text-tertiary)', fontSize: '14px' }}>Loading...</p>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 48px' }}>
              <span style={{ display: 'block', width: '32px', height: '2px', background: 'var(--color-accent)', margin: '0 auto 20px', border: 'none' }} />
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>No groups yet.</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '0' }}>Create a group to explore a specific set of books together.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  style={{
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: '4px',
                    padding: '20px 24px',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget.querySelector('.card-spine') as HTMLElement).style.background = 'var(--color-accent)'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget.querySelector('.card-spine') as HTMLElement).style.background = 'var(--color-border-light)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <span
                    className="card-spine"
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: '3px', background: 'var(--color-border-light)',
                      borderRadius: '4px 0 0 4px',
                      transition: 'background 200ms ease',
                    }}
                  />
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: '18px', fontWeight: 400, color: 'var(--color-text-primary)', marginBottom: '6px', lineHeight: 1.3 }}>
                    {group.name}
                  </div>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {group.book_count} {group.book_count === 1 ? 'book' : 'books'}
                    </span>
                    <span style={{ color: 'var(--color-border-light)', fontSize: '12px' }}>·</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                      {group.last_conversation_at
                        ? formatRelativeDate(group.last_conversation_at)
                        : 'No conversations yet'}
                    </span>
                  </div>
                  {group.is_paused && (
                    <div style={{ fontSize: '12px', color: '#b8860b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 8px', whiteSpace: 'nowrap', marginTop: '8px', display: 'inline-block' }}>
                      Add a book to resume
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomTabBar />
    </div>
  )
}
