'use client'
export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomTabBar from '@/components/BottomTabBar'
import { useIsMobile } from '@/hooks/useIsMobile'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://roga-api.fly.dev'

type LibraryEntry = {
  id: string
  title: string
  familiarity_score: number | null
  is_unread: boolean
  notes: string | null
  created_at: string
}

export default function LibraryPage() {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [searchTitle, setSearchTitle] = useState('')
  const [searchAuthor, setSearchAuthor] = useState('')
  const [addIsUnread, setAddIsUnread] = useState(false)
  const [adding, setAdding] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchLibrary()
  }, [])

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

  const handleAddBook = async () => {
    setAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('library_entries').insert({
      user_id: user.id,
      title: searchTitle.trim(),
      author: searchAuthor.trim() || null,
      familiarity_score: addIsUnread ? null : 3,
      is_unread: addIsUnread,
    })
    if (!error) {
      setShowAdd(false)
      setSearchTitle('')
      setSearchAuthor('')
      setAddIsUnread(false)
      setStep(1)
      fetchLibrary()
    }
    setAdding(false)
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
        <div onClick={() => router.push('/home')} style={{ fontFamily: 'Georgia, serif', fontWeight: '400', fontSize: '58px', letterSpacing: '-0.02em', color: 'var(--color-text-on-dark)', lineHeight: 1, cursor: 'pointer' }}>Roga</div>
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
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: isMobile ? 'flex-end' : 'space-between', marginBottom: isMobile ? '16px' : '32px' }}>
            {!isMobile && (
              <div>
                <hr style={{ width: '32px', height: '2px', background: 'var(--color-accent)', border: 'none', display: 'block', margin: '0 0 16px' }} />
                <h1 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '28px', fontWeight: '400', color: 'var(--color-text-primary)', margin: 0 }}>My Library</h1>
              </div>
            )}
            <button
              onClick={() => { setShowAdd(true); setStep(1) }}
              className="lib-add-btn"
            >
              + Add book
            </button>
          </div>

          {showAdd && (
            <div style={{ border: '1px solid var(--color-border-light)', borderRadius: '4px', padding: '24px', marginBottom: '24px', background: 'var(--color-bg-surface)' }}>
              {step === 1 && (
                <>
                  <p style={{ margin: '0 0 12px', fontWeight: '500', fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)' }}>What book do you want to add?</p>
                  <input
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="Type a title..."
                    style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--color-border-light)', boxSizing: 'border-box', minHeight: '44px', fontFamily: 'Inter, sans-serif' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchTitle.trim()) setStep(2) }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setStep(2)} disabled={!searchTitle.trim()} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', background: 'var(--color-text-primary)', color: '#fff', border: 'none', minHeight: '44px', fontFamily: 'Inter, sans-serif' }}>
                      Next
                    </button>
                    <button onClick={() => { setShowAdd(false); setSearchTitle(''); setStep(1) }} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)', minHeight: '44px', fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)' }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <p style={{ margin: '0 0 16px', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '17px', color: 'var(--color-text-primary)' }}>{searchTitle}</p>
                  <input
                    type="text"
                    value={searchAuthor}
                    onChange={(e) => setSearchAuthor(e.target.value)}
                    placeholder="Author (optional)"
                    style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '4px', border: '1px solid var(--color-border-light)', boxSizing: 'border-box', minHeight: '44px', marginBottom: '16px', fontFamily: 'Inter, sans-serif' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', minHeight: '44px' }}>
                    <ToggleSwitch checked={addIsUnread} onChange={setAddIsUnread} />
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: 'var(--color-text-secondary)' }}>Haven&apos;t read this yet</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button onClick={handleAddBook} disabled={adding} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', background: 'var(--color-text-primary)', color: '#fff', border: 'none', minHeight: '44px', fontFamily: 'Inter, sans-serif' }}>
                      {adding ? 'Adding...' : 'Add to library'}
                    </button>
                    <button onClick={() => setStep(1)} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '4px', border: '1px solid var(--color-border-light)', background: 'var(--color-bg-surface)', minHeight: '44px', fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)' }}>
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {loading ? (
            <p style={{ fontFamily: 'Inter, sans-serif', color: 'var(--color-text-secondary)' }}>Loading your library...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 48px' }}>
              <hr style={{ width: '32px', height: '2px', background: 'var(--color-accent)', border: 'none', display: 'block', margin: '0 auto 20px' }} />
              <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '22px', fontWeight: '400', color: 'var(--color-text-primary)', textAlign: 'center', margin: '0 0 8px' }}>Your library is empty.</h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: 'var(--color-text-secondary)', textAlign: 'center', margin: 0 }}>Add 5 to 10 books to get started.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {entries.map((entry) => (
                <div key={entry.id} className="lib-card">
                  <button
                    onClick={() => handleDeleteBook(entry.id)}
                    style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: '16px', opacity: 0.5, lineHeight: 1, padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--color-accent)' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--color-text-tertiary)' }}
                  >
                    ✕
                  </button>
                  <div style={{ paddingRight: '40px' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '17px', fontWeight: '400', color: 'var(--color-text-primary)', marginBottom: entry.author ? '4px' : '16px', lineHeight: 1.3 }}>{entry.title}</div>
                    {entry.author && (
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>{entry.author}</div>
                    )}
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                    <ToggleSwitch
                      checked={entry.is_unread}
                      onChange={(val) => {
                        handleFamiliarityChange(entry.id, { is_unread: val })
                      }}
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
              ))}
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
