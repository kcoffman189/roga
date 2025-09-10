'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
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

// Deterministic "daily" index
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

// Map API -> UI with improved validation
function normalizeFeedback(
  api: AskApiResponse,
  fallback: { scenarioTitle: string; scenarioText: string; question: string }
): RogaFeedback {
  console.log('Normalizing feedback:', api);
  
  const normalized = {
    scenario: {
      title: api?.scenario?.title || fallback.scenarioTitle || "Today's Scenario",
      text: api?.scenario?.text || fallback.scenarioText || '',
    },
    question: api?.question || fallback.question || '',
    score: typeof api?.score === 'number' ? Math.round(api.score) : 0,
    rubric: Array.isArray(api?.rubric) ? api.rubric.map((r) => ({
      key: (r?.key || 'clarity') as RubricKey,
      label: r?.label || 'Clarity',
      status: (r?.status || 'warn') as RubricStatus,
      note: r?.note || '',
    })) : [],
    proTip: api?.proTip || '',
    suggestedUpgrade: api?.suggestedUpgrade || undefined,
    badge: api?.badge ? { 
      name: api.badge.name || '', 
      label: api.badge.label 
    } : undefined,
  };

  console.log('Normalized result:', normalized);
  return normalized;
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
    const scenarioList = scenariosData as Scenario[];
    setScenarios(scenarioList);
    
    const stored = localStorage.getItem('roga_current_idx');
    if (stored) {
      const storedIdx = parseInt(stored, 10);
      if (storedIdx >= 0 && storedIdx < scenarioList.length) {
        setIdx(storedIdx);
      } else {
        const initial = pickDailyIndex(scenarioList.length);
        setIdx(initial);
        localStorage.setItem('roga_current_idx', String(initial));
      }
    } else {
      const initial = pickDailyIndex(scenarioList.length);
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
    if (!current) {
      setError('No scenario selected');
      return;
    }

    if (!userQuestion.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    console.log('=== SUBMIT DEBUG START ===');
    console.log('Current scenario:', current);
    console.log('User question:', userQuestion);

    try {
      const requestBody = {
        question: userQuestion,
        user_question: userQuestion, // legacy support
        scenarioId: current.id,
        scenario_id: current.id, // legacy support
        scenarioTitle: current.title,
        scenarioText: current.prompt
      };

      console.log('Request body:', requestBody);

      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        let message = `Request failed with status ${res.status}`;
        try {
          const errorData = await res.json();
          console.log('Error response data:', errorData);
          if (errorData?.error) {
            message = errorData.error;
          }
        } catch (parseError) {
          console.log('Could not parse error response:', parseError);
          const textResponse = await res.text();
          console.log('Error response text:', textResponse);
        }
        throw new Error(message);
      }

      const responseText = await res.text();
      console.log('Raw response text:', responseText);

      let api: AskApiResponse;
      try {
        api = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }

      console.log('Parsed API response:', api);
      console.log('API response type checks:');
      console.log('- api exists:', !!api);
      console.log('- score type:', typeof api?.score);
      console.log('- score value:', api?.score);
      console.log('- rubric is array:', Array.isArray(api?.rubric));
      console.log('- rubric length:', api?.rubric?.length);

      // Simplified validation - just check if we have the essential data
      if (!api) {
        throw new Error('No response data received');
      }

      // Create normalized feedback regardless of validation
      const normalizedFeedback = normalizeFeedback(api, {
        scenarioTitle: current.title,
        scenarioText: current.prompt,
        question: userQuestion,
      });

      console.log('About to set feedback:', normalizedFeedback);
      setFeedback(normalizedFeedback);
      console.log('Feedback state should be set');

    } catch (e: unknown) {
      console.error('Submit error:', e);
      const message = e instanceof Error ? e.message : 'An unexpected error occurred';
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
      console.log('=== SUBMIT DEBUG END ===');
    }
  }, [current, userQuestion]);

  // Debug feedback state changes
  useEffect(() => {
    console.log('Feedback state changed:', feedback);
  }, [feedback]);

  if (!current) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-gray-500">Loading scenarios…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl heading">Quick Challenge</h1>
        <Link href="/" className="btn btn-ghost">
          ← Back to Home
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎯</div>
          <div>
            <p className="heading text-lg">{current.title}</p>
            <p className="mt-1 copy">{current.prompt}</p>
          </div>
        </div>
      </div>
    
      <textarea
        className="w-full border-2 border-gray-200 rounded-xl p-4 mb-4 focus:border-teal focus:outline-none transition-colors"
        rows={6}
        placeholder="Type your question…"
        value={userQuestion}
        onChange={(e) => setUserQuestion(e.target.value)}
      />

      <div className="flex gap-3 mb-4">
        <button
          className="btn btn-primary disabled:opacity-60"
          onClick={submit}
          disabled={loading || !userQuestion.trim()}
        >
          {loading ? 'Scoring…' : 'Submit Question'}
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => {
            setUserQuestion('');
            setFeedback(null);
            setError(null);
          }}
        >
          Reset
        </button>

        <button className="btn btn-ghost" onClick={shuffle}>
          New Scenario
        </button>
      </div>

      {/* Debug info */}
      <div className="mb-4 text-xs text-gray-400">
        <p>Debug: Feedback state = {feedback ? 'SET' : 'NULL'}</p>
        <p>Debug: Error state = {error || 'NONE'}</p>
        <p>Debug: Loading = {loading ? 'TRUE' : 'FALSE'}</p>
      </div>

      {feedback && (
        <div>
          <p className="text-sm text-green-600 mb-2">✓ Feedback received and rendering ScoreCard</p>
          <ScoreCard data={feedback} />
        </div>
      )}

      {error && (
        <div className="card mt-4 border-l-4" style={{borderLeftColor: 'var(--roga-coral)', backgroundColor: 'rgba(255,111,97,0.05)'}}>
          <p className="heading text-sm" style={{color: 'var(--roga-coral)'}}>Error:</p>
          <p className="copy text-sm mt-1">{error}</p>
        </div>
      )}

      <p className="mt-6 text-xs text-gray-500">MVP • v0 • powered by gpt-4o-mini</p>
    </div>
  );
}