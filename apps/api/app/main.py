# apps/api/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
import os, json, uuid
from openai import OpenAI

app = FastAPI()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# In-memory storage for MVP
SESSIONS: Dict[str, Dict[str, Any]] = {}
TURNS: Dict[str, List[Dict[str, Any]]] = {}

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
    # Session mode fields
    mode: Optional[str] = None
    round: Optional[int] = None
    sessionId: Optional[str] = None
    sessionTitle: Optional[str] = None
    sessionScene: Optional[str] = None
    sessionPersona: Optional[str] = None
    priorSummary: Optional[str] = None

class ScoreResponse(BaseModel):
    scenario: dict
    question: str
    score: int = Field(ge=0, le=100)
    rubric: List[RubricItem]
    proTip: Optional[str] = None
    suggestedUpgrade: Optional[str] = None
    badge: Optional[Badge] = None

# New session models
PersonaType = Literal["generic_philosopher", "business_coach", "teacher_mentor"]

class CreateSessionRequest(BaseModel):
    persona: PersonaType
    topic: Optional[str] = "Career guidance and strategic thinking"
    difficulty: Optional[str] = "intermediate"
    roundsPlanned: int = Field(default=5, ge=1, le=10)

class CreateSessionResponse(BaseModel):
    id: str
    persona: PersonaType
    topic: str
    difficulty: str
    roundsPlanned: int

class TurnRequest(BaseModel):
    round: int = Field(ge=1, le=10)
    question: str
    priorSummary: Optional[str] = None

class TurnResponse(BaseModel):
    round: int
    characterReply: str
    feedback: Dict[str, Any]

class CompleteSessionResponse(BaseModel):
    summary: str
    bestQuestion: str
    badges: List[str]

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

# Persona prompts
PERSONA_PROMPTS = {
    "generic_philosopher": """You are a thoughtful philosopher engaged in dialogue. You:
- Respond analytically and with reasoned perspective
- Keep replies concise (2-6 sentences)
- Invite reflection through your responses
- Are respectful but mildly challenging
- Avoid AI/meta talk unless specifically asked
- Focus on deeper meanings and implications""",
    
    "business_coach": """You are an experienced business coach in conversation. You:
- Focus on practical outcomes and tradeoffs
- Keep replies concise (2-6 sentences)  
- Challenge thinking around business decisions
- Are respectful but direct about realities
- Avoid AI/meta talk unless specifically asked
- Help explore strategic implications""",
    
    "teacher_mentor": """You are a wise teacher-mentor in dialogue. You:
- Guide through questions and gentle scaffolding
- Keep replies concise (2-6 sentences)
- Help deepen understanding progressively
- Are respectful and encouraging while challenging
- Avoid AI/meta talk unless specifically asked
- Focus on helping the person learn to think better"""
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
- The suggestedUpgrade must be a single, concrete rewrite of the user's question that improves it on the weakest dimension.
- Do NOT leak chain-of-thought—only the JSON fields described by the schema.
"""

def build_user_prompt(question: str, scenario_title: str, scenario_text: str, session_context: Optional[dict] = None) -> str:
    if session_context and session_context.get("mode") == "session":
        # Session mode: multi-round conversation context
        round_num = session_context.get("round", 1)
        session_title = session_context.get("sessionTitle", "")
        session_scene = session_context.get("sessionScene", "")
        session_persona = session_context.get("sessionPersona", "")
        prior_summary = session_context.get("priorSummary", "")
        
        context_section = f"""SESSION: {session_title}
SCENE: {session_scene}
PERSONA: {session_persona}
ROUND: {round_num}"""
        
        if prior_summary:
            context_section += f"\nPRIOR_ROUNDS: {prior_summary}"
            
        return f"""\
{context_section}

USER_QUESTION: {question}

TASKS:
1) Score 0–100 overall (integer). Consider this is round {round_num} of a multi-round conversation.
2) Produce exactly 4 rubric items (keys: clarity, depth, insight, openness) with short, pointed notes.
3) One sentence proTip tailored to the user's question and conversation context.
4) A single best "suggestedUpgrade"—rewrite the user's question to be stronger in this conversational context.
5) Optionally assign a badge if warranted (e.g., "Clarity Star", "Deep Diver", "Insight Spark", "Open Door")."""
    else:
        # Standard daily challenge mode
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

def call_openai_character(persona: PersonaType, question: str, round_num: int, prior_summary: Optional[str] = None):
    """Generate persona character response"""
    system_prompt = PERSONA_PROMPTS[persona]
    
    context = f"This is round {round_num} of our conversation."
    if prior_summary:
        context += f" Previous context: {prior_summary}"
    
    user_prompt = f"{context}\n\nUser's question: {question}\n\nRespond as the persona (2-6 sentences):"
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=200,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"I appreciate your question. Let me think about this thoughtfully and get back to you with a meaningful response."

def call_openai_evaluator(question: str, character_reply: Optional[str] = None):
    """Generate evaluation feedback for the user's question"""
    user_prompt = f"USER_QUESTION: {question}"
    if character_reply:
        user_prompt += f"\n\nCHARACTER_REPLY: {character_reply}"
    
    user_prompt += "\n\nEvaluate the quality of the user's question using the 4 rubric dimensions."
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            seed=42,
            response_format={"type": "json_schema", "json_schema": SCHEMA},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ]
        )
        
        raw = response.choices[0].message.content
        return json.loads(raw or "{}")
    except Exception as e:
        # Fallback feedback
        return {
            "score": 70,
            "rubric": [
                {"key": "clarity", "label": "Clarity", "status": "good", "note": "Clear question"},
                {"key": "depth", "label": "Depth", "status": "warn", "note": "Could probe deeper"},
                {"key": "insight", "label": "Insight", "status": "warn", "note": "Surface level"},
                {"key": "openness", "label": "Openness", "status": "good", "note": "Invites discussion"}
            ],
            "proTip": "Try adding more context or specific examples to deepen your question."
        }

@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Missing question")

    # Build session context if in session mode
    session_context = None
    if req.mode == "session":
        session_context = {
            "mode": req.mode,
            "round": req.round,
            "sessionTitle": req.sessionTitle,
            "sessionScene": req.sessionScene,
            "sessionPersona": req.sessionPersona,
            "priorSummary": req.priorSummary
        }

    scenario_title = req.scenarioTitle or req.sessionTitle or "Today's Scenario"
    scenario_text  = req.scenarioText  or req.sessionScene or ""
    user_prompt    = build_user_prompt(req.question.strip(), scenario_title, scenario_text, session_context)

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

# New session endpoints
@app.post("/sessions", response_model=CreateSessionResponse)
def create_session(req: CreateSessionRequest):
    """Create a new Roga session"""
    session_id = str(uuid.uuid4())
    
    session_data = {
        "id": session_id,
        "persona": req.persona,
        "topic": req.topic,
        "difficulty": req.difficulty,
        "roundsPlanned": req.roundsPlanned,
        "currentRound": 0,
        "created_at": None  # Could add timestamp if needed
    }
    
    SESSIONS[session_id] = session_data
    TURNS[session_id] = []
    
    return CreateSessionResponse(
        id=session_id,
        persona=req.persona,
        topic=req.topic,
        difficulty=req.difficulty,
        roundsPlanned=req.roundsPlanned
    )

@app.post("/sessions/{session_id}/turns", response_model=TurnResponse)
def process_turn(session_id: str, req: TurnRequest):
    """Process a turn: generate character reply and feedback"""
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = SESSIONS[session_id]
    
    # Validate round
    if req.round > session["roundsPlanned"]:
        raise HTTPException(status_code=400, detail="Round exceeds planned rounds")
    
    # Generate character response
    character_reply = call_openai_character(
        persona=session["persona"],
        question=req.question,
        round_num=req.round,
        prior_summary=req.priorSummary
    )
    
    # Generate feedback
    feedback_data = call_openai_evaluator(req.question, character_reply)
    
    # Normalize feedback to match existing structure
    score = int(clamp(int(feedback_data.get("score", 70)), 0, 100))
    rubric = feedback_data.get("rubric", [])
    
    # Ensure all four keys present exactly once
    keys = {"clarity": "Clarity", "depth": "Depth", "insight": "Insight", "openness": "Openness"}
    normalized_rubric = []
    for k, label in keys.items():
        item = next((r for r in rubric if r.get("key") == k), None)
        if item:
            status = item.get("status", "warn")
            note = item.get("note", "")
        else:
            status = "warn"
            note = ""
        normalized_rubric.append({
            "key": k, "label": label,
            "status": status if status in ["good", "warn", "bad"] else "warn",
            "note": note
        })
    
    feedback = {
        "score": score,
        "rubric": normalized_rubric,
        "proTip": feedback_data.get("proTip"),
        "suggestedUpgrade": feedback_data.get("suggestedUpgrade"),
        "badge": feedback_data.get("badge")
    }
    
    # Store the turn
    turn_data = {
        "round": req.round,
        "question": req.question,
        "characterReply": character_reply,
        "feedback": feedback,
        "priorSummary": req.priorSummary
    }
    
    TURNS[session_id].append(turn_data)
    SESSIONS[session_id]["currentRound"] = req.round
    
    return TurnResponse(
        round=req.round,
        characterReply=character_reply,
        feedback=feedback
    )

@app.post("/sessions/{session_id}/complete", response_model=CompleteSessionResponse)
def complete_session(session_id: str):
    """Complete a session and provide summary"""
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = SESSIONS[session_id]
    turns = TURNS.get(session_id, [])
    
    if not turns:
        raise HTTPException(status_code=400, detail="No turns found for this session")
    
    # Find best question (highest score)
    best_turn = max(turns, key=lambda t: t["feedback"]["score"])
    best_question = best_turn["question"]
    
    # Generate summary
    avg_score = sum(t["feedback"]["score"] for t in turns) / len(turns)
    total_rounds = len(turns)
    
    summary = f"Completed {total_rounds}-round session with {session['persona'].replace('_', ' ')}. Average score: {avg_score:.0f}/100."
    
    # Simple badge system
    badges = []
    if avg_score >= 90:
        badges.append("Master Questioner")
    elif avg_score >= 80:
        badges.append("Skilled Inquirer")
    elif avg_score >= 70:
        badges.append("Thoughtful Asker")
    
    if any(t["feedback"]["score"] >= 95 for t in turns):
        badges.append("Perfect Round")
    
    return CompleteSessionResponse(
        summary=summary,
        bestQuestion=best_question,
        badges=badges
    )
