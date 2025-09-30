#!/usr/bin/env python3
"""
Script to add V3 types and functions to actions.ts
"""

# Read the actions.ts file
with open("apps/web/src/app/game/actions.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Find the insertion point before the function definitions
insertion_point = content.find("// Server Actions")
if insertion_point == -1:
    # Find a different insertion point
    insertion_point = content.find("export async function")
    if insertion_point == -1:
        print("Could not find insertion point")
        exit(1)

# V3 types and functions to add
v3_additions = '''
// Enhanced V3 types for comprehensive feedback
export type EnhancedSkillFeedback = {
  clarity: string;
  depth: string;
  relevance: string;
  empathy: string;
};

export type CoachFeedbackV3 = {
  qi_score: ClassifyResponse["scores"];
  skill_feedback: EnhancedSkillFeedback;
  skill_detected: string;
  strengths: string;
  improvement_area: string;
  coaching_nugget: string;
  example_upgrades: string[];
  progress_note: string;
};

export type DailyChallengeFeedbackResponseV3 = {
  schema: string;
  scenario_id?: number;
  user_question: string;
  feedback: CoachFeedbackV3;
  meta: {
    brand_check: boolean;
    length_ok: boolean;
    banned_content: string[];
    hash: string;
  };
};

// V3 Enhanced Daily Challenge Feedback with comprehensive 6-part framework
export async function getFeedbackV3(scenario: string, userQuestion: string): Promise<CoachFeedbackV3> {
  try {
    const response = await fetch(`${process.env.ROGA_API_URL || "https://roga-api.fly.dev"}/daily-challenge-feedback/v3`, {
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
      throw new Error(`V3 feedback failed: ${response.status}`);
    }

    const result: DailyChallengeFeedbackResponseV3 = await response.json();
    return result.feedback;

  } catch (error) {
    console.error("V3 feedback failed:", error);
    throw error;
  }
}

// V3 Individual coaching function
export async function coachQuestionV3(scenario: string, userQuestion: string, classification: ClassifyResponse): Promise<CoachFeedbackV3> {
  try {
    const response = await fetch(`${process.env.ROGA_API_URL || "https://roga-api.fly.dev"}/coach/v3`, {
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
      throw new Error(`V3 coaching failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error("V3 coaching failed:", error);
    throw error;
  }
}

'''

# Insert the V3 additions
new_content = content[:insertion_point] + v3_additions + "\n" + content[insertion_point:]

# Write the updated file
with open("apps/web/src/app/game/actions.ts", "w", encoding="utf-8") as f:
    f.write(new_content)

print("V3 types and functions added to actions.ts successfully!")