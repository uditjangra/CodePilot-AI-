import json
import os
import re
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).with_name(".env"))
except ImportError:
    pass


app = FastAPI(title="AI Debug Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_MODELS = "gemini-2.5-flash-lite,gemini-2.0-flash-lite,gemini-2.0-flash"
MODEL_CANDIDATES = [
    model.strip()
    for model in os.getenv("GEMINI_MODELS", DEFAULT_MODELS).split(",")
    if model.strip()
]

_client = None


class DebugRequest(BaseModel):
    code: str
    language: Optional[str] = None


class DebugResponse(BaseModel):
    explanation: str
    fix: str
    corrected_code: str


def get_client():
    global _client

    if _client is not None:
        return _client

    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gemini API key is missing. Set GEMINI_API_KEY in your backend environment or .env file.",
        )

    try:
        from google import genai
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="Gemini SDK is missing. Run: pip install -r requirements.txt",
        ) from exc

    _client = genai.Client(api_key=api_key)
    return _client


def is_quota_error(error: Exception) -> bool:
    message = str(error).lower()
    code = getattr(error, "code", None)
    status = str(getattr(error, "status", "")).lower()
    return (
        code == 429
        or "429" in message
        or "quota" in message
        or "resource_exhausted" in message
        or "rate limit" in message
        or status == "resource_exhausted"
    )


def extract_json_object(text: str) -> dict:
    cleaned = text.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned.split("```json", 1)[1]
        if "```" in cleaned:
            cleaned = cleaned.rsplit("```", 1)[0]
    elif cleaned.startswith("```"):
        cleaned = cleaned.split("```", 1)[1]
        if "```" in cleaned:
            cleaned = cleaned.rsplit("```", 1)[0]

    cleaned = cleaned.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def generate_content(prompt: str) -> tuple[str, str]:
    client = get_client()
    failures: list[str] = []
    quota_failures: list[str] = []

    for model in MODEL_CANDIDATES:
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
            )
            text = (getattr(response, "text", "") or "").strip()
            if not text:
                raise RuntimeError("Gemini returned an empty response.")
            return text, model
        except Exception as exc:
            message = str(exc)
            failures.append(f"{model}: {message}")
            if is_quota_error(exc):
                quota_failures.append(model)
                continue
            raise HTTPException(
                status_code=500,
                detail=f"Gemini request failed for {model}: {message}",
            ) from exc

    if quota_failures:
        raise HTTPException(
            status_code=429,
            detail=(
                "Gemini quota/rate limit was reached for these models: "
                f"{', '.join(quota_failures)}. Gemini API limits still apply per model and Google Cloud project. "
                "Try again after the quota reset, add billing, or set GEMINI_MODELS to a model with available quota."
            ),
        )

    raise HTTPException(status_code=500, detail="Gemini request failed: " + " | ".join(failures))


@app.post("/api/debug", response_model=DebugResponse)
async def debug_code(request: DebugRequest):
    if not request.code.strip():
        raise HTTPException(status_code=400, detail="Code input cannot be empty.")

    language_hint = (
        f"\nThe programming language is: {request.language}" if request.language else ""
    )

    prompt = f"""You are an expert AI Debug Assistant. Analyze the following code.
{language_hint}

Instructions:
- If the code has errors, explain what is wrong, suggest a fix, and provide corrected code.
- If the code has no errors, explain what the code does, say "No fix needed" for the fix, and return the original code as corrected_code.

Return your response as a valid JSON object with EXACTLY these three keys:
{{
  "explanation": "your explanation here",
  "fix": "your fix suggestion here",
  "corrected_code": "the corrected or original code here"
}}

Do NOT wrap the JSON in markdown code fences. Return ONLY the raw JSON object.

Code:
```
{request.code}
```"""

    try:
        text, _model = generate_content(prompt)
        data = extract_json_object(text)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500, detail="Failed to parse AI response. Please try again."
        )

    return DebugResponse(
        explanation=data.get("explanation", "No explanation provided."),
        fix=data.get("fix", "No fix needed."),
        corrected_code=data.get("corrected_code", request.code),
    )


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "AI Debug Assistant Backend is running!",
        "models": MODEL_CANDIDATES,
        "gemini_key_configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
    }
