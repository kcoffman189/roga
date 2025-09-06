import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://roga-api.fly.dev";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const r = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text(); // pass through body as-is
    return new NextResponse(text, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "ProxyError", detail: String(e?.message ?? e) },
      { status: 502 }
    );
  }
}
