import requests
import os
from dotenv import load_dotenv

load_dotenv('C:\\Users\\ark45\\OneDrive\\Desktop\\healer\\.env')

def test_key(name, key):
    if not key: return
    # Testing 1.5-flash
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Say OKAY"}]}]}
    r = requests.post(url, json=payload)
    if r.status_code == 200:
        print(f"{name} (1.5-flash): {r.status_code} - OK")
    else:
        print(f"{name} (1.5-flash): {r.status_code} - {r.text[:50]}")

test_key("GEMINI_API_KEY", os.getenv("GEMINI_API_KEY"))
test_key("AI_REPO_KEY", os.getenv("AI_REPO_KEY"))
