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