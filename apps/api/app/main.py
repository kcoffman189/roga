from fastapi import FastAPI
from pydantic import BaseModel
import os
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Exact production domains
ALLOWED_ORIGINS = [
    "https://roga.me",
    "https://www.roga.me",
]

# --- CORS (allow local dev + production site) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://roga.me",
        "https://www.roga.me",
    ],
    # Allow any *.vercel.app (preview + prod deployments)
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)
# -----------------------------------------------

# Load env vars from Fly secrets
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_DEFAULT = os.getenv("ROGA_MODEL_DEFAULT", "gpt-4o-mini")

client = OpenAI(api_key=OPENAI_API_KEY)

class Question(BaseModel):
    user_question: str

@app.get("/healthz")
def healthz():
    return {
        "ok": True,
        "env": {
            "app_tz": "America/Denver",
            "db": False,
            "openai": bool(OPENAI_API_KEY)
        }
    }

@app.post("/ask")
def ask(payload: Question):
    response = client.chat.completions.create(
        model=MODEL_DEFAULT,
        messages=[
            {"role": "system", "content": "You are a coach helping people learn to ask better questions."},
            {"role": "user", "content": payload.user_question}
        ],
        max_tokens=150,
        temperature=0.5
    )
    return {
        "answer": response.choices[0].message.content
    }
