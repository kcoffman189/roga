'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const FAMILIARITY_LABELS: Record<string, string> = {
  currently_reading: 'Currently reading',
  read_recently: 'Read it — recently',
  read_long_ago: 'Read it — a while ago',
  partially_read: 'Partially read / dipped in',
  want_to_read: 'Want to read',
}

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

type BookEntry = {
  id: string
  title: string
  familiarity_state: string
}

export default function GroupViewPage() {
  const [group, setGroup] = useState<Group | null>(null)
  const [conversations, setConversations] = useState<GroupConversation[]>([])
  const [groupBooks, setGroupBooks] = useState<BookEntry[]>([])
  const [availableBooks, setAvailableBooks] = useState<BookEntry[]>([])
  const [showBookPicker, setShowBookPicker] = useState(false)
  const [addingBook, setAddingBook] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setUserId(user.id)

      const [groupsRes, convsRes] = await Promise.all([
        fetch(`${API_URL}/groups/${user.id}`),
        fetch(`${API_URL}/group-conversations/${groupId}`)
      ])

      const groupsData = await groupsRes.json()
      const convsData = await convsRes.json()

      const found = (groupsData.groups || []).find((g: Group) => g.id === groupId) || null
      setGroup(found)
      setConversations(convsData.conversations || [])

      await fetchGroupBooks()
      setLoading(false)
    }
    init()
  }, [])

  const fetchGroupBooks = async () => {
    const { data: gbRows } = await supabase
      .from('group_books')
      .select('library_entry_id')
      .eq('group_id', groupId)

    if (!gbRows || gbRows.length === 0) {
      setGroupBooks([])
      return
    }

    const ids = gbRows.map((r: any) => r.library_entry_id)
    const { data: entries } = await supabase
      .from('library_entries')
      .select('id, title, familiarity_state')
      .in('id', ids)

    setGroupBooks(entries || [])
  }

  const openBookPicker = async () => {
    if (!userId) return
    const { data: allEntries } = await supabase
      .from('library_entries')
      .select('id, title, familiarity_state')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const groupBookIds = new Set(groupBooks.map(b => b.id))
    setAvailableBooks((allEntries || []).filter((e: any) => !groupBookIds.has(e.id)))
    setShowBookPicker(true)
  }

  const handleAddBook = async (bookId: string) => {
    setAddingBook(true)
    await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_ids_to_add: [bookId] }),
    })
    await fetchGroupBooks()
    if (userId) {
      const res = await fetch(`${API_URL}/groups/${userId}`)
      const data = await res.json()
      const found = (data.groups || []).find((g: Group) => g.id === groupId) || null
      setGroup(found)
    }
    setShowBookPicker(false)
    setAddingBook(false)
  }

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

      {/* Mobile Header — hidden on desktop */}
      <div
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: '#fff',
          borderBottom: '1px solid #e0e0e0',
          alignItems: 'center',
          height: '52px',
          padding: '0 16px',
        }}
      >
        <button
          onClick={() => router.push('/groups')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '18px', color: '#1a1a1a', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
        >
          Roga
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>
          {group?.name ?? 'Group'}
        </div>
        <button
          onClick={() => router.push(`/groups/${groupId}/edit`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#999', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✎
        </button>
      </div>

      {/* Left Panel — desktop only */}
      <div
        style={{ display: isMobile ? 'none' : 'flex', width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', flexDirection: 'column', padding: '24px 16px' }}
      >
        <div
          style={{ fontWeight: '700', fontSize: '18px', marginBottom: '24px', paddingLeft: '8px', cursor: 'pointer' }}
          onClick={() => router.push('/groups')}
        >
          Roga
        </div>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '8px', marginBottom: '16px', cursor: 'pointer' }}
          onClick={() => router.push(`/groups/${groupId}/edit`)}
        >
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a' }}>
            {group?.name ?? 'Group'}
          </span>
          <span style={{ fontSize: '12px', color: '#ccc' }}>✎</span>
        </div>

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

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
            Past conversations
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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

          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px', marginTop: '16px', display: 'flex', flexDirection: 'column', maxHeight: '280px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '4px' }}>
                Group Library
              </div>
              <button
                onClick={openBookPicker}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#666', padding: '2px 4px', borderRadius: '4px' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#333')}
                onMouseLeave={e => (e.currentTarget.style.color = '#666')}
              >
                + Add Book
              </button>
            </div>
            <div style={{ overflowY: 'auto' }}>
              {groupBooks.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>No books in this group yet.</div>
              ) : (
                groupBooks.map(book => (
                  <div key={book.id} style={{ padding: '8px 12px', marginBottom: '2px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '1px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Main Area */}
      <div
        style={{ display: isMobile ? 'none' : 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '40px' }}
      >
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: '15px' }}>
            {paused
              ? 'Add more books to this group to resume conversations.'
              : 'Start a conversation or pick up where you left off.'}
          </div>
        </div>
      </div>

      {/* Mobile Main Content */}
      <div
        style={{ display: isMobile ? 'block' : 'none', flex: 1, overflowY: 'auto', paddingTop: '52px', paddingBottom: '72px' }}
      >
        <div style={{ padding: '16px' }}>

          {paused && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              This group is paused. Add at least 2 books to start new conversations.
            </div>
          )}

          <button
            onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=intentional`) }}
            disabled={paused}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '15px', cursor: paused ? 'not-allowed' : 'pointer', color: paused ? '#bbb' : '#333', minHeight: '44px' }}
          >
            Let's dig into something
          </button>
          <button
            onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=open`) }}
            disabled={paused}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '14px 16px', marginBottom: '28px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '15px', cursor: paused ? 'not-allowed' : 'pointer', color: paused ? '#bbb' : '#333', minHeight: '44px' }}
          >
            Tell me something interesting
          </button>

          <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Past conversations
          </div>
          <div style={{ marginBottom: '28px' }}>
            {conversations.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#999' }}>Your conversations will appear here.</div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => router.push(`/groups/${groupId}/conversation/${conv.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', marginBottom: '6px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', minHeight: '56px' }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {conv.title || 'Untitled conversation'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>{formatDate(conv.updated_at)}</div>
                  </div>
                  <button
                    onClick={e => deleteConversation(e, conv.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '16px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group Library
            </div>
            <button
              onClick={openBookPicker}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#666', padding: '4px 8px', minHeight: '44px' }}
            >
              + Add Book
            </button>
          </div>
          <div>
            {groupBooks.length === 0 ? (
              <div style={{ fontSize: '13px', color: '#999' }}>No books in this group yet.</div>
            ) : (
              groupBooks.map(book => (
                <div key={book.id} style={{ padding: '12px 16px', marginBottom: '6px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>{book.title}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <BottomTabBar />

      {/* Book Picker Modal */}
      {showBookPicker && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}
          onClick={() => setShowBookPicker(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '100%', maxWidth: '360px', maxHeight: '480px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '16px' }}>Add a book to this group</div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {availableBooks.length === 0 ? (
                <div style={{ fontSize: '14px', color: '#999', padding: '8px 0' }}>All your library books are already in this group.</div>
              ) : (
                availableBooks.map(book => (
                  <button
                    key={book.id}
                    disabled={addingBook}
                    onClick={() => handleAddBook(book.id)}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: '4px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: addingBook ? 'not-allowed' : 'pointer', fontSize: '13px', minHeight: '44px' }}
                    onMouseEnter={e => { if (!addingBook) e.currentTarget.style.background = '#f5f5f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                  >
                    <div style={{ fontWeight: '500', color: '#333' }}>{book.title}</div>
                    <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowBookPicker(false)}
              style={{ marginTop: '16px', padding: '10px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', color: '#666', minHeight: '44px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
