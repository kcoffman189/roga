'use client';

import { useEffect, useState, useCallback } from 'react';
import scenariosData from '@/data/scenarios.json';

type Scenario = {
  id: number;
  title: string;
  prompt: string;
};

// (Optional) stable “daily” index so all users see the same first scenario each day.
// You can keep this, or switch to a simple random if you prefer.
function pickDailyIndex(len: number): number {
  const d = new Date();
  const seed = Number(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`);
  // Simple deterministic hash -> 0..len-1
  let h = 2166136261 ^ seed;
  h = Math.imul(h ^ (h >>> 13), 16777619);
  h ^= h >>> 16;
  return Math.abs(h) % len;
}

export default function GamePage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [idx, setIdx] = useState<number | null>(null); // the ONLY place that controls which scenario shows
  const [userQuestion, setUserQuestion] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load scenarios once
  useEffect(() => {
    // If you’re importing the JSON (as above), you can just set it directly:
    setScenarios(scenariosData as Scenario[]);

    // Lock initial index:
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
    // Pick a different index than the current one
    const next = (idx + 1 + Math.floor(Math.random() * (scenarios.length - 1))) % scenarios.length;
    setIdx(next);
    localStorage.setItem('roga_current_idx', String(next));
    setUserQuestion('');
    setFeedback('');
  }, [idx, scenarios.length]);

  const submit = useCallback(async () => {
    if (!current) return;
    setIsLoading(true);
    setFeedback('');

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL;
      const res = await fetch(`${apiBase}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_question: userQuestion }),
      });

      const data: { answer?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Request failed');      

      setFeedback(data?.answer || 'No feedback returned.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      setFeedback(message);
  }
 finally {
      setIsLoading(false);
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
          disabled={isLoading || !userQuestion.trim()}
        >
          {isLoading ? 'Scoring…' : 'Submit'}
        </button>

        <button
          className="px-4 py-2 rounded border"
          onClick={() => {
            setUserQuestion('');
            setFeedback('');
          }}
        >
          Reset
        </button>

        <button className="px-4 py-2 rounded border" onClick={shuffle}>
          Shuffle scenario
        </button>
      </div>

      {feedback && (
        <div className="rounded border p-4 bg-red-50 text-red-700">
          {feedback}
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
    </div>
  );
}
