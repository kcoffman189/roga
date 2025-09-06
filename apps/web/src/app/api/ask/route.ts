import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://roga-api.fly.dev";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Forward to backend
    const r = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await r.text();
    console.log("Proxy /api/ask → backend status:", r.status);
    console.log("Proxy /api/ask → backend response:", text);

    if (!r.ok) {
      return NextResponse.json(
        { error: "UpstreamError", detail: text },
        { status: r.status }
      );
    }

    // Return backend response as-is
    return new NextResponse(text, {
      status: r.status,
      headers: {
        "Content-Type":
          r.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err: any) {
    console.error("Proxy /api/ask error:", err);
    return NextResponse.json(
      { error: "ProxyError", detail: String(err?.message ?? err) },
      { status: 502 }
    );
  }
}
