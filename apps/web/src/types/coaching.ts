// Unified Coaching Types - Single source of truth for all coaching feedback
// Consolidates all feedback systems into one coherent interface

export interface RubricItem {
  key: "clarity" | "depth" | "insight" | "openness" | "relevance" | "empathy";
  label: string;
  status: "good" | "warn" | "bad";
  note: string;
}

export interface Badge {
  name: string;
  label?: string;
}

export interface CoachV3Data {
  overallScore: number;
  subscores: {
    clarity: number;
    depth: number;
    relevance: number;
    empathy: number;
  };
  skillDetected: string;
  strengths?: string;
  improvementArea?: string;
  coachingNugget?: string;
  exampleUpgrades?: string[];
  progressNote?: string;
  contextSpecificTip?: string;
  likelyResponse?: string;
  nextQuestionSuggestions?: string[];
  skillFeedback?: {
    clarity: string;
    depth: string;
    relevance: string;
    empathy: string;
  };
}

// Unified feedback interface - supports both legacy and enhanced modes
export interface UnifiedFeedback {
  // Core feedback data
  scenario: {
    title: string;
    text: string;
  };
  question: string;
  score: number;
  rubric: RubricItem[];

  // Optional legacy fields
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: Badge;

  // Enhanced V3 coaching data
  coachV3?: CoachV3Data;
}

// API request interface
export interface FeedbackRequest {
  question?: string;
  user_question?: string;
  scenarioId?: number;
  scenario_id?: number;
  scenarioTitle?: string;
  scenario_title?: string;
  scenarioText?: string;
  scenario_text?: string;
  context?: string;

  // Session mode fields (for future use)
  mode?: string;
  round?: number;
  sessionId?: string;
  sessionTitle?: string;
  sessionScene?: string;
  sessionPersona?: string;
  priorSummary?: string;
}