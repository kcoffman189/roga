'use client'

import { useState } from 'react'

type Conversation = {
  id: string
  title: string | null
  updated_at: string
}

type Props = {
  conversations: Conversation[]
  onSelect: (id: string) => void
  onDelete?: (id: string) => void
  currentConversationId?: string
}

type Bucket = 'today' | 'week' | 'month' | 'older'

const BUCKET_ORDER: Bucket[] = ['today', 'week', 'month', 'older']

const BUCKET_LABELS: Record<Bucket, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  older: 'Older',
}

function getBucket(dateStr: string, now: Date): Bucket {
  const d = new Date(dateStr)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000)
  if (d >= todayStart) return 'today'
  if (d >= weekAgo) return 'week'
  if (d >= monthAgo) return 'month'
  return 'older'
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

export default function ConversationGroupedList({
  conversations,
  onSelect,
  onDelete,
  currentConversationId,
}: Props) {
  const [expanded, setExpanded] = useState<Record<Bucket, boolean>>({
    today: true,
    week: true,
    month: true,
    older: false,
  })

  if (conversations.length === 0) return null

  const now = new Date()
  const grouped: Record<Bucket, Conversation[]> = { today: [], week: [], month: [], older: [] }
  for (const conv of conversations) {
    grouped[getBucket(conv.updated_at, now)].push(conv)
  }
  for (const bucket of BUCKET_ORDER) {
    grouped[bucket].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }

  const toggle = (bucket: Bucket) =>
    setExpanded(prev => ({ ...prev, [bucket]: !prev[bucket] }))

  return (
    <div>
      {BUCKET_ORDER.filter(b => grouped[b].length > 0).map(bucket => (
        <div key={bucket}>
          <div
            onClick={() => toggle(bucket)}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-text-subtle-dark)',
              padding: '10px 2px 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <span>
              {bucket === 'older'
                ? `Older (${grouped.older.length})`
                : BUCKET_LABELS[bucket]}
            </span>
            <span style={{ fontSize: '10px' }}>{expanded[bucket] ? '∨' : '›'}</span>
          </div>
          {expanded[bucket] && grouped[bucket].map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className="conv-item"
            >
              <div style={{ flex: 1, minWidth: 0, marginRight: onDelete ? '8px' : 0 }}>
                <div
                  className="conv-item-title"
                  style={conv.id === currentConversationId ? { color: 'var(--color-text-on-dark)' } : undefined}
                >
                  {conv.title || 'Untitled conversation'}
                </div>
                <div className="conv-item-date">{formatDate(conv.updated_at)}</div>
              </div>
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(conv.id) }}
                  className="conv-item-delete"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
