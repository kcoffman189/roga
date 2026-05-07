'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<'success' | 'error' | null>(null)
  const [forgotLoading, setForgotLoading] = useState(false)
  const router = useRouter()
  const supabase = useRef(createSupabaseClient()).current

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/home'
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail) return
    setForgotLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setForgotLoading(false)
    setForgotStatus(error ? 'error' : 'success')
  }

  const handleLogIn = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      window.location.href = '/home'
    }
  }

  return (
    <>
      <style>{`
        .lp-input::placeholder { color: #B0ACA6; }
        .lp-input:focus { border-color: #C45E0A; outline: none; }
        .lp-btn:hover { background: #1A1A1A !important; }
        .lp-signin-link { color: #6B6B6B; text-decoration: underline; cursor: pointer; background: none; border: none; font-size: 11px; padding: 0; }
        .lp-signin-link:hover { color: #C45E0A; }
        .lp-forgot-link { font-size: 13px; color: var(--color-text-secondary); background: none; border: none; padding: 0; cursor: pointer; text-decoration: none; font-family: Inter, sans-serif; display: block; margin-bottom: 12px; text-align: left; }
        .lp-forgot-link:hover { text-decoration: underline; }
        @media (max-width: 767px) {
          .lp-hero { flex-direction: column !important; min-height: unset !important; }
          .lp-sidebar {
            width: 100% !important;
            height: auto !important;
            padding: 20px 24px !important;
            flex-direction: row !important;
            align-items: center !important;
            justify-content: space-between !important;
          }
          .lp-sidebar::after {
            top: auto !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: auto !important;
            height: 3px !important;
          }
          .lp-sidebar-wordmark { font-size: 28px !important; }
          .lp-sidebar-bottom { display: none !important; }
          .lp-hero-content { padding: 32px 24px !important; }
          .lp-hiw { padding: 28px 24px !important; }
          .lp-steps { flex-direction: column !important; }
          .lp-footer { padding: 20px 24px !important; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section
        className="lp-hero"
        style={{ display: 'flex', minHeight: 'auto' }}
      >
        {/* Sidebar */}
        <div
          className="lp-sidebar"
          style={{
            width: '240px',
            flexShrink: 0,
            background: '#272C32',
            padding: '36px 28px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <style>{`
            .lp-sidebar::after {
              content: '';
              position: absolute;
              right: 0;
              top: 0;
              bottom: 0;
              width: 3px;
              background: #C45E0A;
            }
          `}</style>

          {/* Top: wordmark */}
          <div style={{ display: 'block', marginBottom: '24px', width: '100%', maxWidth: '330px', marginLeft: '-12px' }}>
            <svg width="300" height="auto" viewBox="0 0 290 76" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(14, 2)">
                <g transform="rotate(-30 24 24)">
                  <line x1="14" y1="33" x2="36" y2="12" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="12" x2="36" y2="36" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="12" x2="36" y2="12" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="36" y1="12" x2="36" y2="36" stroke="#C45E0A" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="12" r="4" fill="#C45E0A"/>
                  <circle cx="36" cy="12" r="4" fill="#C45E0A"/>
                  <circle cx="14" cy="33" r="5" fill="#C45E0A"/>
                  <circle cx="36" cy="36" r="4" fill="#C45E0A"/>
                </g>
              </g>
              <text x="62" y="42" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="#EEECEA">Roga</text>
              <text x="62" y="63" fontFamily="Inter, Arial, sans-serif" fontSize="9" fontWeight="500" letterSpacing="1.5" fill="#C45E0A">YOUR LIBRARY. MORE CONNECTED.</text>
            </svg>
          </div>

          {/* Bottom: library preview */}
          <div className="lp-sidebar-bottom">
            <div
              style={{
                fontSize: '8px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#3E4650',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Your library
            </div>

            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: '12px',
                color: '#B8C0C8',
                padding: '5px 0 5px 10px',
                borderLeft: '2px solid #C45E0A',
                marginBottom: '4px',
              }}
            >
              Let&apos;s dig into something
            </div>

            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: '12px',
                color: '#4E5660',
                padding: '5px 0 5px 10px',
                borderLeft: '1px solid #343C44',
                marginBottom: '12px',
              }}
            >
              Tell me something interesting
            </div>

            <div
              style={{
                fontSize: '8px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#3E4650',
                marginBottom: '6px',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Recent
            </div>

            {['Frankl vs Solzhenitsyn...', 'Systems Thinking...', 'Range & Specialization...'].map((title) => (
              <div
                key={title}
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '12px',
                  color: '#4E5660',
                  padding: '5px 0 5px 10px',
                  borderLeft: '1px solid #343C44',
                  marginBottom: '4px',
                }}
              >
                {title}
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div
          className="lp-hero-content"
          style={{
            flex: 1,
            background: '#FAF8F4',
            padding: '32px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {/* Headline */}
          <div>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '26px',
                lineHeight: 1.5,
                color: '#1A1A1A',
                fontStyle: 'normal',
              }}
            >
              You read across everything.
            </div>
            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '26px',
                lineHeight: 1.5,
                color: '#C45E0A',
                fontStyle: 'italic',
              }}
            >
              Roga finds what your books have been saying to each other.
            </div>
          </div>

          {/* Subheadline */}
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              color: '#6B6B6B',
              lineHeight: 1.7,
              maxWidth: '340px',
              marginTop: '6px',
              marginBottom: '16px',
            }}
          >
            A thinking partner built around your personal library. Add the books you&apos;ve read. Let Roga surface the threads between them.
          </p>

          {/* Divider */}
          <hr
            style={{
              width: '44px',
              height: '2px',
              background: '#C45E0A',
              border: 'none',
              marginBottom: '16px',
              display: 'block',
              marginLeft: 0,
            }}
          />

          {/* Signup form */}
          <form onSubmit={handleSignUp} style={{ maxWidth: '300px' }}>
            <input
              className="lp-input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: '#FFFFFF',
                border: '1px solid #E4E0DA',
                borderRadius: '4px',
                padding: '10px 14px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: '#1A1A1A',
                width: '100%',
                marginBottom: '8px',
                boxSizing: 'border-box',
                display: 'block',
              }}
            />
            <input
              className="lp-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                background: '#FFFFFF',
                border: '1px solid #E4E0DA',
                borderRadius: '4px',
                padding: '10px 14px',
                fontSize: '13px',
                fontFamily: 'Inter, sans-serif',
                color: '#1A1A1A',
                width: '100%',
                marginBottom: '8px',
                boxSizing: 'border-box',
                display: 'block',
              }}
            />

            {/* Forgot password */}
            {!forgotOpen && (
              <button type="button" className="lp-forgot-link" onClick={() => setForgotOpen(true)}>
                Forgot password?
              </button>
            )}
            {forgotOpen && forgotStatus === null && (
              <div style={{ marginBottom: '12px' }}>
                <input
                  className="lp-input"
                  type="email"
                  placeholder="Email address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E4E0DA',
                    borderRadius: '4px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    fontFamily: 'Inter, sans-serif',
                    color: '#1A1A1A',
                    width: '100%',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  className="lp-btn"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  style={{
                    background: '#272C32',
                    color: '#EEECEA',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '13px 24px',
                    border: 'none',
                    borderRadius: '2px',
                    width: '100%',
                    cursor: forgotLoading ? 'default' : 'pointer',
                    position: 'relative',
                    transition: 'background 150ms ease',
                    display: 'block',
                    boxSizing: 'border-box',
                  }}
                >
                  <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: '#C45E0A' }} />
                  {forgotLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            )}
            {forgotOpen && forgotStatus === 'success' && (
              <p style={{ fontSize: '12px', color: '#6B6B6B', marginBottom: '12px', marginTop: 0, fontFamily: 'Inter, sans-serif' }}>
                If that email is registered, a reset link is on its way.
              </p>
            )}
            {forgotOpen && forgotStatus === 'error' && (
              <p style={{ fontSize: '12px', color: '#C45E0A', marginBottom: '12px', marginTop: 0, fontFamily: 'Inter, sans-serif' }}>
                Something went wrong. Please try again.
              </p>
            )}

            <button
              className="lp-btn"
              type="submit"
              disabled={loading}
              style={{
                background: '#272C32',
                color: '#EEECEA',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '13px 24px',
                border: 'none',
                borderRadius: '2px',
                width: '100%',
                cursor: loading ? 'default' : 'pointer',
                position: 'relative',
                transition: 'background 150ms ease',
                display: 'block',
                boxSizing: 'border-box',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: '#C45E0A',
                }}
              />
              {loading ? 'Joining...' : 'Join the beta'}
            </button>

            <button
              className="lp-btn"
              type="button"
              disabled={loading}
              onClick={handleLogIn}
              style={{
                background: '#272C32',
                color: '#EEECEA',
                fontFamily: 'Inter, sans-serif',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '13px 24px',
                border: 'none',
                borderRadius: '2px',
                width: '100%',
                cursor: loading ? 'default' : 'pointer',
                position: 'relative',
                transition: 'background 150ms ease',
                display: 'block',
                boxSizing: 'border-box',
                marginTop: '8px',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '3px',
                  background: '#C45E0A',
                }}
              />
              {loading ? 'Loading...' : 'Log in'}
            </button>

            {error && (
              <p style={{ fontSize: '12px', color: '#C45E0A', marginTop: '8px', marginBottom: 0 }}>
                {error}
              </p>
            )}
          </form>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="lp-hiw"
        style={{
          borderTop: '1px solid #E4E0DA',
          background: '#FAF8F4',
          padding: '32px 48px 32px 288px',
        }}
      >
        <div
          style={{
            fontSize: '9px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#C45E0A',
            marginBottom: '12px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          How it works
        </div>

        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '22px',
            color: '#1A1A1A',
            marginBottom: '24px',
            fontStyle: 'normal',
          }}
        >
          Three steps to a richer reading life.
        </div>

        <div className="lp-steps" style={{ display: 'flex', gap: '32px' }}>
          {[
            {
              num: '01',
              title: 'Build your library',
              body: "Add the books you've read — start with 5 to 10. Roga builds a picture of your intellectual world from what you've actually consumed.",
            },
            {
              num: '02',
              title: 'Let Roga initiate',
              body: 'Ask Roga to surprise you. It surfaces unexpected connections between your books — threads you didn\'t know were there.',
            },
            {
              num: '03',
              title: 'Curate your collections',
              body: "Group books together around a theme, topic, or moment in your reading life. Then let Roga find the connections within that specific collection.",
            },
          ].map(({ num, title, body }) => (
            <div key={num} style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: '28px',
                  color: '#E4E0DA',
                  lineHeight: 1,
                  marginBottom: '12px',
                }}
              >
                {num}
              </div>
              <hr
                style={{
                  width: '24px',
                  height: '2px',
                  background: '#C45E0A',
                  border: 'none',
                  marginBottom: '12px',
                  display: 'block',
                  marginLeft: 0,
                }}
              />
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1A1A1A',
                  marginBottom: '6px',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#6B6B6B',
                  lineHeight: 1.65,
                }}
              >
                {body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="lp-footer"
        style={{
          borderTop: '1px solid #E4E0DA',
          background: '#FAF8F4',
          padding: '20px 48px 20px 288px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '14px',
            color: '#B0ACA6',
          }}
        >
          Roga
        </span>
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            letterSpacing: '0.04em',
            color: '#B0ACA6',
          }}
        >
          &copy; 2026 Roga. Private beta.
        </span>
      </footer>
    </>
  )
}
