"use client";
import React from "react";

// Enhanced V3 types for the comprehensive feedback
type EnhancedSkillFeedback = {
  clarity: string;
  depth: string;
  relevance: string;
  empathy: string;
};

type DailyChallengeCoachFeedbackV3 = {
  qi_score: {
    overall: number;
    clarity: number;
    depth: number;
    relevance: number;
    empathy: number;
  };
  skill_feedback: EnhancedSkillFeedback;
  skill_detected: string;
  strengths: string;
  improvement_area: string;
  coaching_nugget: string;
  example_upgrades: string[];
  progress_note: string;
};

type DailyChallengeScoreCardV3Props = {
  scenario: { title: string; text: string };
  question: string;
  feedback: DailyChallengeCoachFeedbackV3;
};

const EnhancedScoreIndicator = ({
  label,
  score,
  feedback,
  icon
}: {
  label: string;
  score: number;
  feedback: string;
  icon: string;
}) => {
  const getColor = (score: number) => {
    if (score >= 4) return "var(--roga-teal)";
    if (score >= 3) return "var(--roga-amber)";
    return "var(--roga-coral)";
  };

  const getDots = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className="w-2.5 h-2.5 rounded-full transition-all duration-200"
        style={{
          backgroundColor: i < score ? getColor(score) : "var(--roga-fog)",
          border: "1px solid var(--roga-mist)",
          transform: i < score ? "scale(1.1)" : "scale(1)"
        }}
      />
    ));
  };

  return (
    <div className="py-4 border-b border-[var(--roga-mist)] last:border-b-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {getDots(score)}
          </div>
          <span
            className="ml-2 text-sm font-bold min-w-[35px] text-right"
            style={{ color: getColor(score) }}
          >
            {score}/5
          </span>
        </div>
      </div>
      <p className="text-sm copy text-[var(--roga-coal)] leading-relaxed pl-6">
        {feedback}
      </p>
    </div>
  );
};

const FrameworkSection = ({
  icon,
  title,
  content,
  borderColor,
  children
}: {
  icon: string;
  title: string;
  content?: string;
  borderColor: string;
  children?: React.ReactNode;
}) => (
  <div
    className="card mt-4 !p-4 border-l-4 transition-all duration-200 hover:shadow-sm"
    style={{ borderLeftColor: borderColor }}
  >
    <div className="text-sm heading flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <span>{title}</span>
    </div>
    {content && (
      <p className="text-sm copy leading-relaxed">{content}</p>
    )}
    {children}
  </div>
);

export default function DailyChallengeScoreCardV3({
  scenario,
  question,
  feedback
}: DailyChallengeScoreCardV3Props) {
  const overallColor = feedback.qi_score.overall >= 4 ? "var(--roga-teal)" :
                      feedback.qi_score.overall >= 3 ? "var(--roga-amber)" :
                      "var(--roga-coral)";

  return (
    <div className="card mx-auto max-w-md md:max-w-3xl space-y-6">
      {/* Scenario Context */}
      <div className="flex items-start gap-4">
        <div className="text-3xl">🌎</div>
        <div>
          <h2 className="text-xl heading mb-2">Today&apos;s Challenge</h2>
          <p className="copy leading-relaxed">{scenario.text}</p>
        </div>
      </div>

      {/* User Question */}
      <div>
        <h3 className="text-lg heading mb-3">Your Question</h3>
        <div className="card !p-4 bg-[var(--roga-fog)] border-2 border-[var(--roga-mist)]">
          <p className="text-sm font-medium">&ldquo;{question}&rdquo;</p>
        </div>
      </div>

      {/* Overall Score & Skill Detection */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div>
            <div className="text-4xl heading mb-1" style={{ color: overallColor }}>
              {feedback.qi_score.overall}/5
            </div>
            <p className="text-sm copy">Question Intelligence</p>
          </div>
          <div className="h-12 w-px bg-[var(--roga-mist)]"></div>
          <div>
            <p className="text-sm copy mb-1">Skill Detected</p>
            <p className="text-sm font-semibold" style={{ color: overallColor }}>
              {feedback.skill_detected}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Sub-scores with Detailed Feedback */}
      <div className="card !p-4">
        <div className="text-lg heading mb-4 text-center">
          <span>📊 Detailed Skill Assessment</span>
        </div>
        <div className="space-y-0">
          <EnhancedScoreIndicator
            label="Clarity"
            icon="🎯"
            score={feedback.qi_score.clarity}
            feedback={feedback.skill_feedback.clarity}
          />
          <EnhancedScoreIndicator
            label="Depth"
            icon="🔍"
            score={feedback.qi_score.depth}
            feedback={feedback.skill_feedback.depth}
          />
          <EnhancedScoreIndicator
            label="Relevance"
            icon="🎪"
            score={feedback.qi_score.relevance}
            feedback={feedback.skill_feedback.relevance}
          />
          <EnhancedScoreIndicator
            label="Empathy"
            icon="💝"
            score={feedback.qi_score.empathy}
            feedback={feedback.skill_feedback.empathy}
          />
        </div>
      </div>

      {/* 6-Part Coaching Framework */}
      <div>
        <h3 className="text-lg heading mb-4 text-center">
          🎓 Comprehensive Coaching Feedback
        </h3>

        {/* Strengths */}
        <FrameworkSection
          icon="💪"
          title="What You Did Well"
          content={feedback.strengths}
          borderColor="var(--roga-teal)"
        />

        {/* Improvement Area */}
        <FrameworkSection
          icon="🎯"
          title="Key Improvement Area"
          content={feedback.improvement_area}
          borderColor="var(--roga-violet)"
        />

        {/* Coaching Nugget */}
        <FrameworkSection
          icon="💎"
          title="Coaching Insight"
          content={feedback.coaching_nugget}
          borderColor="var(--roga-amber)"
        />

        {/* Example Upgrades */}
        <FrameworkSection
          icon="⭐"
          title="Example Upgrades"
          borderColor="var(--roga-teal)"
        >
          <div className="space-y-3">
            <p className="text-xs copy mb-3 opacity-75">
              Here are stronger versions of your question:
            </p>
            {feedback.example_upgrades.map((upgrade, index) => (
              <div
                key={index}
                className="card !p-3 bg-[var(--roga-fog)] hover:bg-white transition-colors duration-200"
              >
                <div className="flex items-start gap-3">
                  <span className="text-[var(--roga-teal)] font-bold text-sm mt-0.5">
                    {index + 1}.
                  </span>
                  <p className="text-sm copy flex-1">
                    &ldquo;{upgrade}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </FrameworkSection>

        {/* Progress Note */}
        <div className="mt-6 text-center">
          <div
            className="inline-flex items-center gap-3 px-6 py-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: "var(--roga-fog)",
              border: "2px solid var(--roga-teal)",
              color: "var(--roga-coal)"
            }}
          >
            <span className="text-lg">🚀</span>
            <span>{feedback.progress_note}</span>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="card !p-4 bg-gradient-to-r from-[var(--roga-fog)] to-white border-2 border-[var(--roga-teal)]">
        <div className="text-sm heading flex items-center gap-2 mb-3">
          <span>✨</span>
          <span>Next Steps</span>
        </div>
        <div className="text-sm copy space-y-2">
          <p>• Try one of the example upgrades above in a similar situation</p>
          <p>• Focus on the improvement area to level up your questioning skills</p>
          <p>• Practice the coaching insight in your daily conversations</p>
        </div>
      </div>
    </div>
  );
}