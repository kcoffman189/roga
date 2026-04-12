'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const FAMILIARITY_STATES = [
  { value: 'currently_reading', label: 'Currently reading' },
  { value: 'read_recently', label: 'Read it — recently' },
  { value: 'read_long_ago', label: 'Read it — a while ago' },
  { value: 'partially_read', label: 'Partially read / dipped in' },
  { value: 'want_to_read', label: 'Want to read' },
]

type LibraryEntry = {
  id: string
  title: string
  familiarity_state: string
  notes: string | null
  created_at: string
}

export default function LibraryPage() {
  const [entries, setEntries] = useState<LibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [searchTitle, setSearchTitle] = useState('')
  const [selectedFamiliarity, setSelectedFamiliarity] = useState('')
  const [adding, setAdding] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const router = useRouter()
  const supabase = createClient()

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
      familiarity_state: selectedFamiliarity,
    })
    if (!error) {
      setShowAdd(false)
      setSearchTitle('')
      setSelectedFamiliarity('')
      setStep(1)
      fetchLibrary()
    }
    setAdding(false)
  }

  const handleDeleteBook = async (id: string) => {
    await supabase.from('library_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getFamiliarityLabel = (value: string) => {
    return FAMILIARITY_STATES.find(s => s.value === value)?.label || value
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', background: '#fafafa' }}>
      {/* Left Panel */}
      <div style={{ width: '260px', borderRight: '1px solid #e0e0e0', background: '#fff', display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0 }}>
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '48px 40px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>My Library</h1>
            <button
              onClick={() => { setShowAdd(true); setStep(1) }}
              style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}
            >
              + Add book
            </button>
          </div>

          {showAdd && (
            <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '24px', marginBottom: '32px', background: '#fff' }}>
              {step === 1 && (
                <>
                  <p style={{ margin: '0 0 12px', fontWeight: '500' }}>What book do you want to add?</p>
                  <input
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="Type a title..."
                    style={{ width: '100%', padding: '10px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && searchTitle.trim()) setStep(2) }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setStep(2)} disabled={!searchTitle.trim()} style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', background: '#000', color: '#fff', border: 'none' }}>
                      Next
                    </button>
                    <button onClick={() => { setShowAdd(false); setSearchTitle(''); setStep(1) }} style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <p style={{ margin: '0 0 4px', fontWeight: '500' }}>{searchTitle}</p>
                  <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>Where are you with this one?</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {FAMILIARITY_STATES.map((state) => (
                      <button
                        key={state.value}
                        onClick={() => setSelectedFamiliarity(state.value)}
                        style={{ padding: '12px 16px', fontSize: '15px', cursor: 'pointer', borderRadius: '6px', border: `2px solid ${selectedFamiliarity === state.value ? '#000' : '#e0e0e0'}`, background: selectedFamiliarity === state.value ? '#f5f5f5' : '#fff', textAlign: 'left' }}
                      >
                        {state.label}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button onClick={handleAddBook} disabled={!selectedFamiliarity || adding} style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', background: '#000', color: '#fff', border: 'none' }}>
                      {adding ? 'Adding...' : 'Add to library'}
                    </button>
                    <button onClick={() => setStep(1)} style={{ padding: '8px 20px', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', border: '1px solid #ccc', background: '#fff' }}>
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
            <p style={{ color: '#666' }}>Your library is empty. Add your first book.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entries.map((entry) => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '16px 20px', background: '#fff' }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{entry.title}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{getFamiliarityLabel(entry.familiarity_state)}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteBook(entry.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: '18px', lineHeight: 1, padding: '4px 8px', borderRadius: '4px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#999')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#ccc')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
