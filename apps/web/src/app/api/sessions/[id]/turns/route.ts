// apps/web/src/app/api/sessions/[id]/turns/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { id: sessionId } = await params;
    
    const res = await fetch(`https://roga-api.fly.dev/sessions/${sessionId}/turns`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      body: JSON.stringify({
        round: body.round,
        question: body.question,
        priorSummary: body.priorSummary,
      }),
    });

    const data = await res.json();
    
    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (err) {
    console.error('Failed to process turn:', err);
    return NextResponse.json(
      { error: "Failed to process turn" },
      { status: 500 }
    );
  }
}