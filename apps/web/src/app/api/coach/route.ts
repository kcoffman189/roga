// apps/web/src/app/api/coach/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch("https://roga-api.fly.dev/coach", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({
      scenario_id: body.scenarioId ?? body.scenario_id,
      user_question: body.question ?? body.user_question,
      character_reply: body.character_reply,
    }),
  });

  const text = await res.text(); // preserve debug visibility
  return new NextResponse(text, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("Content-Type") || "application/json" },
  });
}