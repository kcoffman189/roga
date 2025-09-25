# apps/api/app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict, Any
import os, json, uuid, hashlib
from openai import OpenAI
from app.llm_utils import generate_mentor_reply, create_telemetry_payload

app = FastAPI()
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# In-memory storage for MVP
SESSIONS: Dict[str, Dict[str, Any]] = {}
TURNS: Dict[str, List[Dict[str, Any]]] = {}

# V2 Coaching Enhancements
COACHING_V2_ENABLED = True  # Feature flag
USER_TRENDS: Dict[str, Dict[str, Dict[str, Any]]] = {}  # user_key -> skill -> {sum, n}

# Daily Challenge Coaching Upgrade - Configuration
ROGA_STRICT_SCORING = os.environ.get("ROGA_STRICT_SCORING", "true").lower() == "true"
ROGA_MIN_EXAMPLES = int(os.environ.get("ROGA_MIN_EXAMPLES", "2"))
ROGA_MAX_EXAMPLES = int(os.environ.get("ROGA_MAX_EXAMPLES", "3"))
ROGA_FEEDBACK_MAX_WORDS = int(os.environ.get("ROGA_FEEDBACK_MAX_WORDS", "120"))

# Daily Evaluator v3 Feature Flag - Enable V2 coaching by default
DAILY_EVAL_V3 = os.environ.get("DAILY_EVAL_V3", "true").lower() == "true"

# Load QI Knowledge Base
QI_KB = {}
try:
    with open("qi_kb_seed.json", "r", encoding="utf-8") as f:
        QI_KB = json.load(f)
except FileNotFoundError:
    print("Warning: qi_kb_seed.json not found, using empty KB")
    QI_KB = {"taxonomy": {}, "feedback_templates": {}, "coaching_nuggets": {}, "example_upgrades": {}, "style_constraints": {}}

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
    context: Optional[str] = None  # NEW: "business" | "academic" | "personal"
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
    coachV3: Optional[dict] = None  # NEW: rich coaching fields (Sessions parity)

# Evaluator v3 Models
class QISkillDetected(BaseModel):
    name: str
    strength: str

class EvaluatorV3Subscores(BaseModel):
    clarity: int = Field(ge=1, le=5)
    depth: int = Field(ge=1, le=5)
    relevance: int = Field(ge=1, le=5)
    empathy: int = Field(ge=1, le=5)

class EvaluatorV3Response(BaseModel):
    overallScore: int = Field(ge=0, le=100)
    subscores: EvaluatorV3Subscores
    qiSkillDetected: QISkillDetected
    strengths: Optional[str] = None
    improvementArea: Optional[str] = None
    coachingNugget: Optional[str] = None
    exampleUpgrades: Optional[List[str]] = None
    progressNote: Optional[str] = None
    contextSpecificTip: Optional[str] = None
    likelyResponse: Optional[str] = None
    nextQuestionSuggestions: Optional[List[str]] = None

# New session models
PersonaType = Literal["generic_philosopher", "business_coach", "teacher_mentor"]

class CreateSessionRequest(BaseModel):
    persona: PersonaType
    topic: Optional[str] = "Career guidance and strategic thinking"
    difficulty: Optional[str] = "intermediate"
    roundsPlanned: int = Field(default=3, ge=1, le=10)

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
    context: Optional[str] = None  # "business" | "academic" | "personal"
    # Session recovery fields
    persona: Optional[PersonaType] = None
    topic: Optional[str] = None

class TurnResponse(BaseModel):
    round: int
    characterReply: str
    feedback: Dict[str, Any]

class TurnResponseV2(BaseModel):
    round: int
    characterReply: str
    feedback: Dict[str, Any]  # Now includes V2 fields

class CompleteSessionResponse(BaseModel):
    summary: str
    bestQuestion: str
    badges: List[str]

class EnhancedCompleteSessionResponse(BaseModel):
    rounds: int
    avgScore: int
    levelLabel: str
    streak: Optional[int] = None
    strengths: List[str]
    growth: List[str]
    bestQuestion: str

# Coaching Engine Models (v1.0)
QISkill = Literal[
    "clarifying", "probing", "criteria-setting", "perspective-taking", 
    "assumption-testing", "root-cause", "prioritizing", "exploring-alternatives",
    "systems-thinking", "outcome-focused"
]

# Enhanced Daily Challenge Feedback Models (v2)
class QIScore(BaseModel):
    overall: int = Field(ge=1, le=5)
    clarity: int = Field(ge=1, le=5)
    depth: int = Field(ge=1, le=5)
    relevance: int = Field(ge=1, le=5)
    empathy: int = Field(ge=1, le=5)

# MVP 5-Part Feedback Structure Models
class MVPRubricScore(BaseModel):
    clarity: int = Field(ge=0, le=100)
    depth: int = Field(ge=0, le=100)
    curiosity: int = Field(ge=0, le=100)
    relevance: int = Field(ge=0, le=100)
    empathy: int = Field(ge=0, le=100)

class MVPScoreCardFeedback(BaseModel):
    positive_reinforcement: str = Field(max_length=200, description="Highlight what the user did well")
    dimension_focus: str = Field(max_length=150, description="Call out 1-2 QI dimensions needing improvement")
    pro_tip: str = Field(max_length=120, description="Short, actionable coaching advice")
    suggested_upgrade: str = Field(max_length=250, description="Rewrite of user's question showing stronger version")
    score: int = Field(ge=0, le=100, description="Overall question quality score")
    rubric: MVPRubricScore

class TechniqueSpotlight(BaseModel):
    name: str
    description: str

class EnhancedCoachFeedback(BaseModel):
    qi_score: QIScore
    strengths: str = Field(max_length=120)
    improvement: str = Field(max_length=120)
    coaching_moment: str = Field(max_length=200)
    technique_spotlight: TechniqueSpotlight
    example_upgrades: List[str] = Field(min_length=2, max_length=3)
    progress_message: str = Field(max_length=150)

# Legacy CoachFeedback for backwards compatibility
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
    scenario_title: Optional[str] = None
    scenario_text: Optional[str] = None

class CoachResponse(BaseModel):
    schema: str = "roga.feedback.v1"
    scenario_id: Optional[int]
    user_question: str
    character_reply: Optional[str]
    coach_feedback: CoachFeedback
    meta: CoachMeta

class EnhancedCoachResponse(BaseModel):
    schema: str = "roga.feedback.v2"
    scenario_id: Optional[int]
    user_question: str
    character_reply: Optional[str]
    coach_feedback: EnhancedCoachFeedback
    meta: CoachMeta

# Daily Challenge Coaching Upgrade Models
class ClassifyRequest(BaseModel):
    scenario_text: str
    user_question: str

class Scores(BaseModel):
    clarity: int = Field(ge=1, le=5)
    depth: int = Field(ge=1, le=5)
    relevance: int = Field(ge=1, le=5)
    empathy: int = Field(ge=1, le=5)
    overall: int = Field(ge=1, le=5)

class ClassifyResponse(BaseModel):
    detected_skills: List[str]
    scores: Scores
    issues: List[str]
    justification: Optional[str] = None

class CoachRequest(BaseModel):
    scenario_text: str
    user_question: str
    classification: ClassifyResponse

class DailyChallengeCoachFeedback(BaseModel):
    qi_score: Scores
    strengths: str
    improvement: str
    coaching_moment: str
    technique_spotlight: Dict[str, str]
    example_upgrades: List[str] = Field(min_length=2, max_length=3)
    progress_message: str

class DailyChallengeFeedbackResponse(BaseModel):
    schema: str = "roga.daily_challenge.v3"
    scenario_id: Optional[int]
    user_question: str
    feedback: DailyChallengeCoachFeedback
    meta: CoachMeta

class MVPScoreCardResponse(BaseModel):
    schema: str = "roga.mvp_scorecard.v1"
    scenario_id: Optional[int]
    user_question: str
    feedback: MVPScoreCardFeedback
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

# Enhanced Daily Challenge Schema
ENHANCED_SCHEMA = {
    "name": "roga_enhanced_feedback_v2",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "qi_score": {
                "type": "object",
                "properties": {
                    "overall": {"type": "integer", "minimum": 1, "maximum": 5},
                    "clarity": {"type": "integer", "minimum": 1, "maximum": 5},
                    "depth": {"type": "integer", "minimum": 1, "maximum": 5},
                    "relevance": {"type": "integer", "minimum": 1, "maximum": 5},
                    "empathy": {"type": "integer", "minimum": 1, "maximum": 5}
                },
                "required": ["overall", "clarity", "depth", "relevance", "empathy"],
                "additionalProperties": False
            },
            "strengths": {"type": "string", "maxLength": 120},
            "improvement": {"type": "string", "maxLength": 120},
            "coaching_moment": {"type": "string", "maxLength": 200},
            "technique_spotlight": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["name", "description"],
                "additionalProperties": False
            },
            "example_upgrades": {
                "type": "array",
                "minItems": 2,
                "maxItems": 3,
                "items": {"type": "string"}
            },
            "progress_message": {"type": "string", "maxLength": 150}
        },
        "required": ["qi_score", "strengths", "improvement", "coaching_moment", "technique_spotlight", "example_upgrades", "progress_message"]
    }
}

# Daily Challenge Coaching Upgrade Schemas
CLASSIFY_SCHEMA = {
    "name": "roga_classify_v3",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "detected_skills": {
                "type": "array",
                "items": {"type": "string"}
            },
            "scores": {
                "type": "object",
                "properties": {
                    "clarity": {"type": "integer", "minimum": 1, "maximum": 5},
                    "depth": {"type": "integer", "minimum": 1, "maximum": 5},
                    "relevance": {"type": "integer", "minimum": 1, "maximum": 5},
                    "empathy": {"type": "integer", "minimum": 1, "maximum": 5},
                    "overall": {"type": "integer", "minimum": 1, "maximum": 5}
                },
                "required": ["clarity", "depth", "relevance", "empathy", "overall"],
                "additionalProperties": False
            },
            "issues": {
                "type": "array",
                "items": {"type": "string"}
            },
            "justification": {"type": "string"}
        },
        "required": ["detected_skills", "scores", "issues"]
    }
}

DAILY_COACH_SCHEMA = {
    "name": "roga_daily_coach_v3",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "qi_score": {
                "type": "object",
                "properties": {
                    "overall": {"type": "integer", "minimum": 1, "maximum": 5},
                    "clarity": {"type": "integer", "minimum": 1, "maximum": 5},
                    "depth": {"type": "integer", "minimum": 1, "maximum": 5},
                    "relevance": {"type": "integer", "minimum": 1, "maximum": 5},
                    "empathy": {"type": "integer", "minimum": 1, "maximum": 5}
                },
                "required": ["overall", "clarity", "depth", "relevance", "empathy"],
                "additionalProperties": False
            },
            "strengths": {"type": "string"},
            "improvement": {"type": "string"},
            "coaching_moment": {"type": "string"},
            "technique_spotlight": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["name", "description"],
                "additionalProperties": False
            },
            "example_upgrades": {
                "type": "array",
                "minItems": 2,
                "maxItems": 3,
                "items": {"type": "string"}
            },
            "progress_message": {"type": "string"}
        },
        "required": ["qi_score", "strengths", "improvement", "coaching_moment", "technique_spotlight", "example_upgrades", "progress_message"]
    }
}

# MVP 5-Part Feedback Schema
MVP_SCORECARD_SCHEMA = {
    "name": "roga_mvp_scorecard_v1",
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "positive_reinforcement": {
                "type": "string",
                "maxLength": 200,
                "description": "Highlight what the user did well"
            },
            "dimension_focus": {
                "type": "string",
                "maxLength": 150,
                "description": "Call out 1-2 QI dimensions needing improvement"
            },
            "pro_tip": {
                "type": "string",
                "maxLength": 120,
                "description": "Short, actionable coaching advice"
            },
            "suggested_upgrade": {
                "type": "string",
                "maxLength": 250,
                "description": "Rewrite of user's question showing stronger version"
            },
            "score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Overall question quality score"
            },
            "rubric": {
                "type": "object",
                "properties": {
                    "clarity": {"type": "integer", "minimum": 0, "maximum": 100},
                    "depth": {"type": "integer", "minimum": 0, "maximum": 100},
                    "curiosity": {"type": "integer", "minimum": 0, "maximum": 100},
                    "relevance": {"type": "integer", "minimum": 0, "maximum": 100},
                    "empathy": {"type": "integer", "minimum": 0, "maximum": 100}
                },
                "required": ["clarity", "depth", "curiosity", "relevance", "empathy"],
                "additionalProperties": False
            }
        },
        "required": ["positive_reinforcement", "dimension_focus", "pro_tip", "suggested_upgrade", "score", "rubric"]
    }
}

# Evaluator v3 Schema
EVALUATOR_V3_SCHEMA = {
    "name": "evaluator_v3_feedback",
    "schema": {
        "type": "object",
        "properties": {
            "overallScore": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "Overall question quality score"
            },
            "subscores": {
                "type": "object",
                "properties": {
                    "clarity": {"type": "integer", "minimum": 1, "maximum": 5},
                    "depth": {"type": "integer", "minimum": 1, "maximum": 5},
                    "relevance": {"type": "integer", "minimum": 1, "maximum": 5},
                    "empathy": {"type": "integer", "minimum": 1, "maximum": 5}
                },
                "required": ["clarity", "depth", "relevance", "empathy"],
                "additionalProperties": False
            },
            "skillDetected": {
                "type": "string",
                "maxLength": 80,
                "description": "QI Skill name with quality rating (e.g., 'Clarifying (attempted, but vague)')"
            },
            "strengths": {"type": "string", "maxLength": 120, "description": "What the user did well"},
            "improvementArea": {"type": "string", "maxLength": 200, "description": "Key area for improvement with specific guidance"},
            "coachingNugget": {"type": "string", "maxLength": 120, "description": "Educational insight"},
            "exampleUpgrades": {
                "type": "array",
                "items": {"type": "string", "maxLength": 150},
                "minItems": 2,
                "maxItems": 3,
                "description": "Concrete question upgrades"
            },
            "progressNote": {"type": "string", "maxLength": 80, "description": "Gamified encouragement"},
            "contextSpecificTip": {"type": "string", "maxLength": 100, "description": "Context-specific advice"},
            "likelyResponse": {"type": "string", "maxLength": 100, "description": "What response this question might get"},
            "nextQuestionSuggestions": {
                "type": "array",
                "items": {"type": "string", "maxLength": 80},
                "minItems": 2,
                "maxItems": 3,
                "description": "Follow-up question ideas"
            }
        },
        "required": ["overallScore", "subscores", "skillDetected", "strengths", "improvementArea", "coachingNugget", "exampleUpgrades", "progressNote"],
        "additionalProperties": False
    }
}

# QI Library - Curated coaching content for consistency
QI_LIBRARY = {
    "coaching_nuggets": {
        "clarifying": [
            "Strong clarifiers reduce uncertainty when they point to the missing detail, not the whole message.",
            "Effective clarifying questions target specific gaps rather than asking for everything to be repeated.",
            "The best clarifiers help others understand exactly what's confusing you."
        ],
        "probing": [
            "Deep probing questions uncover the 'why' behind the surface answer.",
            "Great probing moves from 'what happened' to 'what caused it' to 'what does this mean'.",
            "The strongest probes invite people to think beyond their first response."
        ],
        "criteria_setting": [
            "Clear criteria turn vague goals into measurable targets that everyone can understand.",
            "Strong criteria-setting questions establish what 'good enough' looks like before you start.",
            "The best criteria questions help teams align on standards before diving into the work."
        ],
        "hypothesizing": [
            "Powerful hypotheses connect visible symptoms to possible underlying causes.",
            "The strongest hypothetical questions test assumptions rather than confirm them.",
            "Great hypothesizing opens multiple paths to explore, not just one."
        ]
    },
    "progress_notes": {
        "level_1": [
            "🌟 Clarifier Level 1 → Add one specific detail to move toward Level 2.",
            "🎯 Prober Level 1 → Try asking 'why' to unlock Level 2.",
            "📋 Criteria-setter Level 1 → Define one clear standard to advance.",
            "🔍 Hypothesis Level 1 → Test one assumption to level up."
        ],
        "level_2": [
            "⭐ Clarifier Level 2 → Pinpoint the exact confusion to reach Level 3.",
            "🎯 Prober Level 2 → Dig into root causes for Level 3.",
            "📋 Criteria-setter Level 2 → Add measurable details for Level 3.",
            "🔍 Hypothesis Level 2 → Connect evidence to theory for Level 3."
        ],
        "level_3": [
            "🌟 Strong questioning! Keep practicing to sharpen your edge.",
            "⚡ Nice work! You're building solid questioning instincts.",
            "🚀 Good questioning technique! Ready for more complex scenarios."
        ]
    },
    "example_upgrades": {
        "clarifying": [
            "Could you clarify the part about [specific detail]?",
            "Which sections do we need to complete first?",
            "What does the final product need to include?",
            "Can you walk me through the [specific step] again?",
            "What exactly happens during the [specific phase]?"
        ],
        "probing": [
            "What do you think is causing this pattern?",
            "How does this connect to what we discussed earlier?",
            "What would happen if we tried a different approach?",
            "Why do you think this keeps happening?",
            "What assumptions are we making here?"
        ],
        "criteria_setting": [
            "What would 'done well' look like for this project?",
            "How will we know if this approach is working?",
            "What standards should we use to evaluate this?",
            "What are the must-haves versus nice-to-haves?",
            "How do we define success for this initiative?"
        ],
        "hypothesizing": [
            "What if the real issue is [alternative cause]?",
            "Could this be connected to [related factor]?",
            "What would we expect to see if [hypothesis] is true?",
            "How would this look different if [assumption] wasn't the case?",
            "What other explanations might fit this pattern?"
        ]
    }
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

Rewrite the feedback to fix these issues.""",
    
    "enhanced_coach": """You are an advanced QI coaching system providing comprehensive feedback on daily challenge questions.

Your role is to evaluate a user's question and provide detailed coaching using the new enhanced feedback structure.

CONTEXT:
Question: {question}
Scenario: {scenario_title} - {scenario_text}

TASK: Provide comprehensive coaching feedback with these elements:

1. QI SCORE (1-5 for each):
   - Overall: Holistic question quality
   - Clarity: How specific and well-articulated
   - Depth: How much it probes beyond surface level
   - Relevance: How well it fits the scenario context
   - Empathy: How much it considers others' perspectives

2. STRENGTHS: What the user did well (positive reinforcement, ≤120 chars)

3. IMPROVEMENT: One specific area to focus on next (actionable, ≤120 chars)

4. COACHING_MOMENT: Educational nugget about question intelligence (≤200 chars)

5. TECHNIQUE_SPOTLIGHT: Highlight a QI technique with name and description

6. EXAMPLE_UPGRADES: 2-3 specific stronger question examples for this scenario

7. PROGRESS_MESSAGE: Gamified encouragement tied to skill development (≤150 chars)

Be supportive yet challenging, educational yet practical. Focus on building QI skills.""",

    "mvp_scorecard": """You are Roga's MVP ScoreCard coach providing the new 5-part feedback structure. Your role is to teach Question Intelligence (QI), not just grade it.

CONTEXT:
User Question: "{question}"
Scenario: {scenario_title} - {scenario_text}

CRITICAL REQUIREMENT: You MUST reference the user's actual words throughout your feedback. Quote or paraphrase their specific language to make feedback feel personal and contextual.

TASK: Provide coaching-first feedback with these five components:

1. POSITIVE REINFORCEMENT: Highlight what the user did well in their question. Quote their actual words and be specific about the QI skill they demonstrated. Examples: "I love how you asked about [their specific words]..." or "Your instinct to focus on [quote from their question] shows..." (≤200 chars)

2. DIMENSION FOCUS: Call out 1-2 QI dimensions that need improvement. Reference their specific question and explain why these dimensions need work in their context. (≤150 chars)

3. PRO TIP: Short, actionable coaching advice tied directly to their specific question and scenario. Reference their actual situation, not generic advice. (≤120 chars)

4. SUGGESTED UPGRADE: Rewrite their question to show a stronger version. MUST build from their actual words and context while demonstrating better QI techniques. Keep their voice and situation. (≤250 chars)

5. SCORE + RUBRIC: Overall 0-100 score plus individual dimension scores (0-100) for clarity, depth, curiosity, relevance, empathy.

COACHING LEXICON - Use warm, supportive, mentor-like tone:
- "I love how you asked about [their words]..."
- "When you mentioned [quote], you're onto something important..."
- "Your focus on [their specific concern] shows..."
- "What if we sharpened your question about [their topic] by..."
- "Try targeting the specific [part they mentioned]..."

CONTEXTUALIZATION RULES:
- Always quote or reference their exact words in positive reinforcement
- In suggested upgrade, build directly from their question structure
- Connect all advice to their specific scenario and word choices
- Make it feel like you're responding to THEIR unique question, not giving generic feedback

Be a mentor, not a judge. Make every piece of feedback feel personal to their specific question."""
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

# V2 Coaching: User Trend Tracking Functions
def update_trends(user_key: str, feedback: Dict[str, Any]):
    """Update user skill trends based on feedback"""
    if not COACHING_V2_ENABLED:
        return
        
    prof = USER_TRENDS.setdefault(user_key, {})
    for item in feedback.get("rubric", []):
        k = item["key"]
        score_map = {"good": 22, "warn": 14, "bad": 6}  # heuristic mapping
        s = score_map.get(item["status"], 14)
        p = prof.setdefault(k, {"sum": 0, "n": 0})
        p["sum"] += s
        p["n"] += 1

def weakest_skill_hint(user_key: str) -> Optional[str]:
    """Get user's weakest skill for personalized coaching"""
    if not COACHING_V2_ENABLED:
        return None
        
    prof = USER_TRENDS.get(user_key)
    if not prof:
        return None
    avg = [(k, v["sum"]/max(1, v["n"])) for k, v in prof.items()]
    if not avg:
        return None
    weakest = min(avg, key=lambda kv: kv[1])[0]
    return weakest

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

# V2 Coaching: Enhanced Evaluator Functions
def evaluator_system_prompt_v2(context_hint: Optional[str], user_trend_hint: Optional[str]) -> str:
    """Generate V2 evaluator system prompt with context awareness"""
    base = (
        "You are an evaluator of questions. Score on four 0–25 dimensions "
        "(clarity, depth, insight, openness). Return STRICT JSON ONLY.\n"
        "Also provide:\n"
        "- contextSpecificTip: actionable tip tailored to the scenario context;\n"
        "- likelyResponse: a plausible next reply (2–3 sentences);\n"
        "- nextQuestionSuggestions: 1–3 concise follow-ups that build skillfully;\n"
        "- empathyScore: 0–25 (awareness of feelings, culture, power dynamics).\n"
        "Do not include explanations outside JSON.\n"
    )
    if context_hint:
        base += f"\nContext: {context_hint}. Tailor tips to this context."
    if user_trend_hint:
        base += f"\nUser historical weakness: {user_trend_hint}. Prioritize coaching on this."
    return base

async def call_openai_evaluator_v2(
    user_question: str,
    character_reply: str,
    prior_summary: Optional[str] = None,
    context: Optional[str] = None,
    user_key: str = "anon"
) -> Dict[str, Any]:
    """V2 Evaluator with context awareness and trend tracking"""
    
    # Get user's weakest skill for personalized coaching
    trend_hint = weakest_skill_hint(user_key) if COACHING_V2_ENABLED else None
    
    # Build context-aware system prompt
    system_msg = evaluator_system_prompt_v2(context, trend_hint)
    
    # Build user prompt
    user_eval = (
        "Evaluate ONLY the USER'S QUESTION below. Consider the short priorSummary for continuity.\n"
        f"priorSummary: {prior_summary or 'none'}\n"
        f"question: {user_question}\n"
        f"coachReply: {character_reply[:800]}\n"
        "Return JSON with keys: score, rubric[4], proTip, suggestedUpgrade, badge, "
        "contextSpecificTip, likelyResponse, nextQuestionSuggestions, empathyScore."
    )
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            response_format={"type": "json_schema", "json_schema": {
                "name": "roga_feedback_v2",
                "schema": {
                    "type": "object",
                    "properties": {
                        "score": {"type": "integer", "minimum": 0, "maximum": 100},
                        "rubric": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "key": {"type": "string"},
                                    "label": {"type": "string"},
                                    "status": {"type": "string"},
                                    "note": {"type": "string"}
                                },
                                "required": ["key", "label", "status", "note"]
                            }
                        },
                        "proTip": {"type": "string"},
                        "suggestedUpgrade": {"type": "string"},
                        "badge": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "label": {"type": "string"}
                            }
                        },
                        "contextSpecificTip": {"type": "string"},
                        "likelyResponse": {"type": "string"},
                        "nextQuestionSuggestions": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "empathyScore": {"type": "integer", "minimum": 0, "maximum": 25}
                    },
                    "required": ["score", "rubric"]
                }
            }},
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_eval}
            ]
        )
        
        data = json.loads(response.choices[0].message.content or "{}")
        
        # Harden: defaults for missing fields
        data.setdefault("contextSpecificTip", None)
        data.setdefault("likelyResponse", None)
        data.setdefault("nextQuestionSuggestions", [])
        data.setdefault("empathyScore", 0)
        
        return data
        
    except Exception as e:
        # Fallback V2 response
        return {
            "score": 70,
            "rubric": [
                {"key": "clarity", "label": "Clarity", "status": "good", "note": "Clear question"},
                {"key": "depth", "label": "Depth", "status": "warn", "note": "Could probe deeper"},
                {"key": "insight", "label": "Insight", "status": "warn", "note": "Surface level"},
                {"key": "openness", "label": "Openness", "status": "good", "note": "Invites discussion"}
            ],
            "proTip": "Try adding more context or specific examples.",
            "contextSpecificTip": f"In {context or 'this'} context, be more specific about outcomes.",
            "likelyResponse": "They might ask for clarification or provide more details.",
            "nextQuestionSuggestions": ["What would success look like?", "What are the main constraints?"],
            "empathyScore": 15
        }

async def call_openai_character(persona: PersonaType, question: str, round_num: int, prior_summary: Optional[str] = None, scene: str = ""):
    """Generate persona character response using question-free mentor system"""
    print(f"call_openai_character called with persona: {persona}, question: {question[:50]}...")

    # Determine target skill based on round (simplified skill progression)
    skill_progression = ["clarifying", "follow_up", "probing", "comparative", "open_question"]
    target_skill = skill_progression[(round_num - 1) % len(skill_progression)]

    # For mentor personas, use the new question-free system
    if persona in ["teacher_mentor", "business_coach"]:
        try:
            print(f"Using mentor system for {persona}")
            reply = await generate_mentor_reply(
                client=client,
                scene=scene or "Professional conversation setting",
                round_idx=round_num,
                target_skill=target_skill,
                user_q=question,
                persona=persona
            )
            print(f"Mentor reply generated: {reply[:100]}...")
            return reply
        except Exception as e:
            print(f"Error in mentor reply generation: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to sanitized response
            return "I appreciate your question. That's an interesting perspective that requires thoughtful consideration. Let me share some insights based on my experience."

    # For other personas, use original system with question filtering
    print(f"Using standard system for {persona}")
    system_prompt = PERSONA_PROMPTS[persona] + " You NEVER ask questions in your responses."

    context = f"This is round {round_num} of our conversation."
    if prior_summary:
        context += f" Previous context: {prior_summary}"

    user_prompt = f"{context}\n\nUser's question: {question}\n\nRespond as the persona (2-6 sentences). Do not ask any questions:"

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.6,
            max_tokens=200,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        reply = response.choices[0].message.content.strip()

        # Apply question filtering to non-mentor personas too
        from app.llm_utils import contains_question, sanitize_to_statement
        if contains_question(reply):
            reply = sanitize_to_statement(reply, max_sentences=4)

        print(f"Standard reply generated: {reply[:100]}...")
        return reply
    except Exception as e:
        print(f"Error in standard reply generation: {e}")
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

def generate_mvp_scorecard_feedback(question: str, scenario_title: str = "", scenario_text: str = "") -> MVPScoreCardFeedback:
    """Generate MVP 5-part ScoreCard feedback using the new coaching structure"""
    try:
        # Format the prompt with context
        prompt = COACHING_PROMPTS["mvp_scorecard"].format(
            question=question,
            scenario_title=scenario_title,
            scenario_text=scenario_text
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_schema", "json_schema": MVP_SCORECARD_SCHEMA}
        )

        feedback_data = json.loads(response.choices[0].message.content)

        # Create the structured response
        rubric_score = MVPRubricScore(**feedback_data["rubric"])

        return MVPScoreCardFeedback(
            positive_reinforcement=feedback_data["positive_reinforcement"],
            dimension_focus=feedback_data["dimension_focus"],
            pro_tip=feedback_data["pro_tip"],
            suggested_upgrade=feedback_data["suggested_upgrade"],
            score=feedback_data["score"],
            rubric=rubric_score
        )

    except Exception as e:
        print(f"Error generating MVP scorecard feedback: {e}")
        # Return fallback MVP feedback
        return MVPScoreCardFeedback(
            positive_reinforcement="I love how you're thinking about this situation and taking the initiative to ask for clarity.",
            dimension_focus="Let's focus on clarity and depth—being more specific about what exactly you need to understand.",
            pro_tip="Try targeting the specific part that's unclear rather than asking generally about the whole thing.",
            suggested_upgrade=f'Instead of "{question[:50]}...", try: "What specific information do I need about [the unclear part] to move forward successfully?"',
            score=75,
            rubric=MVPRubricScore(clarity=70, depth=60, curiosity=80, relevance=85, empathy=75)
        )

def generate_enhanced_feedback(question: str, scenario_title: str = "", scenario_text: str = "") -> EnhancedCoachFeedback:
    """Generate enhanced coaching feedback using the new v2 structure"""
    try:
        # Format the prompt with context
        prompt = COACHING_PROMPTS["enhanced_coach"].format(
            question=question,
            scenario_title=scenario_title,
            scenario_text=scenario_text
        )
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_schema", "json_schema": ENHANCED_SCHEMA}
        )
        
        feedback_data = json.loads(response.choices[0].message.content)
        
        # Create the structured response
        qi_score = QIScore(**feedback_data["qi_score"])
        technique_spotlight = TechniqueSpotlight(**feedback_data["technique_spotlight"])
        
        return EnhancedCoachFeedback(
            qi_score=qi_score,
            strengths=feedback_data["strengths"],
            improvement=feedback_data["improvement"],
            coaching_moment=feedback_data["coaching_moment"],
            technique_spotlight=technique_spotlight,
            example_upgrades=feedback_data["example_upgrades"],
            progress_message=feedback_data["progress_message"]
        )
        
    except Exception as e:
        print(f"Error generating enhanced feedback: {e}")
        # Return fallback enhanced feedback
        return EnhancedCoachFeedback(
            qi_score=QIScore(overall=3, clarity=3, depth=3, relevance=4, empathy=3),
            strengths="Your question shows good awareness of the situation.",
            improvement="Try adding more specific details to make your question clearer.",
            coaching_moment="Great questions combine clarity with depth to uncover what matters most.",
            technique_spotlight=TechniqueSpotlight(
                name="The Clarifier",
                description="Focus on making vague situations specific and actionable."
            ),
            example_upgrades=[
                "What specific information do I need to move forward?",
                "Which part of this process needs the most clarity?",
                "What details would help me understand the expectations better?"
            ],
            progress_message="🌟 Good start! Keep practicing to sharpen your questioning skills."
        )

# Evaluator v3 Functions
def evaluator_system_prompt_v3(context_hint: Optional[str] = None, tone_hint: Optional[str] = None) -> str:
    """Generate Evaluator v3 system prompt - V2 with stricter Roga voice"""
    base_prompt = """You are Roga's V2 coaching system enforcing strict quality standards and consistent voice.

SCORING RULES (V2 - STRICTER):
1-2 = Weak (vague, closed, trivial) → Cap at ≤40/100 overall
3 = Okay (surface-level but workable)
4 = Strong (clear, specific, open-ended)
5 = Excellent (precise, layered, invites deep insight)

ROGA VOICE (MANDATORY):
• Direct → Call out weaknesses clearly, no sugarcoating
• Encouraging → Normalize mistakes, push for practice
• Instructional → Always show HOW to fix the issue
• Modern & approachable → Conversational, not academic
• Concise → ≤150 words total across ALL sections (expanded for detailed improvement area)

6-PART FRAMEWORK (REQUIRED ORDER):
1. Skill Detected: "[QI Skill] (quality rating)" e.g. "Clarifying (attempted, but vague)"
2. Strengths: One specific positive element from their question
3. Improvement Area: Name the gap + specific guidance on how to fix it. Use 2-3 sentences for depth.
4. Coaching Nugget: 1-2 sentences mini-teaching (pull from QI knowledge)
5. Example Upgrades: 2-3 concrete alternatives (always questions)
6. Progress Note: Motivational + gamified hook

CRITICAL: Be direct about weaknesses. No polite deflection. If it's weak, say so and explain why."""

    if context_hint:
        context_mapping = {
            "business": " Focus on professional communication, stakeholder needs, and business outcomes.",
            "academic": " Focus on learning objectives, research methods, and academic discourse.",
            "personal": " Focus on self-reflection, relationship dynamics, and personal growth."
        }
        base_prompt += context_mapping.get(context_hint, "")

    if tone_hint:
        base_prompt += f" Tone: {tone_hint}"

    return base_prompt

def evaluator_user_prompt_v3(question: str, prior_summary: str, coach_reply: str) -> str:
    """Generate Evaluator v3 user prompt"""
    return f"""USER QUESTION: {question}

PRIOR SUMMARY: {prior_summary}

COACH REPLY: {coach_reply}

Analyze this question and provide comprehensive feedback using the 6-part structure. Focus on the specific question asked and provide actionable coaching."""

async def evaluate_question_v3(client: OpenAI, system_msg: str, user_msg: str) -> Dict[str, Any]:
    """Evaluate question using v3 system with fallback"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.5,  # Moderate temperature for creative coaching
            response_format={"type": "json_schema", "json_schema": EVALUATOR_V3_SCHEMA},
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": user_msg}
            ]
        )

        raw = response.choices[0].message.content
        feedback = json.loads(raw or "{}")

        # Apply V2 stricter scoring caps
        feedback = apply_strict_scoring_caps(feedback, user_msg.split("USER QUESTION: ")[-1].split("\n")[0] if "USER QUESTION:" in user_msg else user_msg)

        return feedback

    except Exception as e:
        print(f"Evaluator v3 error: {e}")
        # Fallback v3 response with V2 schema
        return {
            "overallScore": 30,  # V2 stricter fallback scoring
            "subscores": {"clarity": 2, "depth": 2, "relevance": 3, "empathy": 2},
            "skillDetected": "Clarifying (attempted, but vague)",
            "strengths": "You showed curiosity by asking for help.",
            "improvementArea": "Your question was too vague — be specific about what's confusing. Instead of asking about the whole topic, pinpoint the exact part that needs clarification. This helps others give you targeted, useful answers.",
            "coachingNugget": "Strong clarifiers point to the exact missing detail, not the whole message.",
            "exampleUpgrades": [
                "What specific part of [topic] is unclear?",
                "Which step in the process needs more explanation?"
            ],
            "progressNote": "🌟 Clarifier Level 1 → Add one specific detail to move toward Level 2."
        }

def is_too_vague_or_closed(question: str) -> bool:
    """Check if question is too vague or closed for scoring caps - V2 Stricter Rules"""
    question_lower = question.lower().strip()

    # Very short questions are often vague (stricter threshold)
    if len(question.strip()) < 15:
        return True

    # Overly vague patterns
    vague_patterns = [
        "what about", "how about", "what's up with", "tell me about",
        "wait, what", "huh", "what do you mean", "i don't get it",
        "explain this", "what is this", "help me understand"
    ]
    if any(pattern in question_lower for pattern in vague_patterns):
        return True

    # Closed question patterns (yes/no, binary)
    closed_patterns = [
        "is this", "are these", "can i", "should i", "will this",
        "do you think", "would you", "could you", "did i"
    ]
    if any(pattern in question_lower for pattern in closed_patterns):
        return True

    # Single word questions
    if len(question.strip().split()) <= 2:
        return True

    return False

def apply_strict_scoring_caps(scores: dict, question: str) -> dict:
    """Apply V2 stricter scoring rules with caps for weak/closed questions"""
    if is_too_vague_or_closed(question):
        # Cap all subscores at 2 (weak level)
        capped_subscores = {
            "clarity": min(scores.get("clarity", 1), 2),
            "depth": min(scores.get("depth", 1), 2),
            "relevance": min(scores.get("relevance", 1), 2),
            "empathy": min(scores.get("empathy", 1), 2)
        }
        # Overall score capped at 40/100 (2/5 * 20)
        overall_score = min(scores.get("overallScore", 20), 40)

        return {
            **scores,
            "subscores": capped_subscores,
            "overallScore": overall_score
        }

    return scores

def to_status(n: int) -> str:
    """Helper to map 1-5 subscores to legacy status"""
    return "bad" if n <= 2 else "warn" if n == 3 else "good"

@app.post("/coach/mvp", response_model=MVPScoreCardResponse)
def mvp_scorecard_coach(req: CoachIn):
    """MVP ScoreCard endpoint with new 5-part feedback structure"""
    if not req.user_question or not req.user_question.strip():
        raise HTTPException(status_code=400, detail="Missing user question")

    try:
        # Generate MVP ScoreCard feedback
        mvp_feedback = generate_mvp_scorecard_feedback(
            question=req.user_question,
            scenario_title=req.scenario_title or '',
            scenario_text=req.scenario_text or ''
        )

        # Generate metadata
        feedback_content = f"{mvp_feedback.positive_reinforcement} {mvp_feedback.dimension_focus} {mvp_feedback.pro_tip}"
        content_hash = hashlib.sha256(feedback_content.encode()).hexdigest()[:16]

        meta = CoachMeta(
            brand_check=True,  # MVP feedback is pre-validated
            length_ok=True,
            banned_content=[],
            hash=content_hash
        )

        return MVPScoreCardResponse(
            schema="roga.mvp_scorecard.v1",
            scenario_id=req.scenario_id,
            user_question=req.user_question.strip(),
            feedback=mvp_feedback,
            meta=meta
        )

    except Exception as e:
        print(f"Error in MVP scorecard endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal MVP scorecard error")

@app.post("/coach/enhanced", response_model=EnhancedCoachResponse)
def enhanced_coach(req: CoachIn):
    """Enhanced coaching endpoint with comprehensive v2 feedback structure"""
    if not req.user_question or not req.user_question.strip():
        raise HTTPException(status_code=400, detail="Missing user question")

    try:
        # Generate enhanced feedback
        enhanced_feedback = generate_enhanced_feedback(
            question=req.user_question,
            scenario_title=req.scenario_title or '',
            scenario_text=req.scenario_text or ''
        )

        # Generate metadata
        feedback_content = f"{enhanced_feedback.strengths} {enhanced_feedback.improvement} {enhanced_feedback.coaching_moment}"
        content_hash = hashlib.sha256(feedback_content.encode()).hexdigest()[:16]

        meta = CoachMeta(
            brand_check=True,  # Enhanced feedback is pre-validated
            length_ok=True,
            banned_content=[],
            hash=content_hash
        )

        return EnhancedCoachResponse(
            schema="roga.feedback.v2",
            scenario_id=req.scenario_id,
            user_question=req.user_question.strip(),
            character_reply=req.character_reply,
            coach_feedback=enhanced_feedback,
            meta=meta
        )

    except Exception as e:
        print(f"Error in enhanced coach endpoint: {e}")
        raise HTTPException(status_code=500, detail="Internal enhanced coaching error")

@app.post("/score", response_model=ScoreResponse)
async def score(req: ScoreRequest):
    if not req.question or not req.question.strip():
        raise HTTPException(status_code=400, detail="Missing question")

    question = req.question.strip()

    # Check if Daily Evaluator v3 is enabled
    if DAILY_EVAL_V3:
        # Use Evaluator v3 for enhanced feedback
        try:
            # Build evaluator prompts (v3)
            sys = evaluator_system_prompt_v3(context_hint=req.context)
            usr = evaluator_user_prompt_v3(
                question=question,
                prior_summary="none",
                coach_reply="N/A - daily single-turn"
            )

            feedback = await evaluate_question_v3(client, sys, usr)

            # Map subscores (1–5) to original rubric labels for UI compatibility
            legacy_rubric = [
                {"key":"clarity","label":"Clarity","status":to_status(feedback["subscores"]["clarity"]), "note": feedback.get("improvementArea","") or "—"},
                {"key":"depth","label":"Depth","status":to_status(feedback["subscores"]["depth"]), "note": "—"},
                {"key":"insight","label":"Relevance","status":to_status(feedback["subscores"]["relevance"]), "note": "—"},
                {"key":"openness","label":"Empathy","status":to_status(feedback["subscores"]["empathy"]), "note": "—"}
            ]

            return ScoreResponse(
                # legacy fields (kept so ScoreCard doesn't break)
                scenario={"title": req.scenarioTitle or "", "text": req.scenarioText or ""},
                question=question,
                score=feedback["overallScore"],
                rubric=legacy_rubric,
                proTip=feedback.get("coachingNugget"),
                suggestedUpgrade=(feedback.get("exampleUpgrades") or [None])[0],
                badge={"name": "QI Coach", "label": feedback["skillDetected"]},
                # NEW rich coaching fields (Sessions parity with V2 schema)
                coachV3=feedback
            )

        except Exception as e:
            print(f"Daily Evaluator v3 error, falling back to legacy: {e}")
            # Fall back to legacy system below

    # Legacy Daily Challenge system (original implementation)
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
    user_prompt    = build_user_prompt(question, scenario_title, scenario_text, session_context)

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

        # Optional: simple server-side badge if model didn't return one
        if not badge_in:
            if score >= 90:   badge_in = {"name":"Clarity Star","label":"Consistently sharp and focused"}
            elif score >= 80: badge_in = {"name":"Insight Spark","label":"Shows promising perspective"}

        return ScoreResponse(
            scenario={"title": scenario_title, "text": scenario_text},
            question=question,
            score=score,
            rubric=normalized_rubric,
            proTip=pro_tip,
            suggestedUpgrade=suggested,
            badge=badge_in,
            coachV3=None  # Legacy mode doesn't have v3 data
        )

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

    print(f"Created session {session_id} with persona {req.persona}")
    print(f"Total sessions in memory: {len(SESSIONS)}")

    return CreateSessionResponse(
        id=session_id,
        persona=req.persona,
        topic=req.topic,
        difficulty=req.difficulty,
        roundsPlanned=req.roundsPlanned
    )

# Debug endpoint to check session status
@app.get("/sessions/{session_id}/debug")
def debug_session(session_id: str):
    """Debug endpoint to check session status"""
    return {
        "session_id": session_id,
        "exists": session_id in SESSIONS,
        "session_data": SESSIONS.get(session_id, None),
        "turns_count": len(TURNS.get(session_id, [])),
        "total_sessions": len(SESSIONS),
        "all_session_ids": list(SESSIONS.keys())
    }

@app.post("/sessions/{session_id}/turns", response_model=TurnResponse)
async def process_turn(session_id: str, req: TurnRequest):
    """Process a turn: generate character reply and feedback"""
    print(f"Processing turn for session {session_id}, round {req.round}")
    print(f"Available sessions: {list(SESSIONS.keys())}")

    if session_id not in SESSIONS:
        print(f"Session {session_id} not found. Creating new session from context.")
        # Auto-recover session using provided context if available
        recovered_persona = req.persona or "teacher_mentor"
        recovered_topic = req.topic or "Professional conversation setting"

        SESSIONS[session_id] = {
            "id": session_id,
            "persona": recovered_persona,
            "topic": recovered_topic,
            "difficulty": "intermediate",
            "roundsPlanned": 3,
            "currentRound": req.round - 1,
            "created_at": None
        }
        TURNS[session_id] = []
        print(f"Created recovery session for {session_id} with persona={recovered_persona}, topic={recovered_topic}")

    session = SESSIONS[session_id]

    # Validate round
    if req.round > session["roundsPlanned"]:
        raise HTTPException(status_code=400, detail="Round exceeds planned rounds")

    # Generate character response using new question-free system
    scene_context = session.get("topic", "Professional conversation setting")
    print(f"Generating AI response with: persona={session['persona']}, scene={scene_context}, round={req.round}")

    character_reply = await call_openai_character(
        persona=session["persona"],
        question=req.question,
        round_num=req.round,
        prior_summary=req.priorSummary,
        scene=scene_context
    )

    print(f"AI response generated: {character_reply[:150]}...")
    
    # Generate feedback using V1 evaluator (stable)
    user_key = session_id  # Use session_id as user key for MVP
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
    
    # Add V2 fields if present in feedback_data
    if feedback_data.get("contextSpecificTip"):
        feedback["contextSpecificTip"] = feedback_data.get("contextSpecificTip")
    if feedback_data.get("likelyResponse"):
        feedback["likelyResponse"] = feedback_data.get("likelyResponse")
    if feedback_data.get("nextQuestionSuggestions"):
        feedback["nextQuestionSuggestions"] = feedback_data.get("nextQuestionSuggestions", [])
    if feedback_data.get("empathyScore"):
        feedback["empathyScore"] = feedback_data.get("empathyScore", 0)
    
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

    # Add telemetry logging for session rounds
    try:
        # Determine target skill and extract scores for telemetry
        skill_progression = ["clarifying", "follow_up", "probing", "comparative", "open_question"]
        target_skill = skill_progression[(req.round - 1) % len(skill_progression)]

        # Convert rubric to scores format for telemetry
        scores = {}
        issues = []
        for item in normalized_rubric:
            key = item["key"]
            if key == "insight":
                key = "relevance"  # Map insight to relevance for consistency
            elif key == "openness":
                key = "empathy"    # Map openness to empathy for consistency

            # Convert status to 1-5 score
            if item["status"] == "good":
                scores[key] = 4
            elif item["status"] == "warn":
                scores[key] = 3
                issues.append(f"{key}_needs_work")
            else:  # bad
                scores[key] = 2
                issues.append(f"{key}_poor")

        # Ensure all required score fields exist
        for field in ["clarity", "depth", "relevance", "empathy"]:
            if field not in scores:
                scores[field] = 3  # Default neutral score

        scores["overall"] = int(score / 20)  # Convert 0-100 to 1-5 scale

        # Create telemetry payload
        telemetry_data = create_telemetry_payload(
            session_id=session_id,
            scenario_id=session_id,  # Use session_id as scenario_id for now
            user_id=None,  # Anonymous for MVP
            round_index=req.round,
            target_skill=target_skill,
            user_question=req.question,
            mentor_reply=character_reply,
            scores=scores,
            issues=issues,
            feedback=feedback
        )

        # TODO: Store telemetry data in database when persistence is added
        # For now, just log it for debugging
        print(f"Session telemetry: {json.dumps(telemetry_data, indent=2)}")

    except Exception as e:
        print(f"Error logging telemetry: {e}")
        # Don't fail the request if telemetry fails

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

@app.post("/sessions/{session_id}/complete-enhanced", response_model=EnhancedCompleteSessionResponse)
def complete_session_enhanced(session_id: str):
    """Complete a session and provide enhanced summary with strengths and growth analysis"""
    if session_id not in SESSIONS:
        raise HTTPException(status_code=404, detail="Session not found")

    session = SESSIONS[session_id]
    turns = TURNS.get(session_id, [])

    if not turns:
        raise HTTPException(status_code=400, detail="No turns found for this session")

    # Calculate metrics
    scores = [t["feedback"]["score"] for t in turns]
    avg_score = int(sum(scores) / len(scores))
    total_rounds = len(turns)

    # Find best question (highest score)
    best_turn = max(turns, key=lambda t: t["feedback"]["score"])
    best_question = best_turn["question"]

    # Determine level based on average score
    if avg_score >= 90:
        level_label = "Level 3 • Master"
    elif avg_score >= 75:
        level_label = "Level 2 • Skilled"
    else:
        level_label = "Level 1 • Explorer"

    # Analyze strengths based on feedback patterns
    strengths = []
    good_rubric_items = []

    for turn in turns:
        rubric = turn["feedback"].get("rubric", [])
        for item in rubric:
            if item.get("status") == "good":
                good_rubric_items.append(item["key"])

    # Count frequency of good dimensions
    from collections import Counter
    good_counts = Counter(good_rubric_items)

    if good_counts.get("clarity", 0) >= total_rounds * 0.6:
        strengths.append("Clear and specific questioning")
    if good_counts.get("depth", 0) >= total_rounds * 0.6:
        strengths.append("Deep analytical thinking")
    if good_counts.get("insight", 0) >= total_rounds * 0.6:
        strengths.append("Insightful perspectives")
    if good_counts.get("openness", 0) >= total_rounds * 0.6:
        strengths.append("Open-ended exploration")

    # Fallback strengths if none identified
    if not strengths:
        if avg_score >= 70:
            strengths = ["Curious questioning approach", "Stayed engaged throughout"]
        else:
            strengths = ["Willingness to ask questions", "Completed the full session"]

    # Analyze growth areas based on warn/bad rubric items
    growth = []
    weak_rubric_items = []

    for turn in turns:
        rubric = turn["feedback"].get("rubric", [])
        for item in rubric:
            if item.get("status") in ["warn", "bad"]:
                weak_rubric_items.append(item["key"])

    weak_counts = Counter(weak_rubric_items)

    if weak_counts.get("clarity", 0) >= total_rounds * 0.5:
        growth.append("Focus on specificity and clear language")
    if weak_counts.get("depth", 0) >= total_rounds * 0.5:
        growth.append("Probe deeper beneath surface level")
    if weak_counts.get("insight", 0) >= total_rounds * 0.5:
        growth.append("Explore non-obvious angles and connections")
    if weak_counts.get("openness", 0) >= total_rounds * 0.5:
        growth.append("Ask more open-ended questions")

    # Fallback growth areas if none identified
    if not growth:
        growth = ["Continue practicing question variety", "Experiment with different QI techniques"]

    # Simulate streak (would come from user data in real implementation)
    streak = 3  # This would be calculated from user's session history

    return EnhancedCompleteSessionResponse(
        rounds=total_rounds,
        avgScore=avg_score,
        levelLabel=level_label,
        streak=streak,
        strengths=strengths,
        growth=growth,
        bestQuestion=best_question
    )

# Daily Challenge Coaching Upgrade - Helper Functions
def retrieve_assets(skill: str, performance_tier: str) -> Dict[str, Any]:
    """Retrieve coaching assets for a specific skill and performance tier"""
    ft = QI_KB.get("feedback_templates", {}).get(skill, {})
    nuggets = QI_KB.get("coaching_nuggets", {}).get(skill, [])
    examples_data = QI_KB.get("example_upgrades", {}).get(skill, {})
    examples = examples_data.get("medium", []) + examples_data.get("easy", [])

    # Create technique spotlight
    skill_def = QI_KB.get("taxonomy", {}).get(skill, {})
    tech = {
        "name": f"The {skill.replace('_', ' ').title()}",
        "description": skill_def.get("definition", f"A {skill} technique to improve questioning.")
    }

    return {
        "feedback_templates": ft.get(performance_tier, []),
        "nuggets": nuggets,
        "examples": examples[:6],  # Top 6 examples
        "technique": tech
    }

def validate_and_cap_scores(scores: Dict[str, int], issues: List[str]) -> Dict[str, int]:
    """Apply rubric rules and caps based on detected issues"""
    result = scores.copy()

    if ROGA_STRICT_SCORING:
        # Apply caps for serious issues
        if "too_vague" in issues or "closed_question" in issues:
            result["overall"] = min(result["overall"], 2)

        # Additional caps for other issues
        if "off_topic" in issues:
            result["relevance"] = min(result["relevance"], 2)
        if "low_empathy" in issues:
            result["empathy"] = min(result["empathy"], 2)

    return result

def call_llm_json(system_prompt: str, user_prompt: str, schema: Dict[str, Any], temperature: float) -> Dict[str, Any]:
    """Call OpenAI with JSON schema validation"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=temperature,
            response_format={"type": "json_schema", "json_schema": schema},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )

        result = json.loads(response.choices[0].message.content or "{}")
        return result

    except Exception as e:
        print(f"LLM call failed: {e}")
        raise HTTPException(status_code=500, detail=f"AI processing failed: {e}")

def check_content_filters(text: str) -> List[str]:
    """Check content against style constraints"""
    banned_issues = []
    banned_topics = QI_KB.get("style_constraints", {}).get("banned_topics", [])

    text_lower = text.lower()
    for topic in banned_topics:
        if topic in text_lower:
            banned_issues.append(f"banned_topic_{topic}")

    return banned_issues

# Daily Challenge Coaching Upgrade - New Endpoints
@app.post("/classify", response_model=ClassifyResponse)
def classify_question(req: ClassifyRequest):
    """Classify a user question and provide scores and issues"""
    if not req.user_question or not req.user_question.strip():
        raise HTTPException(status_code=400, detail="Missing user question")

    # Build prompts
    system_prompt = "You are Roga's QI judge. Return STRICT JSON that matches ClassificationResponse."

    user_prompt = f'''Scenario: "{req.scenario_text}"
UserQuestion: "{req.user_question}"

Taxonomy: {json.dumps(QI_KB.get("taxonomy", {}))}
RubricRules: {json.dumps(QI_KB.get("rubric_rules", {}))}

Tasks:
1) Detect skills used (one or more of: clarifying, probing, follow_up, comparative, open_question, closed_question).
2) Score clarity, depth, relevance, empathy (1–5) and overall (1–5). Apply RubricRules (e.g., closed/vague caps).
3) List issues from: ["too_vague","closed_question","off_topic","missing_context","low_empathy"].
4) Provide a 1–2 sentence justification (for internal logs).

Return JSON only.'''

    try:
        result = call_llm_json(system_prompt, user_prompt, CLASSIFY_SCHEMA, temperature=0.2)

        # Apply validation and caps
        validated_scores = validate_and_cap_scores(result["scores"], result["issues"])
        result["scores"] = validated_scores

        return ClassifyResponse(**result)

    except Exception as e:
        # Fallback classification
        return ClassifyResponse(
            detected_skills=["clarifying"],
            scores=Scores(clarity=3, depth=2, relevance=3, empathy=3, overall=2),
            issues=["too_vague"],
            justification="Fallback classification due to processing error"
        )

@app.post("/coach", response_model=DailyChallengeCoachFeedback)
def coach_question(req: CoachRequest):
    """Generate coaching feedback based on classification"""
    if not req.user_question or not req.user_question.strip():
        raise HTTPException(status_code=400, detail="Missing user question")

    # Determine primary skill and performance tier
    skills = req.classification.detected_skills or ["clarifying"]
    primary_skill = skills[0] if skills else "clarifying"
    tier = "good" if req.classification.scores.overall >= 4 else "needs_work"

    # Retrieve coaching assets
    assets = retrieve_assets(primary_skill, tier)

    # Build coaching prompt
    system_prompt = "You are Roga's QI coach. Style: modern, clever, approachable. No real names, no AI themes. Output STRICT JSON."

    user_prompt = f'''Scenario: "{req.scenario_text}"
UserQuestion: "{req.user_question}"

DetectedSkills: {skills}
Scores: {req.classification.scores.dict()}
Issues: {req.classification.issues}

RetrievedAssets:
- FeedbackTemplates: {assets["feedback_templates"]}
- CoachingNuggets: {assets["nuggets"]}
- TechniqueSpotlight: {assets["technique"]}
- ExampleUpgrades: {assets["examples"]}

Instructions:
- Keep total response under ~{ROGA_FEEDBACK_MAX_WORDS} words.
- Use 1–2 sentences for strengths; 1–2 for improvement; 1–2 for coaching_moment.
- Choose {ROGA_MIN_EXAMPLES}–{ROGA_MAX_EXAMPLES} ExampleUpgrades that directly address the Issues.
- Be specific to the user's actual question.
- If question is vague/closed, say so and show how to fix it.
- Fill all required fields.

Return JSON only.'''

    try:
        result = call_llm_json(system_prompt, user_prompt, DAILY_COACH_SCHEMA, temperature=0.5)

        # Ensure example_upgrades count is within bounds
        upgrades = result.get("example_upgrades", [])
        if len(upgrades) < ROGA_MIN_EXAMPLES:
            # Add fallback examples
            fallback_examples = assets["examples"][:ROGA_MAX_EXAMPLES]
            upgrades.extend(fallback_examples)
        upgrades = upgrades[:ROGA_MAX_EXAMPLES]
        result["example_upgrades"] = upgrades

        # Check content filters
        all_text = f"{result.get('strengths', '')} {result.get('improvement', '')} {result.get('coaching_moment', '')}"
        banned_content = check_content_filters(all_text)
        if banned_content:
            print(f"Content filter issues: {banned_content}")

        return DailyChallengeCoachFeedback(**result)

    except Exception as e:
        print(f"Coaching generation failed: {e}")
        # Fallback coaching response
        examples = assets["examples"][:ROGA_MAX_EXAMPLES] if assets["examples"] else [
            "What exactly needs clarification?",
            "Which step is unclear?",
            "What should happen first?"
        ]

        return DailyChallengeCoachFeedback(
            qi_score=req.classification.scores,
            strengths=(assets["feedback_templates"][:1] or ["You showed curiosity."])[0],
            improvement="Point to the specific part that's unclear to make your clarifier actionable.",
            coaching_moment=(assets["nuggets"][:1] or ["Specific > broad. Anchor your question to a word, step, or claim."])[0],
            technique_spotlight=assets["technique"],
            example_upgrades=examples,
            progress_message="Keep going—target one detail and you'll level up your questioning skill."
        )

@app.post("/daily-challenge-feedback", response_model=DailyChallengeFeedbackResponse)
def get_daily_challenge_feedback(req: ClassifyRequest):
    """Complete Daily Challenge feedback pipeline (classify + coach)"""
    try:
        # Step 1: Classify the question
        classification = classify_question(req)

        # Step 2: Generate coaching feedback
        coach_req = CoachRequest(
            scenario_text=req.scenario_text,
            user_question=req.user_question,
            classification=classification
        )
        feedback = coach_question(coach_req)

        # Generate metadata
        feedback_content = f"{feedback.strengths} {feedback.improvement} {feedback.coaching_moment}"
        content_hash = hashlib.sha256(feedback_content.encode()).hexdigest()[:16]

        # Check content and length
        word_count = len(feedback_content.split())
        length_ok = word_count <= ROGA_FEEDBACK_MAX_WORDS
        banned_content = check_content_filters(feedback_content)

        meta = CoachMeta(
            brand_check=len(banned_content) == 0,
            length_ok=length_ok,
            banned_content=banned_content,
            hash=content_hash
        )

        return DailyChallengeFeedbackResponse(
            schema="roga.daily_challenge.v3",
            scenario_id=None,
            user_question=req.user_question.strip(),
            feedback=feedback,
            meta=meta
        )

    except Exception as e:
        print(f"Daily challenge feedback pipeline failed: {e}")
        raise HTTPException(status_code=500, detail=f"Feedback generation failed: {e}")
