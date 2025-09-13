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
        context: body.context,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Backend API error:', res.status, errorText);
      return NextResponse.json(
        { error: `Backend error: ${res.status}` },
        { status: res.status }
      );
    }

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