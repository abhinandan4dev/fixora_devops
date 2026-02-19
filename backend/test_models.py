import requests

API_KEY = "AIzaSyDVtYyNBhN95EG3ybN6Uv2x7Teg2Q9HaEk"
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
r = requests.get(url)

if r.status_code == 200:
    models = r.json().get("models", [])
    valid_models = []
    for m in models:
        if "flash" in m["name"] and "generateContent" in m.get("supportedGenerationMethods", []):
            valid_models.append(m["name"])
    print("Available Flash Models:", valid_models)
else:
    print("Error fetching models:", r.status_code, r.text)

test_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={API_KEY}"
r = requests.post(test_url, json={"contents": [{"parts": [{"text" : "Reply WORKING"}]}]})
if r.status_code == 200:
    print("gemini-1.5-flash API works!")
else:
    print("1.5-flash failed:", r.status_code, r.text)
