// apps/web/src/app/api/ask/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch("https://roga-api.fly.dev/score", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      question: body.question ?? body.user_question,
      scenarioId: body.scenarioId ?? body.scenario_id,
      scenarioTitle: body.scenarioTitle,
      scenarioText: body.scenarioText,
      // Session mode fields
      mode: body.mode,
      round: body.round,
      sessionId: body.sessionId,
      sessionTitle: body.sessionTitle,
      sessionScene: body.sessionScene,
      sessionPersona: body.sessionPersona,
      priorSummary: body.priorSummary,
    }),
  });

  const text = await res.text(); // preserve debug visibility
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}
