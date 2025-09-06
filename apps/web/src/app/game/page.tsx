'use client';

import { useCallback, useEffect, useState } from 'react';
import scenariosData from '@/data/scenarios.json';
import ScoreCard, { RogaFeedback } from '@/components/ScoreCard';

/* ---------- Types ---------- */

type Scenario = {
  id: number;
  title: string;
  prompt: string;
};

/* ---------- Helpers ---------- */

// Stable “daily” index so all users see the same start each day (deterministic, not random)
function pickDailyIndex(len: number): number {
  const d = new Date();
  const seed = Number(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`,
  );
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ (h >>> 13), 16777619);
  h ^= h >>> 16;
  return Math.abs(h) % len;
}

// Map API -> UI with local fallbacks so the card still renders nicely
function normalizeFeedback(
  api: any,
  fallback: { scenarioTitle: string; scenarioText: string; question: string },
): RogaFeedback {
  const score =
    typeof api?.score === 'number'
      ? Math.round(api.score)
      : typeof api?.total === 'number'
      ? Math.round(api.total)
      : 0;

  const rawRubric = api?.rubric ?? api?.dimensions ?? [];
  const rubric = Array.isArray(rawRubric)
    ? rawRubric.map((r: any) => ({
        key: String(r?.key ?? r?.name ?? 'clarity').toLowerCase(),
        label: r?.label ?? r?.name ?? 'Clarity',
        status: (r?.status ?? r?.level ?? 'warn') as 'good' | 'warn' | 'bad',
        note: r?.note ?? r?.comment ?? '',
      }))
    : [];

  return {
    scenario: {
      title:
        api?.scenario?.title ??
        api?.scenarioTitle ??
        fallback.scenarioTitle ??
        'Today’s Scenario',
      text:
        api?.scenario?.text ??
        api?.scenarioText ??
        fallback.scenarioText ??
        '',
    },
    question: api?.question ?? api?.userQuestion ?? fallback.question ?? '',
    score,
    rubric,
    proTip: api?.proTip ?? api?.tip ?? '',
    suggestedUpgrade: api?.suggestedUpgrade ?? api?.upgrade ?? '',
    badge: api?.badge
      ? { name: api.badge.name, label: api.badge.label ?? api.badge.name }
      : undefined,
  };
}

/* ---------- Page Component ---------- */

export default function GamePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [idx, setIdx] = useState<number | null>(null); // controls which scenario shows
  const [userQuestion, setUserQuestion] = useState('');
  const [feedback, setFeedback] = useState<RogaFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scenarios & lock initial scenario index
  useEffect(() => {
    setScenarios(scenariosData as Scenario[]);

    const stored = typeof window !== 'undefined' ? localStorage.getItem('roga_current_idx') : null;
    if (stored) {
      setIdx(parseInt(stored, 10));
    } else {
      const initial = pickDailyIndex((scenariosData as Scenario[]).length);
      setIdx(initial);
      try {
        localStorage.setItem('roga_current_idx', String(initial));
      } catch {}
    }
  }, []);

  const current = idx !== null && scenarios.length > 0 ? scenarios[idx] : null;

  const shuffle = useCallback(() => {
    if (scenarios.length < 2 || idx === null) return;
    const next = (idx + 1 + Math.floor(Math.random() * (scenarios.length - 1))) % scenarios.length;
    setIdx(next);
    try {
      localStorage.setItem('roga_current_idx', String(next));
    } catch {}
    setUserQuestion('');
    setFeedback(null);
    setError(null);
  }, [idx, scenarios.length]);

  /* ---------- Fixed submit() ---------- */
  const submit = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      // Always go through our Next.js API proxy to avoid CORS/mixed-content issues
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Send both legacy and new fields so either backend shape works
          user_question: userQuestion, // legacy
          question: userQuestion, // new
          scenario_id: current.id, // legacy
          scenarioId: current.id, // new
        }),
        cache: 'no-store',
      });

      const api = await res.json();

      if (!res.ok) {
        throw new Error(api?.detail || api?.error || res.statusText || 'Request failed');
      }

      // ✅ Normalize the API response into our ScoreCard shape
      setFeedback(
        normalizeFeedback(api, {
          scenarioTitle: current.title,
          scenarioText: current.prompt,
          question: userQuestion,
        }),
      );
    } catch (err: any) {
      setError(err?.message ?? 'Request failed');
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  }, [current, userQuestion]);

  /* ---------- UI ---------- */

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-gray-500">Loading scenarios…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold mb-6">Quick Challenge</h1>

      <div className="mb-4 text-gray-700">
        <p className="font-medium">{current.title}</p>
        <p className="mt-1">{current.prompt}</p>
      </div>

      <textarea
        className="w-full border rounded p-3 mb-3"
        rows={8}
        placeholder="Type your question…"
        value={userQuestion}
        onChange={(e) => setUserQuestion(e.target.value)}
      />

      <div className="flex gap-3 mb-4">
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
          onClick={submit}
          disabled={loading || !userQuestion.trim()}
        >
          {loading ? 'Scoring…' : 'Submit'}
        </button>

        <button
          className="px-4 py-2 rounded border"
          onClick={() => {
            setUserQuestion('');
            setFeedback(null);
            setError(null);
          }}
        >
          Reset
        </button>

        <button className="px-4 py-2 rounded border" onClick={shuffle}>
          Shuffle scenario
        </button>
      </div>

      {error && (
        <div className="rounded border p-4 bg-red-50 text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* When we have feedback, show the ScoreCard */}
      {feedback && <ScoreCard data={feedback} />}

      {!feedback && !error && (
        <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
      )}
    </div>
  );
}
