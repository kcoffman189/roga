from fastapi import FastAPI
from pydantic import BaseModel
import os
from openai import OpenAI

app = FastAPI()

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
