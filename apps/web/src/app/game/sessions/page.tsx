// app/sessions/page.tsx
"use client";

import { useState } from "react";
import BrandMark from "@/components/ui/BrandMark";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";

interface Scenario {
  id: number;
  title: string;
  text: string;
}

interface FeedbackData {
  score: number;
  rubric: {
    key: string;
    label: string;
    status: "good" | "warn" | "bad";
    note: string;
  }[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: {
    name: string;
    label: string;
  };
}

export default function RogaSessionsPage() {
  const [round, setRound] = useState(1);
  const [maxRounds] = useState(5);
  const [question, setQuestion] = useState("");
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const scenario: Scenario = {
    id: 101,
    title: "Mentor Conversation",
    text: "You’re meeting a mentor to explore career paths. Practice asking deeper questions over several rounds.",
  };

  const onSubmit = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          scenarioId: scenario.id,
          scenarioTitle: scenario.title,
          scenarioText: scenario.text,
          round,
        }),
      });

      let data: FeedbackData;
      if (response.ok) {
        data = await response.json();
      } else {
        // fallback dummy feedback
        data = {
          score: 70,
          rubric: [
            { key: "clarity", label: "Clarity", status: "good", note: "Clear question." },
            { key: "depth", label: "Depth", status: "warn", note: "Could dig deeper." },
            { key: "insight", label: "Insight", status: "warn", note: "Surface-level insight." },
            { key: "openness", label: "Openness", status: "good", note: "Invites discussion." },
          ],
          proTip: "Try layering your next question for depth.",
        };
      }
      setFeedbackHistory([...feedbackHistory, data]);
      setQuestion("");
      setRound((r) => r + 1);
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setRound(1);
    setQuestion("");
    setFeedbackHistory([]);
  };

  return (
    <main className="min-h-screen bg-fog text-coal">
      {/* HEADER */}
      <header className="w-full bg-teal p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BrandMark size={60} />
          <span className="text-white text-4xl font-bold">Roga Sessions</span>
        </div>
        <Link href="/">
          <Button variant="ghost" className="text-white border-white">
            ← Back to Home
          </Button>
        </Link>
      </header>

      {/* TITLE */}
      <div className="text-center mt-10 mb-6">
        <h1 className="text-3xl font-bold">{scenario.title}</h1>
        <p className="max-w-2xl mx-auto text-coal/80 mt-2">{scenario.text}</p>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col items-center gap-8">
        {round <= maxRounds ? (
          <Card className="p-6 w-[600px]">
            <h2 className="font-bold mb-2">Round {round} of {maxRounds}</h2>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question…"
              className="w-full min-h-[120px] p-3 rounded-xl border border-coal/20 bg-fog"
            />
            <div className="mt-4 flex justify-center gap-4">
              <Button onClick={onSubmit} disabled={isLoading || !question.trim()}>
                {isLoading ? "Scoring…" : "Submit"}
              </Button>
              <Button variant="ghost" onClick={onReset}>Reset</Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 w-[600px] text-center">
            <h2 className="font-bold text-xl mb-4">Session Complete 🎉</h2>
            <p>You’ve finished {maxRounds} rounds. Review your feedback below or start again.</p>
            <Button className="mt-4" onClick={onReset}>Start New Session</Button>
          </Card>
        )}

        {/* Feedback history */}
        {feedbackHistory.length > 0 && (
          <div className="w-[600px] space-y-6">
            {feedbackHistory.map((fb, i) => (
              <Card key={i} className="p-4">
                <h3 className="font-semibold mb-2">Round {i + 1} Feedback</h3>
                <div className="font-bold text-teal mb-2">{fb.score}</div>
                {fb.suggestedUpgrade && (
                  <p className="text-sm mb-2"><strong>Upgrade:</strong> {fb.suggestedUpgrade}</p>
                )}
                {fb.proTip && (
                  <p className="text-sm mb-2"><strong>Pro Tip:</strong> {fb.proTip}</p>
                )}
                <ul className="text-xs text-coal/70 space-y-1">
                  {fb.rubric.map((r) => (
                    <li key={r.key}><strong>{r.label}:</strong> {r.note}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
