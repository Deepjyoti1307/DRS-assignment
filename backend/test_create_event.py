import requests
import datetime

url = "http://127.0.0.1:8000/api/events"
payload = {
    "title": "Test Error",
    "description": "desc",
    "date_time": (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat(),
    "mode": "online",
    "venue": "zoom",
    "capacity": 100,
    "registration_mode": "open",
    "template_used": "blank"
}
headers = {
    "Authorization": "Bearer fake_token"
}

try:
    response = requests.post(url, json=payload, headers=headers)
    print("Status:", response.status_code)
    print("Body:", response.text)
except Exception as e:
    print(e)
