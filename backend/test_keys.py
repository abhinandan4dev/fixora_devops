import requests

keys = {
    "FIX":    "AIzaSyAF9PGdYzhnTcaRtHAZZsmixd00hzYjfiE",
    "ERROR":  "AIzaSyDnZPV-sDCciho261wzEqsTRoIB1nKZOpM",
    "REPO":   "AIzaSyDM0VobQP3y4x-Zx9eIUzTiEfINoXI_HO0",
    "VERIFY": "AIzaSyDg77hW5Rnn1BBxtQuDjr24ElemcYs8M08",
}

for name, key in keys.items():
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={key}"
    payload = {"contents": [{"parts": [{"text": "Reply with one word: WORKING"}]}]}
    try:
        r = requests.post(url, json=payload, timeout=10)
        if r.status_code == 200:
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            print(f"{name}: OK -> {text}")
        else:
            msg = r.json().get("error", {}).get("message", "")[:80]
            print(f"{name}: HTTP {r.status_code} -> {msg}")
    except Exception as e:
        print(f"{name}: FAIL -> {e}")
