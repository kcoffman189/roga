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
      familiarity_score: addIsUnread ? null : 3,
      is_unread: addIsUnread,
    })
    if (!error) {
      setShowAdd(false)
      setSearchTitle('')
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
          padding: '10px 20px',
          alignItems: 'center',
          gap: '12px',
          minHeight: '56px',
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#333', padding: '4px', minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ←
        </button>
        <div style={{ fontWeight: '600', fontSize: '17px' }}>My Library</div>
      </div>

      {/* Left Panel — desktop only */}
      <div
        style={{ display: isMobile ? 'none' : 'flex', width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}
      >
        <div style={{ fontWeight: '700', fontSize: '18px', marginBottom: '32px', paddingLeft: '8px', cursor: 'pointer' }} onClick={() => router.push('/')}>Roga</div>
        <button onClick={() => router.push('/conversation/new?mode=intentional')} style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Let's dig into something
        </button>
        <button onClick={() => router.push('/conversation/new?mode=open')} style={{ textAlign: 'left', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Tell me something interesting
        </button>
        <a href="/library" style={{ display: 'block', padding: '10px 12px', marginBottom: '24px', borderRadius: '6px', color: '#333', textDecoration: 'none', fontSize: '14px', border: '1px solid #e0e0e0', background: '#f5f5f5', fontWeight: '500' }}>
          My Library
        </a>
        <div style={{ fontSize: '11px', fontWeight: '600', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px' }}>Past conversations</div>
        <div style={{ fontSize: '13px', color: '#999', padding: '4px' }}>
          <a href="/" style={{ color: '#999', textDecoration: 'none' }}>← Back to conversations</a>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          style={{ maxWidth: '680px', margin: '0 auto', padding: isMobile ? '72px 16px 80px' : '48px 40px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h1 style={{ display: isMobile ? 'none' : 'block', fontSize: '24px', fontWeight: '600', margin: 0 }}>My Library</h1>
            <button
              onClick={() => { setShowAdd(true); setStep(1) }}
              style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', minHeight: '44px', marginLeft: 'auto' }}
            >
              + Add book
            </button>
          </div>

          {showAdd && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px', marginBottom: '24px', background: '#fff' }}>
              {step === 1 && (
                <>
                  <p style={{ margin: '0 0 12px', fontWeight: '500' }}>What book do you want to add?</p>
                  <input
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="Type a title..."
                    style={{ width: '100%', padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box', minHeight: '44px' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchTitle.trim()) setStep(2) }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setStep(2)} disabled={!searchTitle.trim()} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '6px', background: '#000', color: '#fff', border: 'none', minHeight: '44px' }}>
                      Next
                    </button>
                    <button onClick={() => { setShowAdd(false); setSearchTitle(''); setStep(1) }} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', minHeight: '44px' }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <p style={{ margin: '0 0 16px', fontWeight: '500' }}>{searchTitle}</p>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', minHeight: '44px' }}>
                    <ToggleSwitch checked={addIsUnread} onChange={setAddIsUnread} />
                    <span style={{ fontSize: '15px', color: '#444' }}>Haven't read this yet</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                    <button onClick={handleAddBook} disabled={adding} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '6px', background: '#000', color: '#fff', border: 'none', minHeight: '44px' }}>
                      {adding ? 'Adding...' : 'Add to library'}
                    </button>
                    <button onClick={() => setStep(1)} style={{ padding: '10px 20px', fontSize: '15px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff', minHeight: '44px' }}>
                      Back
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {loading ? (
            <p style={{ color: '#666' }}>Loading your library...</p>
          ) : entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: '#999', marginBottom: '20px', fontSize: '15px' }}>Your library is empty. Add your first book to get started.</p>
              <button
                onClick={() => { setShowAdd(true); setStep(1) }}
                style={{ padding: '12px 24px', fontSize: '15px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ccc', background: '#fff', minHeight: '44px' }}
              >
                + Add book
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.map((entry) => (
                <div key={entry.id} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px 20px', background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontWeight: '500', fontSize: '15px' }}>{entry.title}</div>
                    <button
                      onClick={() => handleDeleteBook(entry.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '18px', lineHeight: 1, minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#999')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                    >
                      ✕
                    </button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', marginBottom: entry.is_unread ? 0 : '10px', minHeight: '44px' }}>
                    <ToggleSwitch
                      checked={entry.is_unread}
                      onChange={(val) => {
                        handleFamiliarityChange(entry.id, { is_unread: val })
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>Haven't read this yet</span>
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
      style={{
        width: '44px',
        height: '26px',
        borderRadius: '13px',
        background: checked ? '#333' : '#ddd',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '4px',
        left: checked ? '22px' : '4px',
        width: '18px',
        height: '18px',
        borderRadius: '50%',
        background: '#fff',
        transition: 'left 0.15s',
      }} />
    </div>
  )
}

function FamiliaritySlider({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  return (
    <div style={{ paddingTop: '2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' }}>Vaguely familiar</span>
        <input
          type="range"
          min={1}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            flex: 1,
            accentColor: '#333',
            cursor: 'pointer',
            height: '20px',
          }}
        />
        <span style={{ fontSize: '12px', color: '#aaa', whiteSpace: 'nowrap' }}>Know it deeply</span>
      </div>
    </div>
  )
}
