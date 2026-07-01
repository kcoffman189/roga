'use client'
export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'
import { Pencil } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://roga-api.fly.dev'

type LibraryEntry = {
  id: string
  title: string
  author?: string | null
  familiarity_score: number | null
  is_unread: boolean
  notes: string | null
  created_at: string
}

type BookSuggestion = {
  title: string
  author: string
}

export default function LibraryPage() {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)

  // Add form
  const [addTitle, setAddTitle] = useState('')
  const [addAuthor, setAddAuthor] = useState('')
  const [addIsUnread, setAddIsUnread] = useState(false)
  const [addFamiliarity, setAddFamiliarity] = useState(3)
  const [addSuggestion, setAddSuggestion] = useState<BookSuggestion | null>(null)
  const [adding, setAdding] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState(false)

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editIsUnread, setEditIsUnread] = useState(false)
  const [editFamiliarity, setEditFamiliarity] = useState(3)
  const [editSuggestion, setEditSuggestion] = useState<BookSuggestion | null>(null)
  const [saving, setSaving] = useState(false)

  const addDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => { fetchLibrary() }, [])

  useEffect(() => {
    if (addDebounceRef.current) clearTimeout(addDebounceRef.current)
    if (addTitle.length < 3) { setAddSuggestion(null); return }
    addDebounceRef.current = setTimeout(() => searchGoogleBooks(addTitle, setAddSuggestion), 300)
    return () => { if (addDebounceRef.current) clearTimeout(addDebounceRef.current) }
  }, [addTitle])

  useEffect(() => {
    if (editDebounceRef.current) clearTimeout(editDebounceRef.current)
    if (editTitle.length < 3) { setEditSuggestion(null); return }
    editDebounceRef.current = setTimeout(() => searchGoogleBooks(editTitle, setEditSuggestion), 300)
    return () => { if (editDebounceRef.current) clearTimeout(editDebounceRef.current) }
  }, [editTitle])

  const fetchLibrary = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('library_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  const searchGoogleBooks = async (title: string, setSuggestion: (s: BookSuggestion | null) => void) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&orderBy=relevance&printType=books&maxResults=5&key=${apiKey}`)
      const json = await res.json()
      const item = json.items?.[0]
      if (!item) { setSuggestion(null); return }
      const info = item.volumeInfo
      setSuggestion({ title: info.title || title, author: info.authors?.[0] || '' })
    } catch {
      setSuggestion(null)
    }
  }

  const handleAddBook = async () => {
    const trimmedTitle = addTitle.trim()
    if (entries.some(e => e.title.toLowerCase() === trimmedTitle.toLowerCase())) {
      setDuplicateWarning(true)
      return
    }
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAdding(false); return }
    const { data: inserted, error } = await supabase.from('library_entries').insert({
      user_id: user.id,
      title: trimmedTitle,
      author: addAuthor.trim() || null,
      familiarity_score: addIsUnread ? null : addFamiliarity,
      is_unread: addIsUnread,
    }).select('id').single()
    if (!error) {
      if (inserted?.id) {
        fetch(`${API_BASE}/library/${inserted.id}/generate-quotes`, { method: 'POST' }).catch(() => {})
      }
      setAddTitle('')
      setAddAuthor('')
      setAddIsUnread(false)
      setAddFamiliarity(3)
      setAddSuggestion(null)
      setDuplicateWarning(false)
      fetchLibrary()
    }
    setAdding(false)
  }

  const handleEditStart = (entry: LibraryEntry) => {
    setEditingId(entry.id)
    setEditTitle(entry.title)
    setEditAuthor(entry.author || '')
    setEditIsUnread(entry.is_unread)
    setEditFamiliarity(entry.familiarity_score ?? 3)
    setEditSuggestion(null)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from('library_entries')
      .update({
        title: editTitle.trim(),
        author: editAuthor.trim() || null,
        is_unread: editIsUnread,
        familiarity_score: editIsUnread ? null : editFamiliarity,
      })
      .eq('id', editingId)
    if (!error) {
      setEntries(prev => prev.map(e => e.id === editingId ? {
        ...e,
        title: editTitle.trim(),
        author: editAuthor.trim() || null,
        is_unread: editIsUnread,
        familiarity_score: editIsUnread ? null : editFamiliarity,
      } : e))
      setEditingId(null)
    }
    setSaving(false)
  }

  const handleDeleteBook = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: membership } = await supabase
      .from('group_books')
      .select('group_id, groups!inner(id, name, user_id)')
      .eq('library_entry_id', id)
      .eq('groups.user_id', user.id)

    const groups: { id: string; name: string }[] = (membership ?? []).map((row: any) => ({
      id: row.group_id,
      name: Array.isArray(row.groups) ? row.groups[0].name : row.groups.name,
    }))

    let message: string
    if (groups.length === 0) {
      message = 'Are you sure you want to remove this book from your library?'
    } else {
      const counts = await Promise.all(
        groups.map(g =>
          supabase
            .from('group_books')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', g.id)
        )
      )

      const groupBelowMin = groups.find((g, i) => (counts[i].count ?? 0) <= 2)
      if (groupBelowMin) {
        message = `This book is currently in one or more groups. Removing it from your library will also remove it from those groups. Removing this book will drop your "${groupBelowMin.name}" group below the minimum of 2 books. That group will be paused until you add another book. Are you sure?`
      } else {
        message = 'This book is currently in one or more groups. Removing it from your library will also remove it from those groups. Are you sure?'
      }
    }

    if (!window.confirm(message)) return

    await supabase.from('library_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const handleFamiliarityChange = async (id: string, patch: { familiarity_score?: number | null; is_unread?: boolean }) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e))
    await fetch(`${API_BASE}/library/${id}/familiarity`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-canvas)' }}>

      {/* Mobile Header — hidden on desktop */}
      <div
        style={{
          display: isMobile ? 'flex' : 'none',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-text-primary)', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ←
        </button>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: '400', fontSize: '17px', color: 'var(--color-text-primary)' }}>My Library</div>
      </div>

      {/* Left Panel — desktop only */}
      <div
        className="sidebar-panel"
        style={{ display: isMobile ? 'none' : 'flex', width: '260px', flexDirection: 'column', padding: '22px 20px', flexShrink: 0 }}
      >
        <div onClick={() => router.push('/home')} style={{ fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '58px', letterSpacing: '-0.02em', color: 'var(--color-text-on-dark)', lineHeight: 1, cursor: 'pointer' }}>Cephos</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--color-text-subtle-dark)', marginTop: '5px', marginBottom: '28px' }}>Beta</div>

        <button onClick={() => router.push('/conversation/new?mode=intentional')} className="sidebar-cta-primary">
          Let&apos;s dig into something
        </button>
        <button onClick={() => router.push('/conversation/new?mode=open')} className="sidebar-cta-secondary">
          Tell me something interesting
        </button>

        <a href="/groups" className="sidebar-nav-link" style={{ marginTop: '24px', marginBottom: '4px' }}>Groups</a>
        <a href="/library" className="sidebar-nav-link" style={{ color: 'var(--color-text-on-dark)', fontWeight: '500' }}>My Library</a>

        <div className="sidebar-section-label">Past conversations</div>
        <a
          href="/home"
          style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#4E5660', padding: '6px 2px', textDecoration: 'none', display: 'block', transition: 'color 150ms ease' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#B8C0C8')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4E5660')}
        >
          ← Back to conversations
        </a>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-canvas)' }}>
        <div
          style={{ maxWidth: '680px', margin: '0 auto', padding: isMobile ? '72px 16px 80px' : '48px 56px' }}
        >
          {!isMobile && (
            <div style={{ marginBottom: '32px' }}>
              <hr style={{ width: '32px', height: '2px', background: 'var(--color-accent)', border: 'none', display: 'block', margin: '0 0 16px' }} />
              <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', fontWeight: '400', color: 'var(--color-text-primary)', margin: 0 }}>My Library</h1>
            </div>
          )}

          {/* Always-visible add form */}
          <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '4px', padding: '24px', marginBottom: '24px', background: 'var(--color-bg-surface)' }}>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                value={addTitle}
                onChange={(e) => { setAddTitle(e.target.value); setDuplicateWarning(false) }}
                placeholder="Book title"
                style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--color-border-light)', boxSizing: 'border-box', minHeight: '44px', fontFamily: 'Inter, sans-serif' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && addTitle.trim().length >= 2) handleAddBook() }}
              />
              {duplicateWarning && (
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#C0392B', marginTop: '6px' }}>
                  This book is already in your library.
                </div>
              )}
              {addSuggestion && !duplicateWarning && (
                <div
                  onClick={() => { setAddTitle(addSuggestion.title); setAddAuthor(addSuggestion.author); setAddSuggestion(null) }}
                  style={{ background: '#fff', border: '1px solid var(--color-border-light)', padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', marginTop: '4px' }}
                >
                  <span style={{ fontFamily: 'Georgia, serif', color: 'var(--color-text-primary)' }}>{addSuggestion.title}</span>
                  {addSuggestion.author && (
                    <span style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{addSuggestion.author}</span>
                  )}
                </div>
              )}
            </div>
            <input
              type="text"
              value={addAuthor}
              onChange={(e) => setAddAuthor(e.target.value)}
              placeholder="Author (optional)"
              style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--color-border-light)', boxSizing: 'border-box', minHeight: '44px', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', minHeight: '44px' }}>
              <ToggleSwitch checked={addIsUnread} onChange={setAddIsUnread} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Haven&apos;t read this yet</span>
            </label>
            {!addIsUnread && (
              <FamiliaritySlider value={addFamiliarity} onChange={setAddFamiliarity} />
            )}
            <button
              onClick={handleAddBook}
              disabled={adding || addTitle.trim().length < 2}
              style={{ marginTop: '20px', padding: '10px 20px', fontSize: '15px', cursor: addTitle.trim().length >= 2 ? 'pointer' : 'default', borderRadius: '4px', background: 'var(--color-text-primary)', color: '#fff', border: 'none', minHeight: '44px', fontFamily: 'Inter, sans-serif', opacity: addTitle.trim().length < 2 ? 0.5 : 1 }}
            >
              {adding ? 'Adding...' : '+ Add book'}
            </button>
          </div>

          {loading ? (
            <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)' }}>Loading your library...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 48px' }}>
              <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Your library is empty. Add your first book above.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {entries.map((entry) =>
                editingId === entry.id ? (
                  <div key={entry.id} className="lib-card">
                    <div style={{ marginBottom: '12px' }}>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Book title"
                        style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--color-border-light)', boxSizing: 'border-box', minHeight: '44px', fontFamily: 'Inter, sans-serif' }}
                      />
                      {editSuggestion && (
                        <div
                          onClick={() => { setEditTitle(editSuggestion.title); setEditAuthor(editSuggestion.author); setEditSuggestion(null) }}
                          style={{ background: '#fff', border: '1px solid var(--color-border-light)', padding: '10px 14px', fontSize: '13px', cursor: 'pointer', borderRadius: '4px', marginTop: '4px' }}
                        >
                          <span style={{ fontFamily: 'Georgia, serif', color: 'var(--color-text-primary)' }}>{editSuggestion.title}</span>
                          {editSuggestion.author && (
                            <span style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>{editSuggestion.author}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={editAuthor}
                      onChange={(e) => setEditAuthor(e.target.value)}
                      placeholder="Author (optional)"
                      style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--color-border-light)', boxSizing: 'border-box', minHeight: '44px', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', minHeight: '44px' }}>
                      <ToggleSwitch checked={editIsUnread} onChange={setEditIsUnread} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Haven&apos;t read this yet</span>
                    </label>
                    {!editIsUnread && (
                      <FamiliaritySlider value={editFamiliarity} onChange={setEditFamiliarity} />
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', background: 'var(--color-text-primary)', color: '#fff', border: 'none', minHeight: '44px', fontFamily: 'Inter, sans-serif' }}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditSuggestion(null) }}
                        style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)', minHeight: '44px', fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)' }}
                      >
                        Cancel
                      </button>
                    </div>
                    <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-light)', margin: '20px 0 16px' }} />
                    <button
                      onClick={() => handleDeleteBook(entry.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C0392B', fontSize: '13px', fontFamily: 'Inter, sans-serif', padding: 0 }}
                    >
                      Remove from library
                    </button>
                  </div>
                ) : (
                  <div key={entry.id} className="lib-card">
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex' }}>
                      <button
                        onClick={() => handleEditStart(entry)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', opacity: 0.5, padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteBook(entry.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: '16px', opacity: 0.5, lineHeight: 1, padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-accent)' }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ paddingRight: '88px' }}>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '400', color: 'var(--color-text-primary)', marginBottom: entry.author ? '4px' : '16px', lineHeight: 1.3 }}>{entry.title}</div>
                      {entry.author && (
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>{entry.author}</div>
                      )}
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                      <ToggleSwitch
                        checked={entry.is_unread}
                        onChange={(val) => handleFamiliarityChange(entry.id, { is_unread: val })}
                      />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-secondary)', marginLeft: '10px', verticalAlign: 'middle' }}>Haven&apos;t read this yet</span>
                    </label>
                    {!entry.is_unread && (
                      <FamiliaritySlider
                        value={entry.familiarity_score ?? 3}
                        onChange={(val) => handleFamiliarityChange(entry.id, { familiarity_score: val })}
                      />
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <BottomTabBar />
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`lib-toggle${checked ? ' active' : ''}`}
    >
      <div className="lib-toggle-thumb" />
    </div>
  )
}

function FamiliaritySlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const pct = ((value - 1) / 4) * 100
  return (
    <div style={{ marginTop: '12px' }}>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lib-slider"
        style={{ background: `linear-gradient(to right, var(--color-accent) ${pct}%, var(--color-border-light) ${pct}%)` }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>Vaguely familiar</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: 'var(--color-text-tertiary)', letterSpacing: '0.04em' }}>Know it deeply</span>
      </div>
    </div>
  )
}
