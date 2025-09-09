# apps/api/app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
import os, json
from openai import OpenAI

app = FastAPI()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

RubricKey = Literal["clarity", "depth", "insight", "openness"]
RubricStatus = Literal["good", "warn", "bad"]

class RubricItem(BaseModel):
    key: RubricKey
    label: str
    status: RubricStatus
    note: str

class Badge(BaseModel):
    name: str
    label: Optional[str] = None

class ScoreRequest(BaseModel):
    question: str
    scenarioId: Optional[int] = None
    scenario_id: Optional[int] = None
    scenarioTitle: Optional[str] = None
    scenarioText: Optional[str] = None

class ScoreResponse(BaseModel):
    scenario: dict
    question: str
    score: int = Field(ge=0, le=100)
    rubric: List[RubricItem]
    proTip: Optional[str] = None
    suggestedUpgrade: Optional[str] = None
    badge: Optional[Badge] = None

SCHEMA = {
    "name": "roga_scorecard_v1",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "score": {"type": "integer", "minimum": 0, "maximum": 100},
            "rubric": {
                "type": "array",
                "minItems": 4,
                "maxItems": 4,
                "items": {
                    "type": "object",
                    "required": ["key", "label", "status", "note"],
                    "properties": {
                        "key": {"type": "string", "enum": ["clarity","depth","insight","openness"]},
                        "label": {"type": "string"},
                        "status": {"type": "string", "enum": ["good","warn","bad"]},
                        "note": {"type": "string"}
                    },
                    "additionalProperties": False
                }
            },
            "proTip": {"type": "string"},
            "suggestedUpgrade": {"type": "string"},
            "badge": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "label": {"type": "string"}
                },
                "additionalProperties": False
            }
        },
        "required": ["score","rubric"]
    }
}

SYSTEM_PROMPT = """\
You are Roga, a coach that scores QUESTIONS (not answers).
Return ONLY JSON that matches the provided schema.

Scoring dimensions:
- clarity: Is the question unambiguous, concrete, and scoped?
- depth: Does it probe causes, tradeoffs, or constraints (beyond surface)?
- insight: Does it reveal a non-obvious angle or hypothesis?
- openness: Is it open-ended enough to invite meaningful information?

Guidance:
- Be concise. No pep talk—just crisp notes.
- Make the proTip highly practical and tailored to THIS user's question.
- The suggestedUpgrade must be a single, concrete rewrite of the user’s question that improves it on the weakest dimension.
- Do NOT leak chain-of-thought—only the JSON fields described by the schema.
"""

def build_user_prompt(question: str, scenario_title: str, scenario_text: str) -> str:
    return f"""\
SCENARIO: {scenario_title}
CONTEXT: {scenario_text}

USER_QUESTION: {question}

TASKS:
1) Score 0–100 overall (integer).
2) Produce exactly 4 rubric items (keys: clarity, depth, insight, openness) with short, pointed notes.
3) One sentence proTip tailored to the user's question.
4) A single best "suggestedUpgrade"—rewrite the user's question to be stronger.
5) Optionally assign a badge if warranted (e.g., "Clarity Star", "Deep Diver", "Insight Spark", "Open Door")."""

def clamp(v, lo, hi): return max(lo, min(hi, v))

@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Missing question")

    scenario_title = req.scenarioTitle or "Today's Scenario"
    scenario_text  = req.scenarioText  or ""
    user_prompt    = build_user_prompt(req.question.strip(), scenario_title, scenario_text)

    try:
        chat = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,           # stable grading
            seed=42,                   # stable-ish outputs for same inputs
            response_format={"type": "json_schema", "json_schema": SCHEMA},
            messages=[
                {"role":"system", "content": SYSTEM_PROMPT},
                {"role":"user",   "content": user_prompt}
            ],
        )

        raw = chat.choices[0].message.content
        data = json.loads(raw or "{}")

        # Server-side safety: fill & normalize
        score = int(clamp(int(data.get("score", 0)), 0, 100))
        rubric = data.get("rubric") or []
        # Ensure all four keys present exactly once
        keys = {"clarity":"Clarity","depth":"Depth","insight":"Insight","openness":"Openness"}
        normalized_rubric = []
        seen = set()
        for k,label in keys.items():
            item = next((r for r in rubric if r.get("key")==k), None)
            if item:
                status = item.get("status", "warn")
                note   = item.get("note", "")
            else:
                status = "warn"
                note   = ""
            normalized_rubric.append({
                "key": k, "label": label,
                "status": status if status in ["good","warn","bad"] else "warn",
                "note": note
            })
            seen.add(k)

        pro_tip = (data.get("proTip") or "").strip() or None
        suggested = (data.get("suggestedUpgrade") or "").strip() or None
        badge_in = data.get("badge") or None

        # Optional: simple server-side badge if model didn’t return one
        if not badge_in:
            if score >= 90:   badge_in = {"name":"Clarity Star","label":"Consistently sharp and focused"}
            elif score >= 80: badge_in = {"name":"Insight Spark","label":"Shows promising perspective"}

        out = {
            "scenario": {"title": scenario_title, "text": scenario_text},
            "question": req.question.strip(),
            "score": score,
            "rubric": normalized_rubric,
            "proTip": pro_tip,
            "suggestedUpgrade": suggested,
            "badge": badge_in
        }
        return out

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {e}")
