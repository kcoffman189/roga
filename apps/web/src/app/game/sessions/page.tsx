// apps/web/src/app/game/sessions/page.tsx
"use client";

import { useMemo, useState } from "react";
import { getDefaultSession } from "@/data/sessions";
import type { RogaSessionSeed } from "@/data/sessions/types";

type RubricItem = {
  key: "clarity" | "depth" | "insight" | "openness";
  label: string;
  status: "good" | "warn" | "bad";
  note: string;
};
type Feedback = {
  score: number;
  rubric: RubricItem[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: { name: string; label?: string };
};

// Minimal conversation memory we pass to the backend
type RoundSummary = {
  round: number;
  question: string;
  weakest?: RubricItem["key"];
  suggestedUpgrade?: string;
};

export default function RogaSessionsPage() {
  const seed: RogaSessionSeed = useMemo(() => getDefaultSession(), []);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<RoundSummary[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false);

  const maxRounds = seed.rounds;

  const submit = async () => {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const prior_summary = history.slice(-2) // keep it short
        .map(h => `r${h.round}: q="${h.question}" weak=${h.weakest ?? "n/a"} upg="${h.suggestedUpgrade ?? ""}"`)
        .join(" | ");

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "session",
          sessionId: seed.id,
          round,
          question,
          sessionTitle: seed.title,
          sessionScene: seed.scene,
          sessionPersona: seed.persona,
          priorSummary: prior_summary
        })
      });

      const fb: Feedback = await res.json();

      // Track minimal details for the next round’s context
      const weakest = fb.rubric
        ?.sort((a, b) => (a.status === "bad" ? -1 : a.status === "warn" && b.status === "good" ? -1 : 1))[0]?.key;

      setHistory(prev => [...prev, { round, question, weakest, suggestedUpgrade: fb.suggestedUpgrade }]);
      setFeedbackHistory(prev => [...prev, fb]);
      setQuestion("");
      setRound(r => Math.min(r + 1, maxRounds));
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setRound(1);
    setQuestion("");
    setHistory([]);
    setFeedbackHistory([]);
  };

  return (
    <main className="px-6 py-10 max-w-3xl mx-auto">
      {/* Intro / seed */}
      <section className="card mb-6">
        <h1 className="heading text-2xl">{seed.title}</h1>
        <p className="copy mt-1">{seed.scene}</p>
        <p className="copy mt-2 text-sm opacity-70">
          Persona: <em>{seed.persona}</em> • Rounds: {seed.rounds}
        </p>
      </section>

      {/* Round entry */}
      {round <= maxRounds ? (
        <section className="card mb-6">
          <h2 className="heading text-xl mb-2">Round {round} of {maxRounds}</h2>
          <textarea
            className="w-full bg-white rounded-2xl border p-3 min-h-[120px]"
            placeholder={round === 1 ? "Start with an opening question…" : "Follow up based on prior feedback…"}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="mt-3 flex gap-3">
            <button className="btn btn-primary" onClick={submit} disabled={loading || !question.trim()}>
              {loading ? "Scoring…" : "Submit"}
            </button>
            <button className="btn btn-ghost" onClick={reset}>Reset</button>
          </div>
        </section>
      ) : (
        <section className="card mb-6 text-center">
          <h2 className="heading text-xl">Session complete 🎉</h2>
          <button className="btn btn-primary mt-3" onClick={reset}>Start again</button>
        </section>
      )}

      {/* Feedback per round */}
      {feedbackHistory.length > 0 && (
        <section className="space-y-4">
          {feedbackHistory.map((fb, i) => (
            <div className="card" key={i}>
              <div className="flex items-center justify-between">
                <h3 className="heading text-lg">Round {i + 1} Feedback</h3>
                <span className="badge">{fb.score}</span>
              </div>
              {fb.suggestedUpgrade && <p className="copy mt-2"><strong>Upgrade:</strong> {fb.suggestedUpgrade}</p>}
              {fb.proTip && <p className="copy mt-1"><strong>Pro Tip:</strong> {fb.proTip}</p>}
              <ul className="copy text-sm mt-2 space-y-1">
                {fb.rubric?.map(r => (
                  <li key={r.key}><strong>{r.label}:</strong> {r.note}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
