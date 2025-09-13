# apps/api/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
import os, json, uuid, hashlib
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

# Coaching Engine Models (v1.0)
QISkill = Literal[
    "clarifying", "probing", "criteria-setting", "perspective-taking", 
    "assumption-testing", "root-cause", "prioritizing", "exploring-alternatives",
    "systems-thinking", "outcome-focused"
]

class CoachFeedback(BaseModel):
    score_1to5: int = Field(ge=1, le=5)
    qi_skills: List[QISkill] = Field(min_length=1, max_length=3)
    why_it_works: str = Field(max_length=80)
    improvement: str = Field(max_length=80)
    pro_tip: str = Field(max_length=80)
    example_upgrade: str = Field(max_length=150)

class CoachMeta(BaseModel):
    brand_check: bool
    length_ok: bool
    banned_content: List[str] = []
    hash: str

class CoachIn(BaseModel):
    scenario_id: Optional[int] = None
    user_question: str
    character_reply: Optional[str] = None

class CoachResponse(BaseModel):
    schema: str = "roga.feedback.v1"
    scenario_id: Optional[int]
    user_question: str
    character_reply: Optional[str]
    coach_feedback: CoachFeedback
    meta: CoachMeta

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

# Coaching Engine Prompts Library
COACHING_PROMPTS = {
    "qi_classifier": """You are a QI Skills classifier. Analyze the user's question and identify 1-3 relevant QI skills.

QI Skills taxonomy:
- clarifying: Making ambiguous things specific and concrete
- probing: Digging deeper to understand causes, mechanisms, or hidden factors
- criteria-setting: Establishing success metrics or evaluation standards
- perspective-taking: Exploring different viewpoints or stakeholders
- assumption-testing: Questioning underlying beliefs or givens
- root-cause: Finding fundamental causes rather than symptoms
- prioritizing: Determining what matters most or sequencing
- exploring-alternatives: Considering different options or approaches
- systems-thinking: Understanding interconnections and broader context
- outcome-focused: Targeting specific results or end states

Return ONLY a JSON array of 1-3 skill names. Example: ["clarifying", "probing"]""",

    "judge": """You are a coaching feedback judge. Evaluate the coaching feedback using these criteria:

RUBRIC v1.1:
- Clarity (1-5): Is the feedback clear, specific, and actionable?
- QI Alignment (1-5): Does it properly address QI skill development?
- Brand (1-5): Is it supportive, clever, concise, and encouraging?

THRESHOLDS: Clarity ≥4, QI Alignment ≥4, Brand ≥5

Return JSON with scores: {"clarity": 4, "qi_alignment": 4, "brand": 5, "passes": true}""",

    "rewrite": """You are a coaching feedback rewriter. Take the failed feedback and improve it to meet these standards:

REQUIREMENTS:
- ≤80 words total
- Structure: Why it works → Improvement → Pro Tip → Example upgrade
- Tone: supportive, clever, concise
- Must name ≥1 QI skill explicitly
- Be educational and actionable

ORIGINAL FEEDBACK: {original_feedback}
FAILURE REASONS: {failure_reasons}

Rewrite the feedback to fix these issues."""
}

# Coaching Engine Schema for OpenAI
COACHING_SCHEMA = {
    "name": "roga_coaching_v1",
    "schema": {
        "type": "object",
        "properties": {
            "score_1to5": {"type": "integer", "minimum": 1, "maximum": 5},
            "qi_skills": {
                "type": "array",
                "minItems": 1,
                "maxItems": 3,
                "items": {
                    "type": "string",
                    "enum": ["clarifying", "probing", "criteria-setting", "perspective-taking", 
                            "assumption-testing", "root-cause", "prioritizing", "exploring-alternatives",
                            "systems-thinking", "outcome-focused"]
                }
            },
            "why_it_works": {"type": "string", "maxLength": 80},
            "improvement": {"type": "string", "maxLength": 80},
            "pro_tip": {"type": "string", "maxLength": 80},
            "example_upgrade": {"type": "string", "maxLength": 150}
        },
        "required": ["score_1to5", "qi_skills", "why_it_works", "improvement", "pro_tip", "example_upgrade"],
        "additionalProperties": False
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

# Coaching Engine Pipeline Functions
def generate_coaching_feedback(question: str, character_reply: Optional[str] = None) -> Dict[str, Any]:
    """Generate initial coaching feedback using OpenAI"""
    system_prompt = """You are Roga, an expert Question Intelligence coach. Analyze the user's question and provide structured coaching feedback.

Structure your response as:
- why_it_works: What's effective about this question (be specific)
- improvement: One key area to strengthen 
- pro_tip: Actionable advice for better questioning
- example_upgrade: A concrete rewrite that improves the question

Tone: Supportive, clever, concise. Always name at least one QI skill."""
    
    user_prompt = f"USER QUESTION: {question}"
    if character_reply:
        user_prompt += f"\nCHARACTER REPLY: {character_reply}"
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            response_format={"type": "json_schema", "json_schema": COACHING_SCHEMA},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        return json.loads(response.choices[0].message.content or "{}")
    except Exception as e:
        # Fallback response
        return {
            "score_1to5": 3,
            "qi_skills": ["clarifying"],
            "why_it_works": "Clear and direct question",
            "improvement": "Add more context for deeper insight",
            "pro_tip": "Try asking 'what would success look like here?'",
            "example_upgrade": f"Instead of '{question}', try: 'What specific outcome are we aiming for and how will we know we've achieved it?'"
        }

def classify_qi_skills(question: str) -> List[str]:
    """Classify QI skills present in the question"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {"role": "system", "content": COACHING_PROMPTS["qi_classifier"]},
                {"role": "user", "content": f"QUESTION: {question}"}
            ]
        )
        skills = json.loads(response.choices[0].message.content or "[]")
        # Validate skills are in our enum
        valid_skills = [s for s in skills if s in [
            "clarifying", "probing", "criteria-setting", "perspective-taking", 
            "assumption-testing", "root-cause", "prioritizing", "exploring-alternatives",
            "systems-thinking", "outcome-focused"
        ]]
        return valid_skills[:3] if valid_skills else ["clarifying"]
    except:
        return ["clarifying"]

def judge_feedback_quality(feedback: Dict[str, Any]) -> Dict[str, Any]:
    """Judge feedback quality against rubric thresholds"""
    feedback_text = f"""
    Why it works: {feedback.get('why_it_works', '')}
    Improvement: {feedback.get('improvement', '')}
    Pro tip: {feedback.get('pro_tip', '')}
    Example: {feedback.get('example_upgrade', '')}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.2,
            messages=[
                {"role": "system", "content": COACHING_PROMPTS["judge"]},
                {"role": "user", "content": f"FEEDBACK TO EVALUATE: {feedback_text}"}
            ]
        )
        return json.loads(response.choices[0].message.content or '{"clarity": 3, "qi_alignment": 3, "brand": 3, "passes": false}')
    except:
        return {"clarity": 3, "qi_alignment": 3, "brand": 3, "passes": False}

def check_guardrails(feedback: Dict[str, Any]) -> Dict[str, Any]:
    """Apply guardrails: brand style, length, content checks"""
    issues = []
    
    # Check word count (rough estimate: 5 chars per word)
    total_chars = sum(len(str(feedback.get(field, ""))) for field in 
                     ["why_it_works", "improvement", "pro_tip", "example_upgrade"])
    if total_chars > 400:  # ~80 words * 5 chars
        issues.append("too_long")
    
    # Check for QI skill mention
    text = " ".join([str(feedback.get(field, "")) for field in 
                    ["why_it_works", "improvement", "pro_tip"]])
    qi_skills_mentioned = any(skill in text.lower() for skill in [
        "clarify", "probe", "criteria", "perspective", "assumption", 
        "root cause", "priority", "alternative", "system", "outcome"
    ])
    if not qi_skills_mentioned:
        issues.append("missing_qi_skill")
    
    return {
        "length_ok": "too_long" not in issues,
        "brand_check": "missing_qi_skill" not in issues,
        "banned_content": issues
    }

def coach_filter_pipeline(question: str, character_reply: Optional[str] = None) -> CoachFeedback:
    """7-step CoachFilter pipeline"""
    
    # Step 1-2: Generate and normalize feedback
    feedback = generate_coaching_feedback(question, character_reply)
    
    # Step 3: Classify QI Skills  
    qi_skills = classify_qi_skills(question)
    feedback["qi_skills"] = qi_skills
    
    # Step 4: Judge quality
    quality_check = judge_feedback_quality(feedback)
    
    # Step 5-6: Critique & Revise (max 2 iterations)
    revision_count = 0
    while not quality_check.get("passes", False) and revision_count < 2:
        # For now, just adjust the feedback slightly rather than full rewrite
        if quality_check.get("clarity", 0) < 4:
            feedback["improvement"] = "Focus on one specific aspect to improve"
        if quality_check.get("brand", 0) < 5:
            feedback["pro_tip"] = f"Try the {qi_skills[0]} technique for better results"
        
        revision_count += 1
        quality_check = judge_feedback_quality(feedback)
    
    # Step 7: Apply guardrails and style check
    guardrails = check_guardrails(feedback)
    
    # Ensure all fields are present and valid
    return CoachFeedback(
        score_1to5=min(5, max(1, feedback.get("score_1to5", 3))),
        qi_skills=qi_skills,
        why_it_works=feedback.get("why_it_works", "Shows good questioning instinct")[:80],
        improvement=feedback.get("improvement", "Add more specific context")[:80], 
        pro_tip=feedback.get("pro_tip", "Ask 'what would success look like?'")[:80],
        example_upgrade=feedback.get("example_upgrade", "What specific outcome are we targeting?")[:150]
    )

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

@app.post("/coach", response_model=CoachResponse)
def coach(req: CoachIn):
    """New coaching endpoint with 7-step CoachFilter pipeline"""
    if not req.user_question or not req.user_question.strip():
        raise HTTPException(status_code=400, detail="Missing user question")
    
    try:
        # Run the 7-step coaching pipeline
        coach_feedback = coach_filter_pipeline(req.user_question, req.character_reply)
        
        # Generate metadata
        feedback_content = f"{coach_feedback.why_it_works} {coach_feedback.improvement} {coach_feedback.pro_tip} {coach_feedback.example_upgrade}"
        content_hash = hashlib.sha256(feedback_content.encode()).hexdigest()[:16]
        
        guardrails = check_guardrails(coach_feedback.dict())
        
        meta = CoachMeta(
            brand_check=guardrails["brand_check"],
            length_ok=guardrails["length_ok"],
            banned_content=guardrails["banned_content"],
            hash=content_hash
        )
        
        return CoachResponse(
            schema="roga.feedback.v1",
            scenario_id=req.scenario_id,
            user_question=req.user_question.strip(),
            character_reply=req.character_reply,
            coach_feedback=coach_feedback,
            meta=meta
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Coaching pipeline failed: {e}")

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
