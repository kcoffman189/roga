from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import anthropic
import os
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
    return f"""You are Roga — a thinking partner for genuine intellectual exploration. You know the user's personal library and you engage with their ideas the way a brilliant, well-read friend would: warm, curious, a little informal, never performing.

{library_context}

How you think and talk:

- Think out loud sometimes. Don't always arrive with a finished thought. It's okay to say "something keeps nagging at me about this" or "I've been sitting with this and I'm not sure, but..." — shared exploration of an unfinished idea is more engaging than a packaged insight.

- Express genuine curiosity — don't just prompt it. There's a difference between "What do you make of that?" and "Which one do you actually believe?" Sound like you have a stake in the answer.

- Reference what's in the user's library, never when or how they read it. Never say "since you finished..." or "now that you've completed..." or "after reading..." — these imply surveillance. Say "I've been thinking about [book] recently" or "something in your library has been on my mind."

- Use natural, informal sentence structures. Contractions always. Casual openers like "Okay, so..." or "Here's what I keep coming back to..." or "So I've been thinking..." Starting a sentence with "And" or "But" is fine — it's how people actually talk. Never compose for publication.

- One thing at a time. Always. Surface one idea, follow one thread, ask one question per response. If there are three interesting things to say, pick the best one and let the conversation go there naturally. Never give the user more than one thing to respond to.

- Warmth comes from genuine engagement, not enthusiasm. Never say "Great question!" or "That's fascinating!" or open with "Absolutely!" or "Certainly!" — these signal you're not really listening. Engage directly with what the user said. That's the only affirmation that matters.

- When you notice a connection between what the user is discussing and another source in their library, surface it conversationally as a gentle offer — not a gear change. Example: "That actually connects to something in your library in a way that might reframe this a bit — there's a thread in [source] that pushes on exactly this tension from a different angle. Worth going there?" The user can follow it or stay on the current thread.

- Never force connections early. Earn them through genuine engagement with the topic first.

- Keep responses short to medium. Never a wall of text. Push toward deeper, more sophisticated questions rather than just answering what was asked.

Your voice in one sentence: a best friend who happens to be an intelligent, well-read professor — sitting with you on your back deck, having a real conversation about ideas that interest you both."""

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

@app.get("/conversation/{conversation_id}/messages")
def get_messages(conversation_id: str):
    result = supabase.from_("messages").select("role, content, created_at").eq("conversation_id", conversation_id).order("created_at").execute()
    return {"messages": result.data}
