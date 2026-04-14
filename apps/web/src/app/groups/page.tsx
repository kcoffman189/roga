'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      const res = await fetch(`${API_URL}/groups/${user.id}`)
      const data = await res.json()
      setGroups(data.groups || [])
      setLoading(false)
    }
    init()
  }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}>
        <div
          style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px', cursor: 'pointer' }}
          onClick={() => router.push('/')}
        >
          Roga
        </div>
        <a href="/" style={{ display: 'block', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0' }}>
          Let's dig into something
        </a>
        <a href="/" style={{ display: 'block', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0' }}>
          Tell me something interesting
        </a>
        <a href="/groups" style={{ display: 'block', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0', background: '#f5f5f5', fontWeight: '500' }}>
          Groups
        </a>
        <a href="/library" style={{ display: 'block', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0' }}>
          My Library
        </a>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 40px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Groups</h1>
            <button
              onClick={() => router.push('/groups/new')}
              style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
            >
              + New Group
            </button>
          </div>

          {loading ? (
            <p style={{ color: '#999', fontSize: '14px' }}>Loading...</p>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ color: '#999', fontSize: '15px', lineHeight: '1.6', marginBottom: '20px' }}>
                You don't have any groups yet. Create one to start a focused conversation.
              </p>
              <button
                onClick={() => router.push('/groups/new')}
                style={{ padding: '10px 24px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
              >
                + New Group
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => router.push(`/groups/${group.id}`)}
                  style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '18px 20px', background: '#fff', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontWeight: '500', fontSize: '15px', marginBottom: '4px' }}>{group.name}</div>
                      <div style={{ fontSize: '13px', color: '#999' }}>
                        {group.book_count} {group.book_count === 1 ? 'book' : 'books'}
                        <span style={{ margin: '0 8px', color: '#ddd' }}>·</span>
                        {group.last_conversation_at
                          ? formatRelativeDate(group.last_conversation_at)
                          : 'No conversations yet'}
                      </div>
                    </div>
                    {group.is_paused && (
                      <div style={{ fontSize: '12px', color: '#b8860b', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', padding: '3px 8px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                        Add a book to resume
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
