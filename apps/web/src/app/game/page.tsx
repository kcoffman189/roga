'use client';

import { useEffect, useState, useCallback } from 'react';
import scenariosData from '../../data/scenarios.json';
import ScoreCard, { RogaFeedback } from '../../components/ScoreCard';

type Scenario = {
  id: number;
  title: string;
  prompt: string;
};

// ---------- utils ----------
function pickDailyIndex(len: number): number {
  const d = new Date();
  const seed = Number(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`
  );
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ (h >>> 13), 16777619);
  h ^= h >>> 16;
  return Math.abs(h) % len;
}

// Map API -> UI with local fallbacks so the card still renders nicely
function normalizeFeedback(
  api: any,
  fallback: { scenarioTitle: string; scenarioText: string; question: string }
): RogaFeedback {
  return {
    scenario: {
      title: api?.scenario?.title ?? fallback.scenarioTitle ?? "Today’s Scenario",
      text: api?.scenario?.text ?? api?.scenarioText ?? fallback.scenarioText ?? "",
    },
    question: api?.question ?? api?.userQuestion ?? fallback.question ?? "",
    score: Math.round(api?.score ?? api?.total ?? 0),
    rubric: (api?.rubric ?? api?.dimensions ?? []).map((r: any) => ({
      key: (r.key ?? r.name ?? 'clarity').toLowerCase(),
      label: r.label ?? r.name ?? 'Clarity',
      status: (r.status ?? r.level ?? 'warn') as 'good' | 'warn' | 'bad',
      note: r.note ?? r.comment ?? '',
    })),
    proTip: api?.proTip ?? api?.tip ?? '',
    suggestedUpgrade: api?.suggestedUpgrade ?? api?.upgrade ?? '',
    badge: api?.badge
      ? { name: api.badge.name, label: api.badge.label ?? api.badge.name }
      : undefined,
  };
}

// ---------- page ----------
export default function GamePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [idx, setIdx] = useState<number | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [feedback, setFeedback] = useState<RogaFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // load scenarios + select “daily” index once
  useEffect(() => {
    setScenarios(scenariosData as Scenario[]);
    const stored = localStorage.getItem('roga_current_idx');
    if (stored) {
      setIdx(parseInt(stored, 10));
    } else {
      const initial = pickDailyIndex((scenariosData as Scenario[]).length);
      setIdx(initial);
      localStorage.setItem('roga_current_idx', String(initial));
    }
  }, []);

  const current = idx !== null && scenarios.length > 0 ? scenarios[idx] : null;

  const shuffle = useCallback(() => {
    if (scenarios.length < 2 || idx === null) return;
    const next = (idx + 1 + Math.floor(Math.random() * (scenarios.length - 1))) % scenarios.length;
    setIdx(next);
    localStorage.setItem('roga_current_idx', String(next));
    setUserQuestion('');
    setFeedback(null);
    setError(null);
  }, [idx, scenarios.length]);

  const submit = useCallback(async () => {
    if (!current) return;
    setLoading(true);
    setError(null);

    try {
      // Proxy via Next.js API route -> /api/ask
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_question: userQuestion, // legacy keys (FastAPI)
          question: userQuestion,      // new keys (forward-compat)
          scenario_id: current.id,
          scenarioId: current.id,
        }),
      });

      console.log('Response status:', res.status);
      const text = await res.text();
      console.log('Raw response:', text);

      if (!res.ok) throw new Error(text || 'Request failed');

      const api = JSON.parse(text);

      setFeedback(
        normalizeFeedback(api, {
          scenarioTitle: current.title,
          scenarioText: current.prompt,
          question: userQuestion,
        })
      );
    } catch (e: any) {
      setError(e?.message ?? 'Request failed');
      setFeedback(null);
    } finally {
      setLoading(false);
    }
  }, [current, userQuestion]);

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

      {feedback ? (
        <>
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
        </>
      ) : (
        <>
          <div className="mb-4 text-gray-600">
            <p className="font-medium">{current.title}</p>
            <p className="mt-1">{current.prompt}</p>
          </div>

          <textarea
            className="w-full border rounded p-3 mb-3"
            rows={6}
            placeholder="Type your question…"
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
          />

          <div className="flex gap-3 mb-2">
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

          {error && <div className="rounded border p-3 bg-red-50 text-red-700">{error}</div>}
        </>
      )}

      <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
    </div>
  );
}
