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
        "You are an experienced mentor who provides thoughtful, substantive guidance. "
        "Share insights, perspectives, and practical advice based on your experience. "
        "Be engaging and provide concrete details that give the person something meaningful to consider. "
        "Keep responses to 3-5 sentences. Never ask questions - only provide insights and advice."
    )

    user = f'''You're in a mentoring conversation. Here's the context:

Setting: {scene}
Conversation Round: {round_idx}
Focus Area: {target_skill}

The person asked: "{user_q}"

Provide a thoughtful mentor response that:
- Shares specific insights or examples from experience
- Gives them something concrete to think about
- Helps them understand the topic more deeply
- Is encouraging but realistic

Respond naturally as a mentor would, sharing wisdom and perspective.'''

    # First attempt
    try:
        print(f"Making OpenAI call with system: {system[:100]}...")
        print(f"User prompt: {user[:200]}...")

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user}
            ]
        )
        reply = response.choices[0].message.content or ""
        print(f"Generated mentor reply (first attempt): {reply[:100]}...")
        print(f"Full reply length: {len(reply)}")

        if not reply.strip():
            print("Warning: OpenAI returned empty response on first attempt")
            reply = f"That's an insightful question about {target_skill}. In my experience, the most effective approach often starts with understanding the underlying dynamics at play. Each situation brings unique challenges that require thoughtful consideration of multiple perspectives."

    except Exception as e:
        print(f"Error in first OpenAI call: {e}")
        print(f"Exception type: {type(e)}")
        import traceback
        traceback.print_exc()
        reply = f"This touches on an important aspect of {target_skill}. From what I've observed, success in this area often comes down to consistent practice and learning from both successes and setbacks. The key is developing your own approach while staying open to feedback."

    if contains_question(reply):
        # Retry once with explicit correction
        retry_user = user + "\n\nNote: Provide advice and insights without asking any questions. Share your perspective directly."
        try:
            retry_response = client.chat.completions.create(
                model="gpt-4o-mini",
                temperature=0.3,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": retry_user}
                ]
            )
            reply = retry_response.choices[0].message.content or ""
            print(f"Generated mentor reply (retry): {reply[:100]}...")
        except Exception as e:
            print(f"Error in retry OpenAI call: {e}")
            # Keep the original reply if retry fails

    # Hard filter (guarantee)
    if contains_question(reply):
        reply = sanitize_to_statement(reply, max_sentences=4)

    # Final length guard (very long paragraphs)
    sentences = SENTENCE_SPLIT.split(reply)
    if len(sentences) > 4:
        reply = " ".join(sentences[:4]).strip()
        if reply and reply[-1] not in ".!":
            reply += "."

    # Ensure we never return empty string
    if not reply.strip():
        print("Warning: Final reply is empty, using fallback")
        # Create a more personalized fallback that references the user's actual question
        reply = f"You've raised an important question about {user_q[:50] if len(user_q) > 50 else user_q}. In my experience with {target_skill}, I've found that the most effective approach combines careful analysis with practical action. Consider the specific context of your situation and what outcomes would indicate real progress here."

    print(f"Final mentor reply: {reply[:100]}...")
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