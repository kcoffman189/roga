'use client'

interface Props {
  message: string
}

export default function AccountPlaceholder({ message }: Props) {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-bg-canvas)' }}>
      {/* Sidebar — hidden on mobile */}
      <div
        className="sidebar-panel"
        style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '22px 20px' }}
      >
        <a
          href="/account"
          style={{
            fontFamily: 'Georgia, serif',
            fontWeight: 400,
            fontSize: '58px',
            letterSpacing: '-0.02em',
            color: 'var(--color-text-on-dark)',
            lineHeight: 1,
            textDecoration: 'none',
          }}
        >
          Roga
        </a>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--color-text-subtle-dark)',
            marginTop: '5px',
          }}
        >
          Beta
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <p
          style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '18px',
            color: 'var(--color-text-tertiary)',
            textAlign: 'center',
            maxWidth: '360px',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
