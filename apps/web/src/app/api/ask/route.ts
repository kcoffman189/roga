// apps/web/src/app/api/ask/route.ts
import type { NextRequest } from 'next/server';

const API_BASE = process.env.FLY_API_URL ?? 'https://roga-api.fly.dev';

function json(data: any, init?: number | ResponseInit) {
  const base: ResponseInit = typeof init === 'number' ? { status: init } : (init ?? {});
  return new Response(JSON.stringify(data), {
    ...base,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(base.headers ?? {}),
    },
  });
}

// Allow preflight and browser POSTs
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type',
      'access-control-max-age': '600',
    },
  });
}

// Main POST handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // Accept both legacy and new keys
    const question =
      body?.question ??
      body?.user_question ??
      body?.userQuestion ??
      '';
    const scenarioId =
      body?.scenarioId ??
      body?.scenario_id ??
      body?.scenarioID ??
      1;

    if (!question || typeof question !== 'string') {
      return json({ error: 'Missing "question"' }, 400);
    }

    // Proxy to Fly backend
    const upstream = await fetch(`${API_BASE}/ask`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, scenarioId }),
      // Vercel edge/serverless tolerates default agent
      // keep simple to avoid TLS issues
    });

    // Pass through non-OKs so UI can surface errors
    const text = await upstream.text();
    let data: any = null;
    try { data = JSON.parse(text); } catch { /* keep text */ }

    if (!upstream.ok) {
      return json(
        { error: data?.error ?? text ?? `Upstream ${upstream.status}` },
        upstream.status,
      );
    }

    // Ensure UI-friendly shape (scenario, question, score, rubric, proTip, suggestedUpgrade, badge)
    if (data && typeof data === 'object') {
      // Tolerate alternate backend keys
      const normalized = {
        scenario: {
          title: data?.scenario?.title ?? "Today’s Scenario",
          text:  data?.scenario?.text  ?? data?.scenarioText ?? '',
        },
        question:          data?.question ?? data?.userQuestion ?? question,
        score:             Math.round(data?.score ?? data?.total ?? 0),
        rubric: (data?.rubric ?? data?.dimensions ?? []).map((r: any) => ({
          key:    String(r?.key ?? r?.name ?? 'clarity').toLowerCase(),
          label:  r?.label ?? r?.name ?? 'Clarity',
          status: (r?.status ?? r?.level ?? 'warn') as 'good' | 'warn' | 'bad',
          note:   r?.note ?? r?.comment ?? '',
        })),
        proTip:            data?.proTip ?? data?.tip ?? '',
        suggestedUpgrade:  data?.suggestedUpgrade ?? data?.upgrade ?? '',
        badge: data?.badge
          ? { name: data.badge.name, label: data.badge.label ?? data.badge.name }
          : undefined,
      };
      return json(normalized, 200);
    }

    // If upstream returned non-JSON OK
    return json({ error: 'Invalid upstream payload', raw: text }, 502);
  } catch (err: any) {
    return json({ error: err?.message ?? 'Server error' }, 500);
  }
}
