'use client'

import { useEffect, useRef, useState, RefObject } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

// A/B test flag: swap indices here to reorder steps without structural changes
const STEP_ORDER = [1, 2, 3]

const STEP_COPY: Record<number, string> = {
  1: "Start by adding the books you've been reading, thinking about, or just finished. Aim for 5 to 10 — the more you add, the richer things get.",
  2: "This is where you go when you want to explore a specific book, a chapter you just read, or a connection that's been on your mind. Start a conversation and see where it goes.",
  3: "This is Roga at its most interesting. Ask it to surface something unexpected from your library — a connection you hadn't made, a tension between two things you've read. It gets better the more your library grows.",
}

type Props = {
  userId: string
  supabase: SupabaseClient
  libraryRef: RefObject<HTMLAnchorElement | null>
  digInRef: RefObject<HTMLButtonElement | null>
  interestingRef: RefObject<HTMLButtonElement | null>
}

export default function OnboardingBubbles({ userId, supabase, libraryRef, digInRef, interestingRef }: Props) {
  const [step, setStep] = useState<number | null>(null)
  const [complete, setComplete] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load or create user_profiles row on first load
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('onboarding_step, onboarding_complete')
        .eq('id', userId)
        .maybeSingle()

      if (!data) {
        // Pre-trigger user: insert row manually
        const { data: inserted } = await supabase
          .from('user_profiles')
          .insert({ id: userId, onboarding_step: 1, onboarding_complete: false })
          .select('onboarding_step, onboarding_complete')
          .single()
        if (inserted) {
          setStep(inserted.onboarding_step)
          setComplete(inserted.onboarding_complete)
        }
      } else {
        setStep(data.onboarding_step)
        setComplete(data.onboarding_complete)
      }
    })()
  }, [userId])

  // Update highlight rect when active step changes
  useEffect(() => {
    if (complete || step === null) return
    const stepIndex = STEP_ORDER.indexOf(step)
    const refs = [libraryRef, digInRef, interestingRef]
    const el = refs[stepIndex]?.current

    const updateRect = () => {
      if (el) setTargetRect(el.getBoundingClientRect())
    }

    const timer = setTimeout(updateRect, 50)
    window.addEventListener('resize', updateRect)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateRect)
    }
  }, [step, complete])

  // Step 1: poll library count every 5s, advance automatically at 3 books
  useEffect(() => {
    if (step !== STEP_ORDER[0]) return

    const check = async () => {
      const { count } = await supabase
        .from('library_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
      if (count !== null && count >= 3) {
        if (pollRef.current) clearInterval(pollRef.current)
        await advance(STEP_ORDER[0])
      }
    }

    check()
    pollRef.current = setInterval(check, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [step])

  // Steps 2 & 3: advance when the target button is clicked
  useEffect(() => {
    if (step !== STEP_ORDER[1] && step !== STEP_ORDER[2]) return
    const stepIndex = STEP_ORDER.indexOf(step)
    const refs = [libraryRef, digInRef, interestingRef]
    const el = refs[stepIndex]?.current
    if (!el) return

    const handler = () => { advance(step) }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [step])

  const advance = async (currentStep: number) => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx === -1) return
    const isLast = idx === STEP_ORDER.length - 1

    if (isLast) {
      await supabase
        .from('user_profiles')
        .update({ onboarding_complete: true })
        .eq('id', userId)
      setComplete(true)
    } else {
      const next = STEP_ORDER[idx + 1]
      await supabase
        .from('user_profiles')
        .update({ onboarding_step: next })
        .eq('id', userId)
      setStep(next)
    }
  }

  if (complete || step === null || !targetRect) return null

  const stepIndex = STEP_ORDER.indexOf(step)
  const total = STEP_ORDER.length

  return (
    <>
      {/* Highlight ring around target element */}
      <div
        style={{
          position: 'fixed',
          top: targetRect.top - 3,
          left: targetRect.left - 3,
          width: targetRect.width + 6,
          height: targetRect.height + 6,
          border: '2px solid #c8a96e',
          borderRadius: '9px',
          pointerEvents: 'none',
          zIndex: 999,
        }}
      />

      {/* Numbered bubble + tooltip */}
      <div
        style={{
          position: 'fixed',
          top: targetRect.top + targetRect.height / 2 - 14,
          left: targetRect.right + 14,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}
      >
        {/* Number circle */}
        <div
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '50%',
            background: '#c8a96e',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: '600',
            flexShrink: 0,
            marginTop: '1px',
          }}
        >
          {stepIndex + 1}
        </div>

        {/* Tooltip card */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #e8e0d4',
            borderRadius: '10px',
            padding: '14px 16px',
            maxWidth: '260px',
            boxShadow: '0 2px 14px rgba(0,0,0,0.07)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#c8a96e',
              fontWeight: '600',
              marginBottom: '8px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {stepIndex + 1} of {total}
          </div>
          <div style={{ fontSize: '13px', color: '#3a3028', lineHeight: '1.65' }}>
            {STEP_COPY[step]}
          </div>
        </div>
      </div>
    </>
  )
}
