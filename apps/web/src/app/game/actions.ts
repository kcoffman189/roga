"use server"

// Daily Challenge Coaching Upgrade - Frontend Actions

export type ClassifyResponse = {
  detected_skills: string[];
  scores: {
    clarity: number;
    depth: number;
    relevance: number;
    empathy: number;
    overall: number
  };
  issues: string[];
  justification?: string;
};

export type CoachFeedback = {
  qi_score: ClassifyResponse["scores"];
  strengths: string;
  improvement: string;
  coaching_moment: string;
  technique_spotlight: { name: string; description: string };
  example_upgrades: string[];
  progress_message: string;
};

// Individual skill feedback for enhanced breakdown
export type SkillFeedback = {
  clarity: string;
  depth: string;
  relevance: string;
  empathy: string;
};

// New v.2 6-part coaching framework types with enhanced skill breakdown
export type CoachFeedbackV2 = {
  qi_score: ClassifyResponse["scores"];
  skill_feedback: SkillFeedback;
  skill_detected: string;
  strengths: string;
  improvement_area: string;
  coaching_nugget: string;
  example_upgrades: string[];
  progress_note: string;
};

export type DailyChallengeFeedbackResponse = {
  schema: string;
  scenario_id?: number;
  user_question: string;
  feedback: CoachFeedback;
  meta: {
    brand_check: boolean;
    length_ok: boolean;
    banned_content: string[];
    hash: string;
  };
};

export type DailyChallengeFeedbackResponseV2 = {
  schema: string;
  scenario_id?: number;
  user_question: string;
  feedback: CoachFeedbackV2;
  meta: {
    brand_check: boolean;
    length_ok: boolean;
    banned_content: string[];
    hash: string;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://roga-api.fly.dev";

export async function getFeedback(scenario: string, userQuestion: string): Promise<CoachFeedback> {
  try {
    const response = await fetch(`${API_URL}/daily-challenge-feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        scenario_text: scenario,
        user_question: userQuestion
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: DailyChallengeFeedbackResponse = await response.json();
    return data.feedback;

  } catch (error) {
    console.error("Failed to get feedback:", error);

    // Fallback feedback for better UX
    return {
      qi_score: {
        overall: 3,
        clarity: 3,
        depth: 3,
        relevance: 3,
        empathy: 3
      },
      strengths: "You showed curiosity about the situation.",
      improvement: "Try being more specific about what you want to know.",
      coaching_moment: "Great questions combine clarity with depth to uncover what matters most.",
      technique_spotlight: {
        name: "The Clarifier",
        description: "Focus on making vague situations specific and actionable."
      },
      example_upgrades: [
        "What specific information do I need to move forward?",
        "Which part of this process needs the most clarity?",
        "What details would help me understand the expectations better?"
      ],
      progress_message: "🌟 Good start! Keep practicing to sharpen your questioning skills."
    };
  }
}

// New v.2 6-part coaching framework function
export async function getFeedbackV2(scenario: string, userQuestion: string): Promise<CoachFeedbackV2> {
  try {
    const response = await fetch(`${API_URL}/daily-challenge-feedback/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        scenario_text: scenario,
        user_question: userQuestion
      })
    });

    if (!response.ok) {
      throw new Error(`v.2 API request failed: ${response.status} ${response.statusText}`);
    }

    const data: DailyChallengeFeedbackResponseV2 = await response.json();
    return data.feedback;

  } catch (error) {
    console.error("Failed to get v.2 feedback:", error);

    // Fallback v.2 feedback for better UX
    return {
      qi_score: {
        overall: 2,
        clarity: 2,
        depth: 2,
        relevance: 3,
        empathy: 2
      },
      skill_feedback: {
        clarity: "Somewhat vague - it's unclear which part specifically needs explanation.",
        depth: "Shallow - stays at surface level without exploring underlying factors.",
        relevance: "Generally relevant but could target more critical elements.",
        empathy: "Limited empathy - focuses mainly on your own needs without considering others."
      },
      skill_detected: "Clarifying (attempted, but vague)",
      strengths: "You showed curiosity about the situation.",
      improvement_area: "Point to the specific part that's unclear to make your question actionable.",
      coaching_nugget: "Strong clarifiers point to the exact missing detail, not the whole message.",
      example_upgrades: [
        "What specific information do I need to move forward?",
        "Which part of this process needs the most clarity?",
        "What details would help me understand the expectations better?"
      ],
      progress_note: "🌟 Clarifier Level 1 → Add one specific detail to move toward Level 2."
    };
  }
}

// Alternative: Two-step pipeline for more control
export async function classifyQuestion(scenario: string, userQuestion: string): Promise<ClassifyResponse> {
  try {
    const response = await fetch(`${API_URL}/classify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        scenario_text: scenario,
        user_question: userQuestion
      })
    });

    if (!response.ok) {
      throw new Error(`Classification failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Classification failed:", error);
    throw error;
  }
}

export async function coachQuestion(scenario: string, userQuestion: string, classification: ClassifyResponse): Promise<CoachFeedback> {
  try {
    const response = await fetch(`${API_URL}/coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        scenario_text: scenario,
        user_question: userQuestion,
        classification: classification
      })
    });

    if (!response.ok) {
      throw new Error(`Coaching failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Coaching failed:", error);
    throw error;
  }
}