"""
LLM utilities for Roga Sessions - ensures mentor responses are question-free
Based on Roga Sessions Coaching Update 9.15.2025
"""

import re
import hashlib
import json
from typing import Dict, Any, Callable, Awaitable
from openai import OpenAI

# Question detection regex patterns
QUESTION_REGEX = re.compile(
    r"(\?|(?:^|\b)(who|what|when|where|why|how|which|could|would|should|did|do|does|are|is|can)\b.*[.?!]$)",
    re.IGNORECASE | re.MULTILINE
)

SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")

def contains_question(text: str) -> bool:
    """Check if text contains questions using regex patterns"""
    return bool(QUESTION_REGEX.search(text))

def sanitize_to_statement(text: str, max_sentences: int = 4) -> str:
    """
    Remove questions from text and limit to max sentences
    1) Remove content from first question mark onwards
    2) Remove interrogative lead-ins
    3) Limit to max_sentences and ensure proper ending
    """
    # 1) Remove any content from the first question mark onwards
    if "?" in text:
        text = text.split("?")[0].strip()

    # 2) Remove trailing interrogative lead-ins (e.g., "Why ..." without '?')
    lines = [ln for ln in text.splitlines() if not contains_question(ln)]
    text = " ".join(lines).strip()

    # 3) Limit to max_sentences and ensure ends with a period
    sentences = SENTENCE_SPLIT.split(text)
    text = " ".join(sentences[:max_sentences]).strip()

    if text and text[-1] not in ".!":
        text += "."

    return text

async def generate_mentor_reply(
    client: OpenAI,
    scene: str,
    round_idx: int,
    target_skill: str,
    user_q: str,
    persona: str = "teacher_mentor"
) -> str:
    """
    Generate mentor reply with guaranteed question-free output
    Uses retry logic and hard filtering to ensure compliance
    """
    system = (
        "You are the Mentor. You NEVER ask questions. "
        "Provide ONE concise answer (2–4 sentences). "
        "Do not ask for clarification. No bullet lists. No real names. No AI topics."
    )

    user = f'''Scene: "{scene}"
Round: {round_idx}   TargetSkill: {target_skill}
UserQuestion: "{user_q}"

Respond with one concise paragraph (2–4 sentences), informative and encouraging, no questions.'''

    # First attempt
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.4,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ]
    )
    reply = response.choices[0].message.content or ""

    if contains_question(reply):
        # Retry once with explicit correction
        retry_user = user + "\n\nYour previous reply contained a question. Remove all questions and answer succinctly."
        retry_response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.3,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": retry_user}
            ]
        )
        reply = retry_response.choices[0].message.content or ""

    # Hard filter (guarantee)
    if contains_question(reply):
        reply = sanitize_to_statement(reply, max_sentences=4)

    # Final length guard (very long paragraphs)
    sentences = SENTENCE_SPLIT.split(reply)
    if len(sentences) > 4:
        reply = " ".join(sentences[:4]).strip()
        if reply and reply[-1] not in ".!":
            reply += "."

    return reply

def feedback_hash(feedback_json: Dict[str, Any]) -> str:
    """
    Generate stable hash for feedback JSON for deduplication
    Uses sorted keys for consistent hashing
    """
    normalized = json.dumps(feedback_json, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return "sha256:" + hashlib.sha256(normalized).hexdigest()

def create_telemetry_payload(
    session_id: str,
    scenario_id: str,
    user_id: str | None,
    round_index: int,
    target_skill: str,
    user_question: str,
    mentor_reply: str,
    scores: Dict[str, int],
    issues: list[str],
    feedback: Dict[str, Any],
    model_latency_ms: int | None = None,
    tokens_input: int | None = None,
    tokens_output: int | None = None
) -> Dict[str, Any]:
    """
    Create telemetry payload for session round logging
    """
    return {
        "session_id": session_id,
        "scenario_id": scenario_id,
        "user_id": user_id,
        "round_index": round_index,
        "target_skill": target_skill,
        "user_question": user_question,
        "mentor_reply": mentor_reply,
        "scores": scores,
        "issues": issues,
        "feedback": feedback,
        "feedback_hash": feedback_hash(feedback),
        "model_latency_ms": model_latency_ms,
        "tokens_input": tokens_input,
        "tokens_output": tokens_output
    }