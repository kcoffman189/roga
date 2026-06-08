'use client'

export const dynamic = 'force-dynamic'

import { createSupabaseClient } from '@/lib/supabase/client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/hooks/useIsMobile'
import BottomTabBar from '@/components/BottomTabBar'

type Section = {
  label: string
  danger?: boolean
  rows: { label: string; href: string; danger?: boolean }[]
}

const sections: Section[] = [
  {
    label: 'Account',
    rows: [
      { label: 'Change Password', href: '/account/password' },
      { label: 'Change Email', href: '/account/email' },
    ],
  },
  {
    label: 'Subscription',
    rows: [{ label: 'Manage Subscription', href: '/account/subscription' }],
  },
  {
    label: 'Preferences',
    rows: [{ label: 'Notifications', href: '/account/notifications' }],
  },
  {
    label: 'Legal',
    rows: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
    ],
  },
  {
    label: 'Danger Zone',
    danger: true,
    rows: [{ label: 'Delete Account', href: '/account/delete', danger: true }],
  },
]

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current
  const isMobile = useIsMobile()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setEmail(user.email ?? null)
    }
    init()
  }, [])

  const content = (
    <div style={{ maxWidth: '480px', width: '100%', padding: isMobile ? '24px 20px 100px' : '48px' }}>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '26px',
          color: 'var(--color-text-primary)',
          marginBottom: '20px',
        }}
      >
        Account
      </div>

      <div style={{ marginBottom: '4px' }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: 'var(--color-text-tertiary)',
            marginBottom: '4px',
          }}
        >
          Signed in as
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: 'var(--color-text-primary)' }}>
          {email ?? '—'}
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.label}>
          <div
            className="account-section-label"
            style={section.danger ? { color: '#B94040' } : undefined}
          >
            {section.label}
          </div>
          {section.rows.map((row) => (
            <a
              key={row.href}
              href={row.href}
              className="account-row"
              style={row.danger ? { color: '#B94040' } : undefined}
            >
              <span>{row.label}</span>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: '20px', lineHeight: 1 }}>›</span>
            </a>
          ))}
        </div>
      ))}
    </div>
  )

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-bg-canvas)' }}>
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
            background: 'var(--color-bg-canvas)', borderBottom: '1px solid var(--color-border-light)',
            padding: '10px 20px', display: 'flex', alignItems: 'flex-end',
          }}
        >
          <a
            href="/home"
            style={{
              fontFamily: 'Georgia, serif', fontSize: '29px', letterSpacing: '-0.02em',
              lineHeight: 1, color: 'var(--color-text-primary)', textDecoration: 'none',
            }}
          >
            Cephos
          </a>
        </div>
        <div style={{ flex: 1, paddingTop: '72px', overflowY: 'auto' }}>
          {content}
        </div>
        <BottomTabBar />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-canvas)' }}>
      <div className="sidebar-panel" style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '22px 20px' }}>
        <a
          href="/home"
          style={{
            fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: '58px',
            letterSpacing: '-0.02em', color: 'var(--color-text-on-dark)', lineHeight: 1, textDecoration: 'none',
          }}
        >
          Cephos
        </a>
        <div
          style={{
            fontFamily: 'Inter, sans-serif', fontSize: '12px', letterSpacing: '0.2em',
            textTransform: 'uppercase', color: 'var(--color-text-subtle-dark)', marginTop: '5px', marginBottom: '28px',
          }}
        >
          Beta
        </div>
        <a href="/groups" className="sidebar-nav-link">Groups</a>
        <a href="/library" className="sidebar-nav-link">My Library</a>
        <div style={{ flex: 1 }} />
        <button
          onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
          className="sidebar-logout"
          style={{ marginTop: 0 }}
        >
          Log out
        </button>
        <a href="/account" className="sidebar-account-link" style={{ color: 'var(--color-text-muted-dark)' }}>
          Account
        </a>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {content}
      </div>
    </div>
  )
}
