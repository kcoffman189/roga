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