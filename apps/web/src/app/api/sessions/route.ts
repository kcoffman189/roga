// apps/web/src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const res = await fetch("https://roga-api.fly.dev/sessions", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify({
        persona: body.persona,
        topic: body.topic,
        difficulty: body.difficulty,
        roundsPlanned: body.roundsPlanned || 5,
      }),
    });

    const data = await res.json();
    
    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (err) {
    console.error('Failed to create session:', err);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}