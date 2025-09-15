"use client";
import React from "react";
import type { CoachFeedback } from "@/app/game/actions";

type DailyChallengeScoreCardProps = {
  scenario: { title: string; text: string };
  question: string;
  feedback: CoachFeedback;
};

const ScoreIndicator = ({ label, score }: { label: string; score: number }) => {
  const getColor = (score: number) => {
    if (score >= 4) return "var(--roga-teal)";
    if (score >= 3) return "var(--roga-amber)";
    return "var(--roga-coral)";
  };

  const getDots = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: i < score ? getColor(score) : "var(--roga-fog)",
          border: "1px solid var(--roga-mist)"
        }}
      />
    ));
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1">
        {getDots(score)}
        <span className="ml-2 text-sm font-bold" style={{ color: getColor(score) }}>
          {score}/5
        </span>
      </div>
    </div>
  );
};

export default function DailyChallengeScoreCard({ scenario, question, feedback }: DailyChallengeScoreCardProps) {
  const overallColor = feedback.qi_score.overall >= 4 ? "var(--roga-teal)" :
                      feedback.qi_score.overall >= 3 ? "var(--roga-amber)" : "var(--roga-coral)";

  return (
    <div className="card mx-auto max-w-md md:max-w-2xl">
      {/* Scenario Context */}
      <div className="flex items-start gap-3">
        <div className="text-2xl">🌎</div>
        <div>
          <h2 className="text-lg heading">Today&apos;s Scenario</h2>
          <p className="mt-1 copy">{scenario.text}</p>
        </div>
      </div>

      {/* User Question */}
      <div className="mt-6">
        <h3 className="text-lg heading">What do you ask?</h3>
        <div className="card mt-2 !p-3 text-sm">
          {question}
        </div>
      </div>

      {/* Overall Score */}
      <div className="mt-6 flex items-baseline justify-between">
        <h3 className="text-lg heading">Question Intelligence Score</h3>
        <div className="text-3xl heading" style={{ color: overallColor }}>
          {feedback.qi_score.overall}/5
        </div>
      </div>

      {/* Sub-scores */}
      <div className="mt-4 space-y-1">
        <ScoreIndicator label="Clarity" score={feedback.qi_score.clarity} />
        <ScoreIndicator label="Depth" score={feedback.qi_score.depth} />
        <ScoreIndicator label="Relevance" score={feedback.qi_score.relevance} />
        <ScoreIndicator label="Empathy" score={feedback.qi_score.empathy} />
      </div>

      {/* Strengths */}
      <div className="card mt-6 !p-4 border-l-4" style={{ borderLeftColor: "var(--roga-teal)" }}>
        <div className="text-sm heading flex items-center gap-2">
          <span>💪</span>
          <span>Strengths</span>
        </div>
        <p className="text-sm copy mt-2">{feedback.strengths}</p>
      </div>

      {/* Improvement */}
      <div className="card mt-3 !p-4 border-l-4" style={{ borderLeftColor: "var(--roga-violet)" }}>
        <div className="text-sm heading flex items-center gap-2">
          <span>🎯</span>
          <span>Focus Area</span>
        </div>
        <p className="text-sm copy mt-2">{feedback.improvement}</p>
      </div>

      {/* Coaching Moment */}
      <div className="card mt-3 !p-4 border-l-4" style={{ borderLeftColor: "var(--roga-amber)" }}>
        <div className="text-sm heading flex items-center gap-2">
          <span>💡</span>
          <span>Coaching Moment</span>
        </div>
        <p className="text-sm copy mt-2">{feedback.coaching_moment}</p>
      </div>

      {/* Technique Spotlight */}
      <div className="card mt-3 !p-4 border-l-4" style={{ borderLeftColor: "var(--roga-coral)" }}>
        <div className="text-sm heading flex items-center gap-2">
          <span>🔦</span>
          <span>Technique Spotlight: {feedback.technique_spotlight.name}</span>
        </div>
        <p className="text-sm copy mt-2">{feedback.technique_spotlight.description}</p>
      </div>

      {/* Example Upgrades */}
      <div className="card mt-3 !p-4 border-l-4" style={{ borderLeftColor: "var(--roga-teal)" }}>
        <div className="text-sm heading flex items-center gap-2">
          <span>⭐</span>
          <span>Example Upgrades</span>
        </div>
        <div className="mt-3 space-y-2">
          {feedback.example_upgrades.map((upgrade, index) => (
            <div
              key={index}
              className="card !p-3 text-sm copy"
              style={{ backgroundColor: "var(--roga-fog)" }}
            >
              "{upgrade}"
            </div>
          ))}
        </div>
      </div>

      {/* Progress Message */}
      <div className="mt-6 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: "var(--roga-fog)",
            border: "2px solid var(--roga-teal)",
            color: "var(--roga-coal)"
          }}
        >
          <span>🚀</span>
          <span>{feedback.progress_message}</span>
        </div>
      </div>
    </div>
  );
}