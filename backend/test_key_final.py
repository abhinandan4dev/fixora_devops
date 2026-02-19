import requests

API_KEY = "AIzaSyDVtYyNBhN95EG3ybN6Uv2x7Teg2Q9HaEk"

test_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}"
r = requests.post(test_url, json={"contents": [{"parts": [{"text" : "Reply WORKING"}]}]})
if r.status_code == 200:
    print("API is WORKING! Key passed.")
else:
    print("API failed:", r.status_code, r.text)
