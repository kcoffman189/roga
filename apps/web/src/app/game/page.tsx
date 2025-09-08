'use client';

import { useCallback, useEffect, useState } from 'react';
import scenariosData from '@/data/scenarios.json';
import ScoreCard from '@/components/ScoreCard';

// Types shared with the API
type RubricStatus = 'good' | 'warn' | 'bad';
type RubricKey = 'clarity' | 'depth' | 'insight' | 'openness';

type ApiRubricItem = {
  key: RubricKey;
  label: string;
  status: RubricStatus;
  note: string;
};

type ApiBadge = { name: string; label?: string };

type AskApiResponse = {
  scenario: { title: string; text: string };
  question: string;
  score: number;
  rubric: ApiRubricItem[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: ApiBadge;
};

// UI model used by <ScoreCard />
export type RogaFeedback = {
  scenario: { title: string; text: string };
  question: string;
  score: number;
  rubric: { key: RubricKey; label: string; status: RubricStatus; note: string }[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: { name: string; label?: string };
};

type Scenario = { id: number; title: string; prompt: string };

// Deterministic “daily” index
function pickDailyIndex(len: number): number {
  const d = new Date();
  const seed = Number(
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(
      d.getUTCDate()
    ).padStart(2, '0')}`
  );
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ (h >>> 13), 16777619);
  h ^= h >>> 16;
  return Math.abs(h) % len;
}

// Map API -> UI
function normalizeFeedback(
  api: AskApiResponse,
  fallback: { scenarioTitle: string; scenarioText: string; question: string }
): RogaFeedback {
  return {
    scenario: {
      title:
        api?.scenario?.title ??
        fallback.scenarioTitle ??
        "Today’s Scenario",
      text:
        api?.scenario?.text ??
        fallback.scenarioText ??
        '',
    },
    question: api?.question ?? fallback.question ?? '',
    score: Math.round(api?.score ?? 0),
    rubric: (api?.rubric ?? []).map((r) => ({
      key: (r.key ?? 'clarity') as RubricKey,
      label: r.label ?? 'Clarity',
      status: (r.status ?? 'warn') as RubricStatus,
      note: r.note ?? '',
    })),
    proTip: api?.proTip ?? '',
    suggestedUpgrade: api?.suggestedUpgrade ?? '',
    badge: api?.badge ? { name: api.badge.name, label: api.badge.label } : undefined,
  };
}

export default function GamePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [idx, setIdx] = useState<number | null>(null);
  const [userQuestion, setUserQuestion] = useState('');
  const [feedback, setFeedback] = useState<RogaFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load scenarios & initial index
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

  const current =
    idx !== null && scenarios.length > 0 ? scenarios[idx] : null;

  const shuffle = useCallback(() => {
    if (scenarios.length < 2 || idx === null) return;
    const next =
      (idx + 1 + Math.floor(Math.random() * (scenarios.length - 1))) %
      scenarios.length;
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
    setFeedback(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,      // new
          user_question: userQuestion, // legacy
          scenarioId: current.id,      // new
          scenario_id: current.id,     // legacy
        }),
      });

      if (!res.ok) {
        let message = 'Request failed';
        try {
          const e = (await res.json()) as { error?: string };
          if (e?.error) message = e.error;
        } catch {
          // ignore
        }
        throw new Error(message);
      }

      const api = (await res.json()) as AskApiResponse;

      if (api && (typeof api.score === 'number' || Array.isArray(api.rubric))) {
        setFeedback(
          normalizeFeedback(api, {
            scenarioTitle: current.title,
            scenarioText: current.prompt,
            question: userQuestion,
          })
        );
      } else {
        setError('No structured feedback returned.');
      }
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : 'Failed to fetch';
      setError(message);
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

      {feedback && <ScoreCard feedback={feedback} />}

      {error && (
        <div className="mt-4 rounded border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
    </div>
  );
}
