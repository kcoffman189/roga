'use client'

export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const FAMILIARITY_LABELS: Record<string, string> = {
  currently_reading: 'Currently reading',
  read_recently: 'Read it — recently',
  read_long_ago: 'Read it — a while ago',
  partially_read: 'Partially read / dipped in',
  want_to_read: 'Want to read',
}

type BookEntry = {
  id: string
  title: string
  familiarity_state: string
}

export default function GroupEditPage() {
  const [name, setName] = useState('')
  const [originalName, setOriginalName] = useState('')
  const [allBooks, setAllBooks] = useState<BookEntry[]>([])
  const [groupBookIds, setGroupBookIds] = useState<Set<string>>(new Set())
  const [originalBookIds, setOriginalBookIds] = useState<Set<string>>(new Set())
  const [removeWarning, setRemoveWarning] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

      const groupsRes = await fetch(`${API_URL}/groups/${user.id}`)
      const groupsData = await groupsRes.json()
      const group = (groupsData.groups || []).find((g: { id: string; name: string }) => g.id === groupId)
      if (group) {
        setName(group.name)
        setOriginalName(group.name)
      }

      const [gbResult, allBooksResult] = await Promise.all([
        supabase.from('group_books').select('book_id').eq('group_id', groupId),
        supabase.from('library_entries').select('id, title, familiarity_state').eq('user_id', user.id).order('created_at', { ascending: false })
      ])

      const currentIds = new Set<string>((gbResult.data || []).map((r: { book_id: string }) => r.book_id))
      setGroupBookIds(currentIds)
      setOriginalBookIds(new Set(currentIds))
      setAllBooks(allBooksResult.data || [])
      setLoading(false)
    }
    init()
  }, [])

  const removeBook = (bookId: string) => {
    if (groupBookIds.size - 1 < 2) {
      setRemoveWarning(true)
      return
    }
    setRemoveWarning(false)
    setGroupBookIds(prev => {
      const next = new Set(prev)
      next.delete(bookId)
      return next
    })
  }

  const addBook = (bookId: string) => {
    setRemoveWarning(false)
    setGroupBookIds(prev => new Set([...prev, bookId]))
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)

    const book_ids_to_add = allBooks.filter(b => groupBookIds.has(b.id) && !originalBookIds.has(b.id)).map(b => b.id)
    const book_ids_to_remove = allBooks.filter(b => !groupBookIds.has(b.id) && originalBookIds.has(b.id)).map(b => b.id)

    const body: Record<string, unknown> = {}
    if (name.trim() !== originalName) body.name = name.trim()
    if (book_ids_to_add.length > 0) body.book_ids_to_add = book_ids_to_add
    if (book_ids_to_remove.length > 0) body.book_ids_to_remove = book_ids_to_remove

    const res = await fetch(`${API_URL}/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push(`/groups/${groupId}`)
    } else {
      const err = await res.json().catch(() => ({}))
      alert(err.detail || 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this group? All conversations in it will also be deleted. This cannot be undone.')) return
    await fetch(`${API_URL}/groups/${groupId}`, { method: 'DELETE' })
    router.push('/groups')
  }

  if (loading) return null

  const booksInGroup = allBooks.filter(b => groupBookIds.has(b.id))
  const booksNotInGroup = allBooks.filter(b => !groupBookIds.has(b.id))

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}>
        <div
          style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px', cursor: 'pointer' }}
          onClick={() => router.push(`/groups/${groupId}`)}
        >
          Roga
        </div>
        <span
          style={{ fontSize: '13px', color: '#999', paddingLeft: '4px', cursor: 'pointer' }}
          onClick={() => router.push(`/groups/${groupId}`)}
        >
          ← Back to group
        </span>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 40px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '32px' }}>Edit group</h1>

          {/* Name */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Name
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', fontSize: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          {/* Books in group */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Books in this group
            </div>
            {removeWarning && (
              <div style={{ marginBottom: '12px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '13px', color: '#991b1b', lineHeight: '1.5' }}>
                A group needs at least 2 books. Add another book before removing this one.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {booksInGroup.map(book => (
                <div
                  key={book.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fff' }}
                >
                  <div style={{ minWidth: 0, marginRight: '8px' }}>
                    <div style={{ fontWeight: '500', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                    <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                  </div>
                  <button
                    onClick={() => removeBook(book.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '14px', padding: '2px 6px', borderRadius: '4px', lineHeight: 1, flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#999')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add books */}
          {booksNotInGroup.length > 0 && (
            <div style={{ marginBottom: '36px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                Add books
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {booksNotInGroup.map(book => (
                  <div
                    key={book.id}
                    onClick={() => addBook(book.id)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                  >
                    <div style={{ minWidth: 0, marginRight: '8px' }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                    </div>
                    <span style={{ fontSize: '18px', color: '#ccc', flexShrink: 0 }}>+</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save + Delete */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              style={{ padding: '10px 28px', fontSize: '14px', borderRadius: '6px', border: 'none', background: name.trim() ? '#000' : '#e0e0e0', color: name.trim() ? '#fff' : '#999', cursor: saving || !name.trim() ? 'not-allowed' : 'pointer' }}
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
            <button
              onClick={handleDelete}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#ccc', padding: '8px 4px' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e57373')}
              onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
            >
              Delete group
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
