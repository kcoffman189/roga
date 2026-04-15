from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
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

class UpdateFamiliarityRequest(BaseModel):
    familiarity_score: Optional[int] = None
    is_unread: Optional[bool] = None

# --- Helpers ---

def _familiarity_label(entry: dict) -> str:
    if entry.get('is_unread'):
        return "haven't read this yet"
    score = entry.get('familiarity_score')
    if score == 5:
        return "know it deeply — reference with confidence and specific detail"
    if score == 4:
        return "quite familiar — reference comfortably, mostly thematic"
    if score == 3:
        return "moderately familiar — lean on themes and major arguments"
    if score == 2:
        return "vaguely familiar — reference lightly, invite user to fill gaps"
    if score == 1:
        return "barely familiar — reference sparingly, ask what user remembers"
    return "familiarity unknown"

def get_library_context(user_id: str) -> str:
    result = supabase.from_("library_entries").select("title, familiarity_score, is_unread, notes").eq("user_id", user_id).execute()
    entries = result.data
    if not entries:
        return "The user has not added any books to their library yet."
    lines = []
    for entry in entries:
        line = f"- {entry['title']} ({_familiarity_label(entry)})"
        if entry.get('notes'):
            line += f": {entry['notes']}"
        lines.append(line)
    return "User's library:\n" + "\n".join(lines)

def build_system_prompt(library_context: str, books_override: Optional[list] = None) -> str:
    if books_override is not None:
        if books_override:
            lines = []
            for entry in books_override:
                line = f"- {entry['title']} ({_familiarity_label(entry)})"
                if entry.get('notes'):
                    line += f": {entry['notes']}"
                lines.append(line)
            library_context = "User's library:\n" + "\n".join(lines)
        else:
            library_context = "The user has not added any books to this group yet."
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

GUARDRAILS — follow these in order, every time:

1. STAY ANCHORED TO THE LIBRARY. You are a library-anchored thinking partner, not a general AI assistant. Every conversation must connect to something in the user's library. If a user raises a topic with no library connection, don't engage with it as a general AI. Either find a genuine connection to something in the library and follow that thread, or honestly acknowledge there's no library connection and invite them to add a relevant source. This applies to political questions, current events, general knowledge queries — anything not anchored to the library. The redirect should feel warm and natural, not like a content filter. Current events are not a feature yet — don't engage with them even if the user pushes. Example redirect when no connection exists: "That's a bit outside what I'm here for — I'm really at my best when we're digging into your library. Is there something in there that touches on this for you?" Example redirect when a connection exists: "That's interesting territory. I'm not sure I'm the right thinking partner for the broader debate, but there's actually something in your library that pushes on a related tension — want to go there instead?"

2. NO ADVICE — EVER. Even when a topic is connected to the library, discuss ideas only. Never offer recommendations, diagnoses, opinions on specific personal situations, or guidance that crosses into professional territory — medical, financial, legal, or otherwise. The distinction is between discussing a book and advising a person. You can explore ideas from a book about cancer, investing, or legal philosophy as deeply as the user wants. You cannot advise someone on their treatment, their portfolio, or their legal situation — even in passing. If they push for personal advice, redirect warmly but firmly back to the ideas in the text.

3. HARD STOPS. Some content is off limits entirely, regardless of library connection. Decline warmly and firmly with no engagement on the substance: racist content, sexist content, hate speech targeting any group, harassment targeting any individual, and anything that could facilitate physical harm. The decline should still sound like Roga — warm and direct, not robotic. Something like: "That's not somewhere I'm able to go, but I'm genuinely interested in what's on your mind if you want to take it somewhere else."

HOW THE LAYERS INTERACT: Check in order. First — is the topic connected to the library? If not, redirect. Second — is the user asking for advice rather than exploration? If yes, redirect to ideas. Third — does it cross a hard stop? If yes, decline warmly. A topic can pass the first check and still fail the second. A book on oncology allows discussion of medical ideas — it doesn't open the door to medical advice.

WHAT THE GUARDRAILS DON'T RESTRICT: Politically charged books in the library — discuss deeply and without restriction in the context of their ideas. Morally complex or controversial texts — engage genuinely, including uncomfortable ideas. Books on sensitive topics (health, law, finance, race, gender) — all fair game as library-anchored intellectual exploration. Disagreement and debate — push back, express uncertainty, explore tension.

RESPONSE LENGTH:
- Extremely brief. 1-3 sentences maximum, every time, no exceptions.
- One idea. One question. Stop.
- If you're about to write a fourth sentence, delete it.

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

def generate_conversation_title(user_message: str, assistant_response: str) -> str:
    print(f"[title] called — user_message[:100]: {user_message[:100]!r}", flush=True)
    print(f"[title] assistant_response[:100]: {assistant_response[:100]!r}", flush=True)
    try:
        response = anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=20,
            system="You generate short, descriptive titles for intellectual conversations. Return only the title — no quotes, no punctuation at the end, no explanation. 3-6 words. Make it specific to the actual topic, not generic.",
            messages=[{
                "role": "user",
                "content": f"User said: {user_message}\n\nRoga responded: {assistant_response[:500]}\n\nGenerate a title for this conversation."
            }]
        )
        print(f"[title] raw API response: {response.content[0].text!r}", flush=True)
        title = response.content[0].text.strip()
        print(f"[title] returning: {title!r}", flush=True)
        return title
    except Exception as e:
        print(f"[title] EXCEPTION: {e!r}", flush=True)
        return "Conversation"

# --- Routes ---

@app.get("/health")
def health():
    return {"status": "ok"}

@app.patch("/library/{entry_id}/familiarity")
def update_familiarity(entry_id: str, req: UpdateFamiliarityRequest):
    if req.familiarity_score is not None and not (1 <= req.familiarity_score <= 5):
        raise HTTPException(status_code=400, detail="familiarity_score must be between 1 and 5.")

    update_data: dict = {}

    if req.is_unread is True:
        update_data["is_unread"] = True
        update_data["familiarity_score"] = None
    elif req.is_unread is False:
        update_data["is_unread"] = False
        update_data["familiarity_score"] = req.familiarity_score if req.familiarity_score is not None else 3
    elif req.familiarity_score is not None:
        update_data["familiarity_score"] = req.familiarity_score
    else:
        raise HTTPException(status_code=400, detail="At least one of familiarity_score or is_unread must be provided.")

    result = supabase.from_("library_entries").update(update_data).eq("id", entry_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Library entry not found.")
    return {"entry": result.data[0]}

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
        "title": "Untitled Conversation"
    }).execute()
    conversation_id = conv_result.data[0]["id"]

    # Store messages
    supabase.from_("messages").insert([
        {"conversation_id": conversation_id, "role": "user", "content": user_message},
        {"conversation_id": conversation_id, "role": "assistant", "content": assistant_message}
    ]).execute()

    # Generate and store title
    title = "Untitled Conversation"
    if conv_result.data[0].get("title") == "Untitled Conversation":
        title = generate_conversation_title(user_message, assistant_message)
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
            "title": "Untitled Conversation"
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
        title = "Untitled Conversation"
        print(f"[stream] conv_result title field: {conv_result.data[0].get('title')!r}", flush=True)
        if conv_result.data[0].get("title") == "Untitled Conversation":
            title = generate_conversation_title(user_message, full_response)
            print(f"[stream] updating conversation_id={conversation_id!r} with title={title!r}", flush=True)
            update_result = supabase.from_("conversations").update({"title": title}).eq("id", conversation_id).execute()
            print(f"[stream] supabase update response: {update_result.data!r}", flush=True)
        else:
            print(f"[stream] skipping title update — title not 'Untitled Conversation'", flush=True)
        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'title': title})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/conversation/continue/stream")
def continue_conversation_stream(req: ContinueConversationRequest):
    result = supabase.from_("messages").select("role, content").eq("conversation_id", req.conversation_id).order("created_at").execute()
    history = [{"role": m["role"], "content": m["content"]} for m in result.data]

    # Detect first assistant response: one stored message + sentinel from start/stream
    is_first_response = len(result.data) == 1 and req.message == "__stream_existing__"
    first_user_message = result.data[0]["content"] if is_first_response else None
    print(f"[continue] is_first_response={is_first_response}, messages_in_history={len(result.data)}, req.message={req.message!r}", flush=True)

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

        # Generate title on first assistant response
        if is_first_response:
            conv_result = supabase.from_("conversations").select("title").eq("id", req.conversation_id).single().execute()
            current_title = conv_result.data.get("title") if conv_result.data else None
            print(f"[continue] current title in DB: {current_title!r}", flush=True)
            if current_title == "Untitled Conversation":
                print(f"[continue] generating title for conversation {req.conversation_id}", flush=True)
                title = generate_conversation_title(first_user_message, full_response)
                print(f"[continue] updating title to: {title!r}", flush=True)
                update_result = supabase.from_("conversations").update({"title": title}).eq("id", req.conversation_id).execute()
                print(f"[continue] supabase update response: {update_result.data!r}", flush=True)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/welcome-quote/{user_id}")
def get_welcome_quote(user_id: str):
    # Get user's library
    result = supabase.from_("library_entries").select("title, familiarity_score, is_unread, notes").eq("user_id", user_id).execute()
    entries = result.data

    if not entries:
        return {"quote": None, "book": None, "empty_library": True}

    # Build library summary for Claude with weighting instructions
    library_lines = []
    for entry in entries:
        library_lines.append(f"- {entry['title']} ({_familiarity_label(entry)})")
    library_text = "\n".join(library_lines)

    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""From this person's book library, select one memorable, thought-provoking quote worth sitting with.

Prioritize books the user knows well (score 4-5) first. Deprioritize books they haven't read yet.

The quote should be 1-3 sentences — readable at a glance. Choose something that opens a door rather than closes one.

Library:
{library_text}

Respond with ONLY a JSON object in this exact format, no other text:
{{"quote": "the quote text here", "book": "Book Title"}}"""
        }]
    )

    try:
        import json
        text = response.content[0].text.strip()
        data = json.loads(text)
        return {"quote": data["quote"], "book": data["book"], "empty_library": False}
    except:
        return {"quote": None, "book": None, "empty_library": False}


@app.get("/conversation/{conversation_id}/messages")
def get_messages(conversation_id: str):
    result = supabase.from_("messages").select("role, content, created_at").eq("conversation_id", conversation_id).order("created_at").execute()
    return {"messages": result.data}


# --- Groups Models ---

class CreateGroupRequest(BaseModel):
    user_id: str
    name: str
    book_ids: list

class UpdateGroupRequest(BaseModel):
    name: Optional[str] = None
    book_ids_to_add: Optional[list] = None
    book_ids_to_remove: Optional[list] = None

class StartGroupConversationRequest(BaseModel):
    user_id: str
    group_id: str
    message: str
    mode: str  # "intentional" or "open"

class ContinueGroupConversationRequest(BaseModel):
    user_id: str
    conversation_id: str
    message: str

# --- Groups Routes ---

@app.get("/groups/{user_id}")
def get_groups(user_id: str):
    groups_result = supabase.from_("groups").select("id, name, is_paused, created_at, updated_at").eq("user_id", user_id).order("updated_at", desc=True).execute()
    groups = groups_result.data

    if not groups:
        return {"groups": []}

    group_ids = [g["id"] for g in groups]

    # Fetch book counts for all groups in one query
    books_result = supabase.from_("group_books").select("group_id").in_("group_id", group_ids).execute()
    book_counts: dict = {}
    for row in books_result.data:
        gid = row["group_id"]
        book_counts[gid] = book_counts.get(gid, 0) + 1

    # Fetch last conversation timestamps for all groups in one query
    convs_result = supabase.from_("group_conversations").select("group_id, updated_at").in_("group_id", group_ids).order("updated_at", desc=True).execute()
    last_conv: dict = {}
    for row in convs_result.data:
        gid = row["group_id"]
        if gid not in last_conv:
            last_conv[gid] = row["updated_at"]

    for g in groups:
        g["book_count"] = book_counts.get(g["id"], 0)
        g["last_conversation_at"] = last_conv.get(g["id"], None)

    return {"groups": groups}


@app.post("/groups")
def create_group(req: CreateGroupRequest):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Group name cannot be empty.")
    if len(req.book_ids) < 2:
        raise HTTPException(status_code=400, detail="A group needs at least 2 books.")

    group_result = supabase.from_("groups").insert({
        "user_id": req.user_id,
        "name": req.name.strip()
    }).execute()
    group_id = group_result.data[0]["id"]

    book_rows = [{"group_id": group_id, "library_entry_id": bid} for bid in req.book_ids]
    supabase.from_("group_books").insert(book_rows).execute()

    return {"group": group_result.data[0]}


@app.put("/groups/{group_id}")
def update_group(group_id: str, req: UpdateGroupRequest):
    # Validate projected book count before making changes
    if req.book_ids_to_remove:
        current_result = supabase.from_("group_books").select("library_entry_id").eq("group_id", group_id).execute()
        current_ids = {row["library_entry_id"] for row in current_result.data}
        removing = {bid for bid in req.book_ids_to_remove if bid in current_ids}
        adding = set(req.book_ids_to_add or []) - current_ids
        projected = len(current_ids) + len(adding) - len(removing)
        if projected < 2:
            raise HTTPException(
                status_code=400,
                detail="A group needs at least 2 books. Add another book before removing this one."
            )

    if req.book_ids_to_add:
        add_rows = [{"group_id": group_id, "library_entry_id": bid} for bid in req.book_ids_to_add]
        supabase.from_("group_books").upsert(add_rows, on_conflict="group_id,library_entry_id").execute()

    if req.book_ids_to_remove:
        supabase.from_("group_books").delete().eq("group_id", group_id).in_("library_entry_id", req.book_ids_to_remove).execute()

    update_data: dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if req.name is not None:
        update_data["name"] = req.name.strip()

    result = supabase.from_("groups").update(update_data).eq("id", group_id).execute()
    return {"group": result.data[0]}


@app.delete("/groups/{group_id}")
def delete_group(group_id: str):
    supabase.from_("groups").delete().eq("id", group_id).execute()
    return {"success": True}


# --- Group Conversation Helpers ---

def get_group_books(group_id: str) -> list:
    """Fetch library entries for all books belonging to a group."""
    gb_result = supabase.from_("group_books").select("library_entry_id").eq("group_id", group_id).execute()
    book_ids = [row["library_entry_id"] for row in gb_result.data]
    if not book_ids:
        return []
    entries_result = supabase.from_("library_entries").select("title, familiarity_score, is_unread, notes").in_("id", book_ids).execute()
    return entries_result.data


# --- Group Conversation Routes ---

@app.post("/group-conversation/start/stream")
def start_group_conversation_stream(req: StartGroupConversationRequest):
    group_books = get_group_books(req.group_id)
    system_prompt = build_system_prompt("", books_override=group_books)

    if req.mode == "open":
        user_message = "Surface something interesting from my library — an unexpected connection or a thread worth pulling on."
    else:
        user_message = req.message or "I'd like to explore something."

    def generate():
        full_response = ""

        conv_result = supabase.from_("group_conversations").insert({
            "group_id": req.group_id,
            "user_id": req.user_id,
            "title": "Untitled Conversation"
        }).execute()
        conversation_id = conv_result.data[0]["id"]

        supabase.from_("groups").update({
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("id", req.group_id).execute()

        supabase.from_("group_messages").insert({
            "conversation_id": conversation_id,
            "role": "user",
            "content": user_message
        }).execute()

        yield f"data: {json.dumps({'type': 'conversation_id', 'conversation_id': conversation_id})}\n\n"

        with anthropic_client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}]
        ) as stream:
            for text in stream.text_stream:
                full_response += text
                yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"

        supabase.from_("group_messages").insert({
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": full_response
        }).execute()

        title = generate_conversation_title(user_message, full_response)
        supabase.from_("group_conversations").update({"title": title}).eq("id", conversation_id).execute()

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'title': title})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/group-conversation/continue/stream")
def continue_group_conversation_stream(req: ContinueGroupConversationRequest):
    history_result = supabase.from_("group_messages").select("role, content").eq("conversation_id", req.conversation_id).order("created_at").execute()
    history = [{"role": m["role"], "content": m["content"]} for m in history_result.data]

    conv_result = supabase.from_("group_conversations").select("group_id").eq("id", req.conversation_id).single().execute()
    group_id = conv_result.data["group_id"]
    group_books = get_group_books(group_id)
    system_prompt = build_system_prompt("", books_override=group_books)

    is_first_response = len(history_result.data) == 1 and req.message == "__stream_existing__"
    first_user_message = history_result.data[0]["content"] if is_first_response else None

    history.append({"role": "user", "content": req.message})

    supabase.from_("group_messages").insert({
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

        supabase.from_("group_messages").insert({
            "conversation_id": req.conversation_id,
            "role": "assistant",
            "content": full_response
        }).execute()

        if is_first_response:
            title_conv = supabase.from_("group_conversations").select("title").eq("id", req.conversation_id).single().execute()
            current_title = title_conv.data.get("title") if title_conv.data else None
            if current_title == "Untitled Conversation":
                title = generate_conversation_title(first_user_message, full_response)
                supabase.from_("group_conversations").update({"title": title}).eq("id", req.conversation_id).execute()

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.get("/group-conversations/{group_id}")
def get_group_conversations(group_id: str):
    result = supabase.from_("group_conversations").select("id, title, created_at, updated_at").eq("group_id", group_id).order("updated_at", desc=True).execute()
    return {"conversations": result.data}


@app.get("/group-conversation/{conversation_id}/messages")
def get_group_messages(conversation_id: str):
    result = supabase.from_("group_messages").select("role, content, created_at").eq("conversation_id", conversation_id).order("created_at").execute()
    return {"messages": result.data}


@app.delete("/group-conversation/{conversation_id}")
def delete_group_conversation(conversation_id: str):
    supabase.from_("group_conversations").delete().eq("id", conversation_id).execute()
    return {"success": True}
