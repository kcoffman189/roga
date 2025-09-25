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
  coachV3?: {
    overallScore: number;
    subscores: {
      clarity: number;
      depth: number;
      relevance: number;
      empathy: number;
    };
    skillDetected: string;  // V2 schema - simplified skill detection
    strengths?: string;
    improvementArea?: string;
    coachingNugget?: string;
    exampleUpgrades?: string[];
    progressNote?: string;
    contextSpecificTip?: string;
    likelyResponse?: string;
    nextQuestionSuggestions?: string[];
  };
};

const glyph: Record<RubricItem["status"], string> = {
  good: "✅",
  warn: "⚠️",
  bad:  "❌",
};

export default function ScoreCard({ data }: { data: RogaFeedback }) {
  return (
    <div className="card mx-auto max-w-md md:max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="text-2xl">🌎</div>
        <div>
          <h2 className="text-lg heading">Today&apos;s Scenario</h2>
          <p className="mt-1 copy">{data.scenario.text}</p>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg heading">What do you ask?</h3>
        <div className="card mt-2 !p-3 text-sm">
          {data.question}
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h3 className="text-lg heading">Your Score</h3>
        <div className="text-2xl heading" style={{color: 'var(--roga-teal)'}}>{data.score}/100</div>
      </div>

      <ul className="mt-2 space-y-2">
        {data.rubric.map((r) => (
          <li key={r.key} className="flex items-start gap-3">
            <span className="text-xl leading-6">{glyph[r.status]}</span>
            <div>
              <div className="font-medium">{r.label}</div>
              <div className="text-sm copy">{r.note}</div>
            </div>
          </li>
        ))}
      </ul>

      <div className="card mt-5 !p-4 border-l-4" style={{borderLeftColor: 'var(--roga-violet)'}}>
        <div className="text-sm heading">💡 Pro Tip</div>
        <p className="text-sm copy mt-1">{data.proTip || 'No tip available'}</p>
      </div>

      <div className="card mt-3 !p-4 border-l-4" style={{borderLeftColor: 'var(--roga-teal)'}}>
        <div className="text-sm heading">⭐ Suggested Upgrade</div>
        <p className="mt-2 card !p-3 text-sm copy" style={{backgroundColor: 'var(--roga-fog)'}}>
          {data.suggestedUpgrade || 'No upgrade suggestion available'}
        </p>
      </div>

      {data.badge && (
        <div className="badge mt-5 !text-base !px-4 !py-2">
          <div className="text-2xl">🏅</div>
          <div>{data.badge.label} unlocked</div>
        </div>
      )}

      {/* Enhanced v3 Coaching Fields (Sessions parity) */}
      {data.coachV3 && (
        <div className="space-y-2 mt-6">
          <div className="flex items-center justify-between">
            <span className="badge">QI {data.coachV3.overallScore}/100</span>
            <span className="text-xs text-coal/70">
              Cl {data.coachV3.subscores.clarity}/5 • De {data.coachV3.subscores.depth}/5 • Re {data.coachV3.subscores.relevance}/5 • Em {data.coachV3.subscores.empathy}/5
            </span>
          </div>

          {data.coachV3.skillFeedback && (
            <div className="space-y-1 text-sm">
              <div><strong>Clarity:</strong> {data.coachV3.skillFeedback.clarity}</div>
              <div><strong>Depth:</strong> {data.coachV3.skillFeedback.depth}</div>
              <div><strong>Relevance:</strong> {data.coachV3.skillFeedback.relevance}</div>
              <div><strong>Empathy:</strong> {data.coachV3.skillFeedback.empathy}</div>
            </div>
          )}

          <p><strong>QI Skill:</strong> {data.coachV3.skillDetected}</p>
          {data.coachV3.strengths && <p><strong>Strengths:</strong> {data.coachV3.strengths}</p>}
          {data.coachV3.improvementArea && <p><strong>Improvement:</strong> {data.coachV3.improvementArea}</p>}
          {data.coachV3.coachingNugget && <p><strong>Coaching Nugget:</strong> {data.coachV3.coachingNugget}</p>}

          {!!data.coachV3.exampleUpgrades?.length && (
            <div>
              <strong>Example Upgrades:</strong>
              <ul className="list-disc pl-5">
                {data.coachV3.exampleUpgrades.slice(0,3).map((x, i) => <li key={i}>{x}</li>)}
              </ul>
            </div>
          )}

          {data.coachV3.progressNote && <p><strong>Progress:</strong> {data.coachV3.progressNote}</p>}
          {data.coachV3.contextSpecificTip && <p><strong>Context Tip:</strong> {data.coachV3.contextSpecificTip}</p>}
          {data.coachV3.likelyResponse && <p><strong>Likely Response:</strong> {data.coachV3.likelyResponse}</p>}
          {!!data.coachV3.nextQuestionSuggestions?.length && (
            <p className="text-sm"><strong>Try next:</strong> {data.coachV3.nextQuestionSuggestions.join(" • ")}</p>
          )}
        </div>
      )}
    </div>
  );
}
