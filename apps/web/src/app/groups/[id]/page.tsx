'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

type Group = {
  id: string
  name: string
  is_paused: boolean
  book_count: number
  created_at: string
  updated_at: string
  last_conversation_at: string | null
}

type GroupConversation = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export default function GroupViewPage() {
  const [group, setGroup] = useState<Group | null>(null)
  const [conversations, setConversations] = useState<GroupConversation[]>([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const supabase = useRef(createSupabaseClient()).current

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const [groupsRes, convsRes] = await Promise.all([
        fetch(`${API_URL}/groups/${user.id}`),
        fetch(`${API_URL}/group-conversations/${groupId}`)
      ])

      const groupsData = await groupsRes.json()
      const convsData = await convsRes.json()

      const found = (groupsData.groups || []).find((g: Group) => g.id === groupId) || null
      setGroup(found)
      setConversations(convsData.conversations || [])
      setLoading(false)
    }
    init()
  }, [])

  const deleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation()
    await fetch(`${API_URL}/group-conversation/${convId}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== convId))
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (loading) return null

  const paused = group?.is_paused ?? false

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
        <div
          style={{ fontWeight: '700', fontSize: '18px', marginBottom: '24px', paddingLeft: '8px', cursor: 'pointer' }}
          onClick={() => router.push('/groups')}
        >
          Roga
        </div>

        {/* Group name + edit icon */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px', marginBottom: '16px', cursor: 'pointer' }}
          onClick={() => router.push(`/groups/${groupId}/edit`)}
        >
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
            {group?.name ?? 'Group'}
          </span>
          <span style={{ fontSize: '12px', color: '#ccc' }}>✎</span>
        </div>

        {/* Paused banner */}
        {paused && (
          <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
            This group is paused. Add at least 2 books to start new conversations.
          </div>
        )}

        <button
          onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=intentional`) }}
          disabled={paused}
          style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '14px', cursor: paused ? 'not-allowed' : 'pointer', color: paused ? '#bbb' : '#333' }}
        >
          Let's dig into something
        </button>
        <button
          onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=open`) }}
          disabled={paused}
          style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '14px', cursor: paused ? 'not-allowed' : 'pointer', color: paused ? '#bbb' : '#333' }}
        >
          Tell me something interesting
        </button>

        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
          Past conversations
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>Your conversations will appear here.</div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => router.push(`/groups/${groupId}/conversation/${conv.id}`)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', marginBottom: '2px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', color: '#333' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                  <div style={{ fontWeight: '500', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {conv.title || 'Untitled conversation'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#999' }}>{formatDate(conv.updated_at)}</div>
                </div>
                <button
                  onClick={e => deleteConversation(e, conv.id)}
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '15px' }}>
            {paused
              ? 'Add more books to this group to resume conversations.'
              : 'Start a conversation or pick up where you left off.'}
          </div>
        </div>
      </div>
    </div>
  )
}
