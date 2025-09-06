'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ScoreCard, { RogaFeedback } from '@/components/ScoreCard';
import scenariosData from '@/data/scenarios.json';

/* ----------------------------- Types & helpers ----------------------------- */

type Scenario = {
  id: number;
  title: string;
  prompt: string;
};

/** Deterministic daily index so all users see the same “first” scenario each day. */
function pickDailyIndex(len: number): number {
  const d = new Date();
  const seed = Number(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate(),
    ).padStart(2, '0')}`,
  );
  // Simple hash -> 0..len-1
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ (h >>> 13), 16777619);
  h ^= h >>> 16;
  return Math.abs(h) % Math.max(len, 1);
}

/** Map API -> UI with safe fallbacks so the card always renders cleanly. */
function normalizeFeedback(
  api: any,
  fallback: { scenarioTitle: string; scenarioText: string; question: string },
): RogaFeedback {
  return {
    scenario: {
      title:
        api?.scenario?.title ??
        // a few possible variants we’ve seen:
        api?.scenarioTitle ??
        "Today’s Scenario",
      text:
        api?.scenario?.text ??
        api?.scenarioText ??
        fallback.scenarioText ??
        '',
    },
    question: api?.question ?? api?.userQuestion ?? fallback.question ?? '',
    score: Math.round(api?.score ?? api?.total ?? 0),
    rubric: (api?.rubric ?? api?.dimensions ?? []).map((r: any) => ({
      key: String(r?.key ?? r?.name ?? 'clarity').toLowerCase(),
      label: r?.label ?? r?.name ?? 'Clarity',
      status: (r?.status ?? r?.level ?? 'warn') as 'good' | 'warn' | 'bad',
      note: r?.note ?? r?.comment ?? '',
    })),
    proTip: api?.proTip ?? api?.tip ?? 'No pro tip provided.',
    suggestedUpgrade:
      api?.suggestedUpgrade ??
      api?.upgrade ??
      'Try refining your question to be more specific.',
    badge: api?.badge
      ? { name: api.badge.name, label: api.badge.label ?? api.badge.name }
      : undefined,
  };
}

/* --------------------------------- Page UI -------------------------------- */

export default function GamePage() {
  // scenario source
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [idx, setIdx] = useState<number | null>(null);

  // user interaction
  const [userQuestion, setUserQuestion] = useState('');
  const [feedback, setFeedback] = useState<RogaFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load scenarios and establish a stable index
  useEffect(() => {
    setScenarios(scenariosData as Scenario[]);
    const stored = localStorage.getItem('roga_current_idx');
    if (stored != null) {
      setIdx(parseInt(stored, 10));
    } else {
      const initial = pickDailyIndex((scenariosData as Scenario[]).length);
      setIdx(initial);
      localStorage.setItem('roga_current_idx', String(initial));
    }
  }, []);

  const current = useMemo(
    () => (idx != null && scenarios.length ? scenarios[idx] : null),
    [idx, scenarios],
  );

  const shuffle = useCallback(() => {
    if (scenarios.length < 2 || idx == null) return;
    const next = (idx + 1) % scenarios.length;
    setIdx(next);
    localStorage.setItem('roga_current_idx', String(next));
    setUserQuestion('');
    setFeedback(null);
    setError(null);
  }, [idx, scenarios.length]);

  /** Submit via Next.js API proxy to avoid CORS/mixed-content issues. */
  const submit = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // include both legacy and new keys; backend can accept either
          user_question: userQuestion,
          question: userQuestion,
          scenario_id: current.id,
          scenarioId: current.id,
        }),
        cache: 'no-store',
      });

      const api = await res.json();
      // Helpful diagnostics (safe to leave; remove if you prefer quieter logs)
      console.log('🔍 API raw response:', api);

      if (!res.ok) {
        throw new Error(api?.detail || api?.error || res.statusText || 'Request failed');
      }

      const normalized = normalizeFeedback(api, {
        scenarioTitle: current.title,
        scenarioText: current.prompt,
        question: userQuestion,
      });

      console.log('✅ Normalized feedback:', normalized);
      setFeedback(normalized);
    } catch (err: any) {
      setError(err?.message ?? 'Request failed');
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  }, [current, userQuestion]);

  /* --------------------------------- Render -------------------------------- */

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-gray-500">Loading scenarios…</p>
      </div>
    );
  }

  // If we have feedback, show the polished card
  if (feedback) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-3xl font-semibold mb-6">Quick Challenge</h1>

        <ScoreCard data={feedback} />

        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 rounded border"
            onClick={() => {
              setFeedback(null);
              setUserQuestion('');
              setError(null);
            }}
          >
            Ask again
          </button>
          <button className="px-4 py-2 rounded border" onClick={shuffle}>
            Next scenario
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
      </div>
    );
  }

  // Otherwise show the input form
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
            setError(null);
          }}
        >
          Reset
        </button>

        <button className="px-4 py-2 rounded border" onClick={shuffle}>
          Shuffle scenario
        </button>
      </div>

      {error && <div className="rounded border p-4 bg-red-50 text-red-700">{error}</div>}

      {!error && (
        <div className="rounded border p-4 bg-rose-50 text-rose-700">
          No feedback returned.
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
    </div>
  );
}
