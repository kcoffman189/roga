"use client";
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SessionComplete from '@/components/SessionComplete';

function SessionCompleteContent() {
  const searchParams = useSearchParams();

  // Get data from URL params or use defaults for demo
  const rounds = parseInt(searchParams.get('rounds') || '3');
  const avgScore = parseInt(searchParams.get('avgScore') || '75');
  const levelLabel = searchParams.get('levelLabel') || 'Level 1 • Explorer';
  const streak = searchParams.get('streak') ? parseInt(searchParams.get('streak')!) : 3;
  const bestQuestion = searchParams.get('bestQuestion') || 'What would success look like from your perspective next week?';

  // Parse strengths and growth from URL params or use defaults
  const strengthsParam = searchParams.get('strengths');
  const growthParam = searchParams.get('growth');

  const strengths = strengthsParam
    ? { title: "Strengths", bullets: strengthsParam.split('|') }
    : { title: "Strengths", bullets: ["Curious follow-ups", "Stayed on topic", "Great use of empathy"] };

  const growth = growthParam
    ? { title: "Areas for growth", bullets: growthParam.split('|') }
    : { title: "Areas for growth", bullets: ["Tighten clarity", "Ask for specifics", "Explore deeper assumptions"] };

  return (
    <SessionComplete
      rounds={rounds}
      avgScore={avgScore}
      levelLabel={levelLabel}
      streak={streak}
      strengths={strengths}
      growth={growth}
      bestQuestion={bestQuestion}
    />
  );
}

export default function SessionCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-fog flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal mx-auto mb-4"></div>
        <p className="text-coal/70">Loading your session results...</p>
      </div>
    </div>}>
      <SessionCompleteContent />
    </Suspense>
  );
}