"use client";
import { useState } from "react";

export default function GamePage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("https://api.roga.me/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_question: question }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API ${res.status}: ${text}`);
      }

      const data = await res.json();
      setAnswer(data.answer ?? "(no answer returned)");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to reach API";
      setError(msg);
    } finally {
      setLoading(false);
    }

  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Quick Challenge</h1>

        {/* Simple starter scenario prompt */}
        <div className="text-sm text-neutral-600">
          <p className="mb-1 font-medium">Scenario:</p>
          <p>
            You’re joining a new project and have 5 minutes with the team lead.
            What single question would surface the biggest unknown or risk?
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <textarea
            className="w-full border rounded-md p-3"
            rows={4}
            placeholder="Type the question you would ask…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="rounded-md px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Scoring…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setQuestion("");
                setAnswer("");
                setError(null);
              }}
              className="rounded-md px-4 py-2 border"
            >
              Reset
            </button>
          </div>
        </form>

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 p-3 rounded-md">
            {error}
          </div>
        )}

        {answer && (
          <div className="border rounded-md p-4 bg-neutral-50">
            <p className="font-semibold mb-1">Feedback:</p>
            <p>{answer}</p>
          </div>
        )}

        <p className="text-xs text-neutral-400">MVP • v0 • powered by gpt-4o-mini</p>
      </div>
    </main>
  );
}
