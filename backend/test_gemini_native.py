"""Minimal Gemini connectivity smoke test."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai

load_dotenv(Path(__file__).with_name(".env"), override=True)

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise SystemExit("GEMINI_API_KEY is not configured in backend/.env")

client = genai.Client(api_key=api_key)
response = client.models.generate_content(
    model=os.getenv("LLM_MODEL", "gemini-3.5-flash-lite"),
    contents="Reply with exactly: pong",
)
print(response.text)
