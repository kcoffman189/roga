// apps/web/src/app/api/sessions/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id;
    
    const res = await fetch(`https://roga-api.fly.dev/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
    });

    const data = await res.json();
    
    return NextResponse.json(data, {
      status: res.status,
    });
  } catch (err) {
    console.error('Failed to complete session:', err);
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    );
  }
}