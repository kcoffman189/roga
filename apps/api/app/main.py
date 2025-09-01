from fastapi import FastAPI
from pydantic import BaseModel
import os

app = FastAPI(title="Roga API", version="0.1.0")

@app.get("/healthz")
def health():
    return {
        "ok": True,
        "env": {
            "app_tz": os.getenv("APP_TIMEZONE", "America/Denver"),
            "db": bool(os.getenv("DATABASE_URL")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
        }
    }

# --- MVP placeholders ---
class GenerateRequest(BaseModel):
    track: str = "business"
    difficulty: int | None = 1

class GenerateResponse(BaseModel):
    scenario_id: str
    text: str

@app.post("/v1/challenge/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    # TODO: call LLM; stub for now
    return {"scenario_id": "stub-1", "text": "Your team’s launch is slipping two weeks. What should you ask the PM?"}

class ScoreRequest(BaseModel):
    scenario_id: str
    user_question: str

@app.post("/v1/challenge/score")
def score(req: ScoreRequest):
    # TODO: call LLM; stub for now
    return {
        "scores": {"relevance": 4, "depth": 3, "clarity": 5, "empathy": 4, "follow_up": 0},
        "overall": 4.0,
        "feedback": "Nice focus on the core risk; consider surfacing assumptions.",
        "rewrite": "What risk drove the slip, and what tradeoffs did we consider?",
        "tags": ["challenge-assumption","clarify-goal"]
    }
