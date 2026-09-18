import urllib.request
import json
import os

env_key = None
with open('backend/.env', 'r') as f:
    for line in f:
        if line.startswith('GROQ_API_KEY='):
            env_key = line.strip().split('=', 1)[1]
            break

url = "https://api.groq.com/openai/v1/models"
req = urllib.request.Request(url, headers={
    'Authorization': f'Bearer {env_key}'
})

try:
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        print("Available Groq Models:")
        for model in data.get('data', []):
            print(f"- {model['id']}")
except Exception as e:
    print(f"Error fetching models: {e}")
