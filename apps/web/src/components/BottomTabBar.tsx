'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Home, BookOpen, Users, MessageCircle } from 'lucide-react'

type Tab = {
  label: string
  icon: React.ElementType
  href: string
  matchPrefix?: string
}

const tabs: Tab[] = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Groups', icon: Users, href: '/groups', matchPrefix: '/groups' },
  { label: 'Library', icon: BookOpen, href: '/library', matchPrefix: '/library' },
  { label: 'Chats', icon: MessageCircle, href: '/#conversations' },
]

export default function BottomTabBar() {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (tab: Tab) => {
    if (tab.matchPrefix) return pathname.startsWith(tab.matchPrefix)
    return pathname === '/'
  }

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: '#fff',
        borderTop: '1px solid #e0e0e0',
        display: 'flex',
        alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab)
        const Icon = tab.icon
        return (
          <button
            key={tab.label}
            onClick={() => {
              if (tab.href === '/#conversations') {
                if (pathname !== '/') {
                  router.push('/')
                  setTimeout(() => {
                    document.getElementById('mobile-conversations')?.scrollIntoView({ behavior: 'smooth' })
                  }, 150)
                } else {
                  document.getElementById('mobile-conversations')?.scrollIntoView({ behavior: 'smooth' })
                }
              } else {
                router.push(tab.href)
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: active ? '#1a1a1a' : '#bbb',
              fontSize: '10px',
              fontFamily: 'sans-serif',
              minHeight: '56px',
              paddingTop: '8px',
              paddingBottom: '8px',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
            <span style={{ fontWeight: active ? '600' : '400' }}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
