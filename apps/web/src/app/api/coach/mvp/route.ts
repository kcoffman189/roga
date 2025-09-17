// apps/web/src/app/api/coach/mvp/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || 'https://roga-api.fly.dev';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/coach/mvp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error calling MVP coach API:', error);

    // Return fallback MVP feedback on error
    return NextResponse.json({
      schema: "roga.mvp_scorecard.v1",
      scenario_id: null,
      user_question: "Question processing temporarily unavailable",
      feedback: {
        positive_reinforcement: "I love how you're thinking about this situation and taking the initiative to ask for clarity.",
        dimension_focus: "Let's focus on clarity and depth—being more specific about what exactly you need to understand.",
        pro_tip: "Try targeting the specific part that's unclear rather than asking generally about the whole thing.",
        suggested_upgrade: "What specific information do I need about [the unclear part] to move forward successfully?",
        score: 75,
        rubric: {
          clarity: 70,
          depth: 60,
          curiosity: 80,
          relevance: 85,
          empathy: 75
        }
      },
      meta: {
        brand_check: true,
        length_ok: true,
        banned_content: [],
        hash: "fallback_mvp"
      }
    }, { status: 200 });
  }
}