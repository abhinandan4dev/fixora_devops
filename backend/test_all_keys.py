import requests
import os
from dotenv import load_dotenv

load_dotenv('C:\\Users\\ark45\\OneDrive\\Desktop\\healer\\.env')

def test_key(name, key):
    if not key:
        print(f"{name}: Missing")
        return
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Say OKAY"}]}]}
    r = requests.post(url, json=payload)
    if r.status_code == 200:
        print(f"{name}: {r.status_code} - {r.json()['candidates'][0]['content']['parts'][0]['text'].strip()}")
    else:
        print(f"{name}: {r.status_code} - {r.text[:50]}")

test_key("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY"))
test_key("AI_REPO_KEY", os.getenv("AI_REPO_KEY"))
test_key("AI_ERROR_KEY", os.getenv("AI_ERROR_KEY"))
test_key("AI_FIX_KEY", os.getenv("AI_FIX_KEY"))
test_key("AI_VERIFY_KEY", os.getenv("AI_VERIFY_KEY"))
