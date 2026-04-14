'use client'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

const FAMILIARITY_LABELS: Record<string, string> = {
  currently_reading: 'Currently reading',
  read_recently: 'Read it — recently',
  read_long_ago: 'Read it — a while ago',
  partially_read: 'Partially read / dipped in',
  want_to_read: 'Want to read',
}

type LibraryEntry = {
  id: string
  title: string
  familiarity_state: string
}

export default function NewGroupPage() {
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [books, setBooks] = useState<LibraryEntry[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }
      setUserId(user.id)
      const { data } = await supabase
        .from('library_entries')
        .select('id, title, familiarity_state')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setBooks(data || [])
    }
    init()
  }, [])

  const toggleBook = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleCreate = async () => {
    if (!userId || selectedIds.size < 2 || !name.trim()) return
    setSubmitting(true)
    const res = await fetch(`${API_URL}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name: name.trim(), book_ids: Array.from(selectedIds) }),
    })
    if (res.ok) {
      router.push('/groups')
    } else {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}>
        <div
          style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px', cursor: 'pointer' }}
          onClick={() => router.push('/groups')}
        >
          Roga
        </div>
        <div style={{ fontSize: '13px', color: '#999', paddingLeft: '4px' }}>
          <span
            style={{ cursor: 'pointer', color: '#999', textDecoration: 'none' }}
            onClick={() => router.push('/groups')}
          >
            ← Back to Groups
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {step === 1 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>Name your group</h1>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '28px' }}>Give it a name that describes what connects these books.</p>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2) }}
                placeholder="Neuroscience, History, Book Club..."
                autoFocus
                style={{ width: '100%', padding: '12px 14px', fontSize: '15px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', outline: 'none', marginBottom: '16px' }}
              />
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                style={{ padding: '10px 28px', fontSize: '14px', cursor: name.trim() ? 'pointer' : 'not-allowed', borderRadius: '6px', background: name.trim() ? '#000' : '#e0e0e0', color: name.trim() ? '#fff' : '#999', border: 'none' }}
              >
                Next
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h1 style={{ fontSize: '22px', fontWeight: '600', marginBottom: '4px' }}>{name}</h1>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '24px' }}>
                Select at least 2 books for this group.
                <span
                  style={{ marginLeft: '12px', fontSize: '13px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setStep(1)}
                >
                  Edit name
                </span>
              </p>

              {books.length === 0 ? (
                <p style={{ color: '#999', fontSize: '14px' }}>Your library is empty. <a href="/library" style={{ color: '#333' }}>Add some books first.</a></p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px', maxHeight: '400px', overflowY: 'auto' }}>
                  {books.map(book => {
                    const selected = selectedIds.has(book.id)
                    return (
                      <div
                        key={book.id}
                        onClick={() => toggleBook(book.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 14px',
                          border: `1px solid ${selected ? '#c8a96e' : '#e0e0e0'}`,
                          borderRadius: '6px',
                          background: selected ? '#fdfaf5' : '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '4px',
                          border: `2px solid ${selected ? '#c8a96e' : '#ccc'}`,
                          background: selected ? '#c8a96e' : '#fff',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {selected && <span style={{ color: '#fff', fontSize: '11px', fontWeight: '700', lineHeight: 1 }}>✓</span>}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '500', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</div>
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{FAMILIARITY_LABELS[book.familiarity_state] || book.familiarity_state}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={handleCreate}
                  disabled={selectedIds.size < 2 || submitting}
                  style={{
                    padding: '10px 28px',
                    fontSize: '14px',
                    cursor: selectedIds.size >= 2 && !submitting ? 'pointer' : 'not-allowed',
                    borderRadius: '6px',
                    background: selectedIds.size >= 2 ? '#000' : '#e0e0e0',
                    color: selectedIds.size >= 2 ? '#fff' : '#999',
                    border: 'none',
                  }}
                >
                  {submitting ? 'Creating...' : 'Create Group'}
                </button>
                <span style={{ fontSize: '13px', color: '#bbb' }}>
                  {selectedIds.size} selected
                </span>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
