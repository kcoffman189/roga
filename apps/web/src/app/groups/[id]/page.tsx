'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'
import ConversationGroupedList from '@/components/ConversationGroupedList'

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

type WelcomeQuote = {
  quote: string | null
  author: string | null
  empty_library: boolean
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
  const [welcome, setWelcome] = useState<WelcomeQuote | null>(null)
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

      const [groupsRes, convsRes, quoteRes] = await Promise.all([
        fetch(`${API_URL}/groups/${user.id}`),
        fetch(`${API_URL}/group-conversations/${groupId}`),
        fetch(`${API_URL}/group-welcome-quote/${groupId}`)
      ])

      const groupsData = await groupsRes.json()
      const convsData = await convsRes.json()
      const quoteData = await quoteRes.json()

      const found = (groupsData.groups || []).find((g: Group) => g.id === groupId) || null
      setGroup(found)
      setConversations(convsData.conversations || [])
      setWelcome(quoteData)

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

  const deleteConversation = async (convId: string) => {
    await fetch(`${API_URL}/group-conversation/${convId}`, { method: 'DELETE' })
    setConversations(prev => prev.filter(c => c.id !== convId))
  }

  if (loading) return null

  const paused = group?.is_paused ?? false

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif', background: 'var(--color-bg-canvas)' }}>

      {/* Mobile Header */}
      <div style={{
        display: isMobile ? 'flex' : 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'var(--color-bg-canvas)',
        borderBottom: '1px solid var(--color-border-light)',
        alignItems: 'center', height: '52px', padding: '0 16px',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.push('/groups')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '29px', letterSpacing: '-0.02em', color: 'var(--color-text-primary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center' }}
        >
          Cephos
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: '15px', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '0 8px' }}>
          {group?.name ?? 'Group'}
        </div>
        <button
          onClick={() => router.push(`/groups/${groupId}/edit`)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--color-text-tertiary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ✎
        </button>
      </div>

      {/* Desktop Left Panel */}
      <div style={{
        display: isMobile ? 'none' : 'flex',
        width: '260px', flexDirection: 'column',
        padding: '22px 20px',
        background: 'var(--color-bg-sidebar)',
        flexShrink: 0, position: 'relative',
      }}>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '3px', background: 'var(--color-accent)' }} />

        <div style={{ display: 'block', marginBottom: '28px', width: '100%', maxWidth: '330px', marginLeft: '-12px' }}>
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
            <text x="62" y="63" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">YOUR LIBRARY. MORE CONNECTED.</text>
          </svg>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '2px', marginBottom: '16px', cursor: 'pointer' }}
          onClick={() => router.push(`/groups/${groupId}/edit`)}>
          <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--color-text-on-dark)', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {group?.name ?? 'Group'}
          </span>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted-dark)' }}>✎</span>
        </div>

        {paused && (
          <div style={{ marginBottom: '16px', padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '12px', color: '#92400e', lineHeight: '1.5' }}>
            This group is paused. Add at least 2 books to start new conversations.
          </div>
        )}

        <button
          onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=intentional`) }}
          disabled={paused}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 14px', marginBottom: '9px',
            background: 'transparent', border: 'none',
            borderLeft: paused ? '3px solid var(--color-border-dark)' : '3px solid var(--color-accent)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '19.5px', color: paused ? '#3E4650' : '#B8C0C8',
            cursor: paused ? 'not-allowed' : 'pointer', minHeight: '44px',
          }}
        >
          Let&apos;s dig into something
        </button>

        <button
          onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=open`) }}
          disabled={paused}
          style={{
            display: 'block', width: '100%', textAlign: 'left',
            padding: '9px 14px', marginBottom: '24px',
            background: 'transparent', border: 'none',
            borderLeft: '1px solid var(--color-border-dark)',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            fontSize: '19.5px', color: paused ? '#2E3640' : '#3E4650',
            cursor: paused ? 'not-allowed' : 'pointer', minHeight: '44px',
          }}
        >
          Tell me something interesting
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>
            Past conversations
          </div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {conversations.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted-dark)', padding: '4px' }}>Your conversations will appear here.</div>
            ) : (
              <ConversationGroupedList
                conversations={conversations}
                onSelect={(id) => router.push(`/groups/${groupId}/conversation/${id}`)}
                onDelete={deleteConversation}
              />
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--color-border-dark)', paddingTop: '16px', marginTop: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-muted-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group Library
            </div>
            <button
              onClick={openBookPicker}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--color-text-muted-dark)', padding: '2px 4px', borderRadius: '4px' }}
            >
              + Add Book
            </button>
          </div>
          <div style={{ overflowY: 'auto', maxHeight: '200px' }}>
            {groupBooks.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted-dark)', padding: '4px' }}>No books in this group yet.</div>
            ) : (
              groupBooks.map(book => (
                <div key={book.id} style={{ padding: '8px 4px', marginBottom: '2px', borderBottom: '1px solid var(--color-border-dark)' }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text-on-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted-dark)', marginTop: '1px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Desktop Main Area */}
      <div style={{ display: isMobile ? 'none' : 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        {paused ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <span style={{ display: 'block', width: '32px', height: '2px', background: 'var(--color-accent)', margin: '0 auto 20px', border: 'none' }} />
            <div style={{ fontSize: '15px' }}>Add more books to this group to resume conversations.</div>
          </div>
        ) : welcome?.quote ? (
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
        ) : null}
      </div>

      {/* Mobile Main Content */}
      <div style={{ display: isMobile ? 'block' : 'none', flex: 1, overflowY: 'auto', paddingTop: '52px', paddingBottom: '72px' }}>
        <div style={{ padding: '16px' }}>
          {paused && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '13px', color: '#92400e', lineHeight: '1.5' }}>
              This group is paused. Add at least 2 books to start new conversations.
            </div>
          )}

          <button
            onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=intentional`) }}
            disabled={paused}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '14px 16px', marginBottom: '10px',
              background: 'transparent', border: 'none',
              borderLeft: paused ? '3px solid var(--color-border-light)' : '3px solid var(--color-accent)',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '15px', color: paused ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
              cursor: paused ? 'not-allowed' : 'pointer', minHeight: '44px',
            }}
          >
            Let&apos;s dig into something
          </button>

          <button
            onClick={() => { if (!paused) router.push(`/groups/${groupId}/conversation/new?mode=open`) }}
            disabled={paused}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '14px 16px', marginBottom: '28px',
              background: 'transparent', border: 'none',
              borderLeft: '1px solid var(--color-border-light)',
              fontFamily: 'Georgia, serif', fontStyle: 'italic',
              fontSize: '15px', color: paused ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
              cursor: paused ? 'not-allowed' : 'pointer', minHeight: '44px',
            }}
          >
            Tell me something interesting
          </button>

          <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
            Past conversations
          </div>
          <div style={{ marginBottom: '28px' }}>
            {conversations.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>Your conversations will appear here.</div>
            ) : (
              <ConversationGroupedList
                conversations={conversations}
                onSelect={(id) => router.push(`/groups/${groupId}/conversation/${id}`)}
                onDelete={deleteConversation}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Group Library
            </div>
            <button
              onClick={openBookPicker}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--color-text-tertiary)', padding: '4px 8px', minHeight: '44px' }}
            >
              + Add Book
            </button>
          </div>
          <div>
            {groupBooks.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text-tertiary)' }}>No books in this group yet.</div>
            ) : (
              groupBooks.map(book => (
                <div key={book.id} style={{ padding: '12px 16px', marginBottom: '6px', borderRadius: '4px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
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
            style={{ background: 'var(--color-bg-surface)', borderRadius: '4px', padding: '24px', width: '100%', maxWidth: '360px', maxHeight: '480px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '18px', color: 'var(--color-text-primary)', marginBottom: '16px' }}>Add a book to this group</div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {availableBooks.length === 0 ? (
                <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', padding: '8px 0' }}>All your library books are already in this group.</div>
              ) : (
                availableBooks.map(book => (
                  <button
                    key={book.id}
                    disabled={addingBook}
                    onClick={() => handleAddBook(book.id)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '12px 14px', marginBottom: '4px',
                      borderRadius: '4px', border: '1px solid var(--color-border-light)',
                      background: 'var(--color-bg-surface)',
                      cursor: addingBook ? 'not-allowed' : 'pointer',
                      fontSize: '13px', minHeight: '44px',
                    }}
                    onMouseEnter={e => { if (!addingBook) e.currentTarget.style.background = 'var(--color-bg-canvas)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-bg-surface)' }}
                  >
                    <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>{book.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowBookPicker(false)}
              style={{ marginTop: '16px', padding: '10px', fontSize: '14px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)', color: 'var(--color-text-secondary)', minHeight: '44px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
