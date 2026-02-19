"""
Central AI Client — Google Gemini API
Used by all 4 AI agent layers.

Falls back gracefully to None if the API call fails, so the
deterministic fallback logic in each agent can take over.
Keys are NEVER logged or exposed.
"""

import requests
import logging
import json

logger = logging.getLogger(__name__)

ALLOWED_BUG_TYPES = {"LINTING", "SYNTAX", "LOGIC", "TYPE_ERROR", "IMPORT", "INDENTATION"}

# Google Gemini API
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def call_ai(api_key: str, prompt: str, timeout: int = 30) -> str | None:
    """
    Makes a single call to Google Gemini API.
    Returns the response text, or None on any failure.
    Keys are never printed or included in exceptions.
    """
    if not api_key or api_key.startswith("your_"):
        return None

    url = f"{GEMINI_API_URL}?key={api_key}"
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
        }
    }

    try:
        resp = requests.post(url, json=payload, timeout=timeout)
        resp.raise_for_status()
        data = resp.json()

        # Extract text from Gemini response
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        logger.info(f"AI call succeeded ({len(text)} chars returned)")
        return text.strip()

    except requests.exceptions.Timeout:
        logger.error("AI call timed out.")
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else "unknown"
        logger.error(f"AI HTTP error: {status}")
    except (KeyError, IndexError) as e:
        logger.error(f"AI response parsing failed: {e}")
    except Exception as e:
        logger.error(f"AI call failed: {type(e).__name__}: {str(e)[:100]}")

    return None


def sanitize_bug_type(raw_type: str) -> str:
    """
    Enforces the PS3 allowed bug type allowlist.
    Falls back to LOGIC for any unknown/unsafe type returned by AI.
    """
    normalized = raw_type.strip().upper()
    if normalized in ALLOWED_BUG_TYPES:
        return normalized
    return "LOGIC"
