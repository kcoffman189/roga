import { NextRequest, NextResponse } from 'next/server';

type AskBody = {
  question?: string;
  user_question?: string;   // legacy
  userQuestion?: string;    // possible legacy
  scenarioId?: number;
  scenario_id?: number;     // legacy
  scenarioID?: number;      // defensive
};

type ApiRubricItem = {
  key: 'clarity' | 'depth' | 'insight' | 'openness';
  label: string;
  status: 'good' | 'warn' | 'bad';
  note: string;
};

type ApiBadge = { name: string; label?: string };

export type AskApiResponse = {
  scenario: { title: string; text: string };
  question: string;
  score: number;
  rubric: ApiRubricItem[];
  proTip?: string;
  suggestedUpgrade?: string;
  badge?: ApiBadge;
};

// POST /api/ask
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as AskBody;

    // Accept both legacy and new keys
    const question =
      body.question ?? body.user_question ?? body.userQuestion ?? '';
    const scenarioId =
      body.scenarioId ?? body.scenario_id ?? body.scenarioID ?? 1;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Missing "question"' },
        { status: 400 }
      );
    }

    // Forward to the FastAPI backend
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'https://roga-api.fly.dev';

    const res = await fetch(`${apiBase}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        scenarioId,
      }),
    });

    if (!res.ok) {
      let err = 'Request failed';
      try {
        const j = (await res.json()) as { error?: string };
        if (j?.error) err = j.error;
      } catch {
        // ignore
      }
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = (await res.json()) as AskApiResponse;
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
