# apps/api/main.py

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import re

app = FastAPI()

# --- CORS (keep your existing list; these are safe defaults) ---
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://roga.me",
    "https://www.roga.me",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"ok": True}

# --- Helper: tiny heuristic scorer so the UI shows a full card even without OpenAI ---
QUESTION_WORDS = ("what", "how", "why", "who", "where", "when", "which")

def score_question(q: str):
    q_clean = q.strip()
    lower = q_clean.lower()

    # clarity
    clarity = "good" if len(q_clean) >= 12 else "warn"
    clarity_note = "Clear and easy to understand." if clarity == "good" else "A bit short; add context."

    # openness (yes/no vs open-ended)
    is_open = lower.startswith(QUESTION_WORDS) and not re.search(r"^\s*(do|did|does|is|are|can|will|would)\b", lower)
    openness = "good" if is_open else "bad"
    openness_note = "Open-ended question." if is_open else "Closed yes/no; try open-ended."

    # depth (specific vs vague)
    depth = "good" if len(re.findall(r"\b(specific|example|impact|because|trade[- ]?off|criteria)\b", lower)) > 0 else "warn"
    depth_note = "Targets specifics." if depth == "good" else "Could go deeper; ask for specifics."

    # insight (asks about effects, reasons, decisions)
    insightful = bool(re.search(r"\b(why|how|impact|consequence|prioritize|criteria)\b", lower))
    insight = "good" if insightful else "warn"
    insight_note = "Likely to reveal reasoning." if insight == "good" else "Might not surface reasoning."

    # naive score from rubric
    raw = sum([{"good": 25, "warn": 15, "bad": 5}[s] for s in (clarity, depth, insight, openness)])
    score = max(0, min(100, raw))

    pro_tip = "Try focusing on specifics and keep it open-ended."
    upgrade = "What are you in the mood for, and what made you choose that?"

    rubric = [
        {"key": "clarity", "label": "Clarity", "status": clarity, "note": clarity_note},
        {"key": "depth", "label": "Depth", "status": depth, "note": depth_note},
        {"key": "insight", "label": "Insight", "status": insight, "note": insight_note},
        {"key": "openness", "label": "Openness", "status": openness, "note": openness_note},
    ]

    return score, rubric, pro_tip, upgrade


@app.post("/ask")
async def ask(request: Request):
    """
    Accepts both snake_case and camelCase keys:
      - user_question / question
      - scenario_id   / scenarioId
    Returns a response shaped exactly for the ScoreCard UI.
    """
    data = await request.json()
    question = data.get("question") or data.get("user_question") or ""
    scenario_id = data.get("scenarioId") or data.get("scenario_id")

    # --- Heuristic fallback (so the UI always shows a full card) ---
    score, rubric, pro_tip, upgrade = score_question(question)

    # You can optionally swap this section for a call to OpenAI to generate
    # score/rubric/tips dynamically and keep the same output shape.

    resp = {
        "scenario": {
            "title": f"Scenario #{scenario_id}" if scenario_id is not None else "Today’s Scenario",
            "text": "",  # Frontend already falls back to local scenario text
        },
        "question": question,
        "score": score,
        "rubric": rubric,
        "proTip": pro_tip,
        "suggestedUpgrade": upgrade,
        "badge": {"name": "curious", "label": "Climate Curious"}  # example badge
    }
    return JSONResponse(resp)
