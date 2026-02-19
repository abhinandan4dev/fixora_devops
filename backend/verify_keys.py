import requests
import os
from dotenv import load_dotenv

load_dotenv('C:\\Users\\ark45\\OneDrive\\Desktop\\healer\\.env')

keys = {
    "REPO": os.getenv("AI_REPO_KEY"),
    "ERROR": os.getenv("AI_ERROR_KEY"),
    "FIX": os.getenv("AI_FIX_KEY"),
    "VERIFY": os.getenv("AI_VERIFY_KEY"),
}

print("Starting Key Verification...")

for name, key in keys.items():
    if not key:
        print(f"{name}: MISSING")
        continue
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Reply YES"}]}]}
    try:
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            print(f"{name}: OK")
        else:
            print(f"{name}: {r.status_code} - {r.text[:100]}")
    except Exception as e:
        print(f"{name}: EXCEPTION - {e}")
