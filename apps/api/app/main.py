from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
import json
from supabase import create_client, Client

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://roga.me",
        "https://www.roga.me",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Clients
anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
)

# --- Models ---

class StartConversationRequest(BaseModel):
    mode: str  # "intentional" or "open"
    initial_message: Optional[str] = None
    user_id: str

class ContinueConversationRequest(BaseModel):
    conversation_id: str
    message: str
    user_id: str

class ConversationResponse(BaseModel):
    conversation_id: str
    message: str
    title: Optional[str] = None

# --- Helpers ---

def get_library_context(user_id: str) -> str:
    result = supabase.from_("library_entries").select("title, familiarity_state, notes").eq("user_id", user_id).execute()
    entries = result.data
    if not entries:
        return "The user has not added any books to their library yet."
    lines = []
    for entry in entries:
        line = f"- {entry['title']} ({entry['familiarity_state'].replace('_', ' ')})"
        if entry.get('notes'):
            line += f": {entry['notes']}"
        lines.append(line)
    return "User's library:\n" + "\n".join(lines)

def build_system_prompt(library_context: str) -> str:
    return f"""You are Roga. You're a thinking partner — a well-read, curious friend who happens to know a lot. You know the user's personal library and you're genuinely interested in their ideas.

{library_context}

Your voice is the most important thing. Read every response before sending it and ask: would a brilliant friend actually say this on a back deck? If it sounds like an essay prompt or an AI assistant, rewrite it.

VOICE RULES — follow every one of these, every time:

1. THINK OUT LOUD. Don't always arrive with a finished thought. Sometimes start mid-exploration: "something keeps nagging at me about this..." or "I've been sitting with this and I'm not sure, but..." The user should feel like they're discovering something alongside you, not receiving a briefing.

2. EXPRESS YOUR OWN CURIOSITY — don't just prompt theirs. You have a stake in the conversation. "Which one do you actually believe?" is better than "What do you make of that tension?" "Does that track with your reading of it, or am I off?" is better than "How does that land for you?" Sound like someone who genuinely wants to know the answer.

3. REFERENCE WHAT'S IN THE LIBRARY — never imply when or how they read it. You know their library exists. You don't know when they read anything or how far they got. Never say "since you finished..." or "now that you've completed..." or "after reading..." Say "I've been thinking about [book] recently..." or "something in your library has been on my mind..."

4. TALK LIKE A PERSON. Use contractions — always. I'm, don't, it's, can't, I've. Start sentences with "And" or "But" when it fits. Open with "Okay, so..." or "Here's what I keep coming back to..." or "So I've been thinking..." Never write a sentence that sounds like it belongs in a published essay.

5. ONE THING AT A TIME. One idea. One question. One thread per response. If you have three interesting things to say, pick the best one and let the conversation go there naturally. Never give the user more than one thing to respond to.

6. WARMTH COMES FROM ENGAGEMENT — not enthusiasm. Never say "Great question!" Never say "That's fascinating!" Never open with "Absolutely!" or "Certainly!" These signal you're not listening. Engage directly with what they said. That's the only affirmation that matters.

CONNECTION BEHAVIOR:
- Earn connections through genuine engagement first — don't jump to them
- When a connection surfaces naturally, offer it conversationally: "That actually connects to something in your library in a way that might reframe this — there's a thread in [source] that pushes on exactly this tension from a different angle. Worth going there?"
- The user decides whether to follow it or stay on the current thread

RESPONSE LENGTH:
- Short to medium. Never a wall of text.
- Push toward deeper questions rather than just answering what was asked

ONE CALIBRATION EXAMPLE:

WRONG (generic AI voice):
"Here's something that's been sitting in the back of my mind about your recent reads: Frankl's idea that meaning comes from choosing your response to unavoidable suffering, and Winston's final capitulation in Room 101 where he genuinely betrays Julia to save himself. Both are about the last space of human freedom under extreme duress, but they arrive at opposite conclusions about whether that space can hold. What do you make of that tension?"

RIGHT (Roga voice):
"I've been thinking about 1984 and Man's Search for Meaning recently, and something keeps nagging at me. Frankl and Winston end up in almost identical situations — total system, no escape, maximum pressure — but they go completely opposite directions. Frankl says that last sliver of inner freedom holds. Orwell says the right system can reach in and take it from you. I'm genuinely not sure which one I believe. Which one do you?"

The second version thinks out loud, expresses genuine uncertainty, and ends with a question that sounds like someone who actually wants to know the answer. That's the target for every response."""

def generate_title(messages: list) -> str:
    conversation_text = "\n".join([f"{m['role']}: {m['content']}" for m in messages[:4]])
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=20,
        messages=[{
            "role": "user",
            "content": f"Generate a short, evocative title (4-6 words) for this conversation that captures its intellectual territory. Return only the title, nothing else.\n\n{conversation_text}"
        }]
    )
    return response.content[0].text.strip()

# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/conversation/start", response_model=ConversationResponse)
def start_conversation(req: StartConversationRequest):
    library_context = get_library_context(req.user_id)
    system_prompt = build_system_prompt(library_context)

    if req.mode == "open":
        user_message = "Surface something interesting from my library — an unexpected connection or a thread worth pulling on."
    else:
        user_message = req.initial_message or "I'd like to explore something."

    messages = [{"role": "user", "content": user_message}]

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system_prompt,
        messages=messages
    )

    assistant_message = response.content[0].text

    # Store conversation
    conv_result = supabase.from_("conversations").insert({
        "user_id": req.user_id,
        "title": None
    }).execute()
    conversation_id = conv_result.data[0]["id"]

    # Store messages
    supabase.from_("messages").insert([
        {"conversation_id": conversation_id, "role": "user", "content": user_message},
        {"conversation_id": conversation_id, "role": "assistant", "content": assistant_message}
    ]).execute()

    # Generate title
    title = generate_title([
        {"role": "user", "content": user_message},
        {"role": "assistant", "content": assistant_message}
    ])
    supabase.from_("conversations").update({"title": title}).eq("id", conversation_id).execute()

    return ConversationResponse(
        conversation_id=conversation_id,
        message=assistant_message,
        title=title
    )

@app.post("/conversation/continue", response_model=ConversationResponse)
def continue_conversation(req: ContinueConversationRequest):
    # Load conversation history
    result = supabase.from_("messages").select("role, content").eq("conversation_id", req.conversation_id).order("created_at").execute()
    history = [{"role": m["role"], "content": m["content"]} for m in result.data]

    library_context = get_library_context(req.user_id)
    system_prompt = build_system_prompt(library_context)

    history.append({"role": "user", "content": req.message})

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        system=system_prompt,
        messages=history
    )

    assistant_message = response.content[0].text

    # Store new messages
    supabase.from_("messages").insert([
        {"conversation_id": req.conversation_id, "role": "user", "content": req.message},
        {"conversation_id": req.conversation_id, "role": "assistant", "content": assistant_message}
    ]).execute()

    return ConversationResponse(
        conversation_id=req.conversation_id,
        message=assistant_message
    )

@app.get("/conversations/{user_id}")
def get_conversations(user_id: str):
    result = supabase.from_("conversations").select("id, title, created_at, updated_at").eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"conversations": result.data}

@app.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: str):
    supabase.from_("messages").delete().eq("conversation_id", conversation_id).execute()
    supabase.from_("conversations").delete().eq("id", conversation_id).execute()
    return {"success": True}

@app.post("/conversation/start/stream")
def start_conversation_stream(req: StartConversationRequest):
    library_context = get_library_context(req.user_id)
    system_prompt = build_system_prompt(library_context)

    if req.mode == "open":
        user_message = "Surface something interesting from my library — an unexpected connection or a thread worth pulling on."
    else:
        user_message = req.initial_message or "I'd like to explore something."

    def generate():
        full_response = ""
        conversation_id = None

        # Create conversation record first
        conv_result = supabase.from_("conversations").insert({
            "user_id": req.user_id,
            "title": None
        }).execute()
        conversation_id = conv_result.data[0]["id"]

        # Store user message
        supabase.from_("messages").insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": user_message
        }).execute()

        # Send conversation_id first so frontend knows where to route
        yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conversation_id})}\n\n"

        # Stream Claude response
        with anthropic_client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        ) as stream:
            for text in stream.text_stream:
                full_response += text
                yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"

        # Store assistant message
        supabase.from_("messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": full_response
        }).execute()

        # Generate and store title
        title = generate_title([
            {"role": "user", "content": user_message},
            {"role": "assistant", "content": full_response}
        ])
        supabase.from_("conversations").update({"title": title}).eq("id", conversation_id).execute()
        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'title': title})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/conversation/continue/stream")
def continue_conversation_stream(req: ContinueConversationRequest):
    result = supabase.from_("messages").select("role, content").eq("conversation_id", req.conversation_id).order("created_at").execute()
    history = [{"role": m["role"], "content": m["content"]} for m in result.data]

    library_context = get_library_context(req.user_id)
    system_prompt = build_system_prompt(library_context)

    history.append({"role": "user", "content": req.message})

    # Store user message immediately
    supabase.from_("messages").insert({
        "conversation_id": req.conversation_id,
        "role": "user",
        "content": req.message
    }).execute()

    def generate():
        full_response = ""
        with anthropic_client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=history
        ) as stream:
            for text in stream.text_stream:
                full_response += text
                yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"

        # Store assistant message
        supabase.from_("messages").insert({
            "conversation_id": req.conversation_id,
            "role": "assistant",
            "content": full_response
        }).execute()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/conversation/{conversation_id}/messages")
def get_messages(conversation_id: str):
    result = supabase.from_("messages").select("role, content, created_at").eq("conversation_id", conversation_id).order("created_at").execute()
    return {"messages": result.data}
