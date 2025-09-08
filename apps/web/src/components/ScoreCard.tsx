"use client";
import React from "react";

type RubricItem = {
  key: "clarity" | "depth" | "insight" | "openness";
  label: string;
  status: "good" | "warn" | "bad";
  note: string;
};

export type RogaFeedback = {
  scenario: { title: string; text: string };
  question: string;
  score: number;
  rubric: RubricItem[];
  proTip?: string;        // Make optional
  suggestedUpgrade?: string; // Make optional
  badge?: { name: string; label?: string }; // label should also be optional
};

const glyph: Record<RubricItem["status"], string> = {
  good: "✅",
  warn: "⚠️",
  bad:  "❌",
};

export default function ScoreCard({ data }: { data: RogaFeedback }) {
  return (
    <div className="mx-auto max-w-md md:max-w-2xl rounded-2xl border border-zinc-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🌎</div>
        <div>
          <h2 className="text-lg font-semibold">Today’s Scenario</h2>
          <p className="mt-1 text-zinc-700">{data.scenario.text}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">What do you ask?</h3>
        <div className="mt-2 rounded-xl border border-zinc-300 bg-white p-3 text-zinc-800">
          {data.question}
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Your Score</h3>
        <div className="text-2xl font-bold">{data.score}/100</div>
      </div>

      <ul className="mt-2 space-y-2">
        {data.rubric.map((r) => (
          <li key={r.key} className="flex items-start gap-3">
            <span className="text-xl leading-6">{glyph[r.status]}</span>
            <div>
              <div className="font-medium">{r.label}</div>
              <div className="text-sm text-zinc-700">{r.note}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5 rounded-xl border border-yellow-200 bg-white p-4">
        <div className="text-sm font-semibold">Pro Tip</div>
        <p className="text-sm text-zinc-800">{data.proTip || 'No tip available'}</p>
      </div>

      <div className="mt-3 rounded-xl border border-indigo-200 bg-white p-4">
        <div className="text-sm font-semibold">⭐ Suggested Upgrade</div>
          <p className="mt-1 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-zinc-800">
         {data.suggestedUpgrade || 'No upgrade suggestion available'}
        </p>
      </div>

      {data.badge && (
        <div className="mt-5 flex items-center gap-3">
          <div className="text-3xl">🏅</div>
          <div className="text-lg font-semibold">{data.badge.label} unlocked</div>
        </div>
      )}
    </div>
  );
}
