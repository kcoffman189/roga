'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function PrefetchConversationPage() {
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }

const prefetch = sessionStorage.getItem('tmsi_prefetch')
      const booksUsed = sessionStorage.getItem('tmsi_books_used')
      sessionStorage.removeItem('tmsi_prefetch')
      sessionStorage.removeItem('tmsi_books_used')

      if (!prefetch) {
        router.push('/conversation/new?mode=open')
        return
      }

      try {
        const res = await fetch(`${API_URL}/conversation/save-prefetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, content: prefetch, books_used: booksUsed })
        })
        const data = await res.json()
        if (data.conversation_id) {
          router.push(`/conversation/${data.conversation_id}`)
        } else {
          router.push('/conversation/new?mode=open')
        }
      } catch {
        router.push('/conversation/new?mode=open')
      }
    }
    init()
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#FAF8F4' }}>
      <div style={{ color: '#6B6B6B', fontSize: '14px', fontFamily: 'Inter, system-ui, sans-serif', fontStyle: 'italic' }}>Finding connections in your library...</div>
    </div>
  )
}