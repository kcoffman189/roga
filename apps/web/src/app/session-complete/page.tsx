"use client";
import { useSearchParams } from 'next/navigation';
import SessionComplete from '@/components/SessionComplete';

export default function SessionCompletePage() {
  const searchParams = useSearchParams();

  // Get data from URL params or use defaults for demo
  const rounds = parseInt(searchParams.get('rounds') || '5');
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