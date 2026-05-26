'use client'

import { useEffect, useRef, useState, RefObject } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

type Props = {
  groupsButtonRef: RefObject<HTMLButtonElement | null>
  supabase: SupabaseClient
  userId: string
  onDismiss: () => void
}

export default function GroupsIntroCard({ groupsButtonRef, supabase, userId, onDismiss }: Props) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = groupsButtonRef.current
    if (!el) return
    const updateRect = () => setTargetRect(el.getBoundingClientRect())
    updateRect()
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [groupsButtonRef])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        dismiss()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  const dismiss = async () => {
    onDismiss()
    await supabase
      .from('user_profiles')
      .update({ groups_intro_card_seen: true })
      .eq('id', userId)
  }

  if (!targetRect) return null

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top: targetRect.top + targetRect.height / 2 - 40,
        left: targetRect.right + 14,
        zIndex: 1000,
      }}
    >
      {/* Left-pointing arrow — border layer */}
      <div style={{
        position: 'absolute',
        left: -8,
        top: 33,
        width: 0,
        height: 0,
        borderTop: '7px solid transparent',
        borderBottom: '7px solid transparent',
        borderRight: '7px solid var(--color-border-light)',
      }} />
      {/* Left-pointing arrow — fill layer */}
      <div style={{
        position: 'absolute',
        left: -7,
        top: 33,
        width: 0,
        height: 0,
        borderTop: '7px solid transparent',
        borderBottom: '7px solid transparent',
        borderRight: '7px solid #fff',
      }} />

      {/* Card */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--color-border-light)',
        borderRadius: '6px',
        padding: '20px 24px',
        maxWidth: '280px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        position: 'relative',
      }}>
        <button
          onClick={dismiss}
          style={{
            position: 'absolute',
            top: '10px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: 'var(--color-text-tertiary)',
            lineHeight: '1',
            padding: '2px 4px',
          }}
          aria-label="Dismiss"
        >
          ×
        </button>

        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '15px',
          color: 'var(--color-text-primary)',
          marginBottom: '10px',
          paddingRight: '20px',
        }}>
          One more thing worth knowing.
        </div>

        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.6',
        }}>
          Once you have a few books in your library, you can bring them together into a Group — a focused conversation space for a particular subject, a reading list, or a period of study. Cephos keeps its thinking inside those books only.
        </div>

        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '13px',
          color: 'var(--color-text-tertiary)',
          marginTop: '10px',
        }}>
          Groups is up there when you&apos;re ready for it.
        </div>
      </div>
    </div>
  )
}
