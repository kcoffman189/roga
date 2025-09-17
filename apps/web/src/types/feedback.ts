// apps/web/src/types/feedback.ts
export type RubricKey = "clarity" | "depth" | "insight" | "openness";

export type RubricItem = {
  key: RubricKey;
  label: string;
  status: "good" | "warn" | "bad";
  note: string;
};

export type RogaFeedbackV2 = {
  scenario: { title: string; text?: string };
  question: string;
  score: number;
  rubric: RubricItem[];
  proTip?: string | null;
  suggestedUpgrade?: string | null;
  badge?: { name: string; label?: string };

  // NEW V2 fields
  contextSpecificTip?: string;
  likelyResponse?: string;
  nextQuestionSuggestions?: string[];
  empathyScore?: number; // 0–25
};

// MVP 5-Part Feedback Structure
export type MVPRubricScore = {
  clarity: number;    // 0-100
  depth: number;      // 0-100
  curiosity: number;  // 0-100
  relevance: number;  // 0-100
  empathy: number;    // 0-100
};

export type MVPScoreCardFeedback = {
  positive_reinforcement: string;  // What user did well
  dimension_focus: string;         // 1-2 QI dimensions needing improvement
  pro_tip: string;                 // Short, actionable coaching advice
  suggested_upgrade: string;       // Rewrite showing stronger version
  score: number;                   // Overall 0-100 score
  rubric: MVPRubricScore;         // Individual dimension scores
};

export type MVPScoreCardResponse = {
  schema: string;
  scenario_id?: number;
  user_question: string;
  feedback: MVPScoreCardFeedback;
  meta: {
    brand_check: boolean;
    length_ok: boolean;
    banned_content: string[];
    hash: string;
  };
};