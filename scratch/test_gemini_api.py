import os
from dotenv import load_dotenv
load_dotenv()

key = os.getenv('GEMINI_API_KEY')
print("Testing key:", key[:10] if key else "None")

models_to_test = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.7-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
]

from google import genai
client = genai.Client(api_key=key)

for m in models_to_test:
    try:
        res = client.models.generate_content(model=m, contents="Reply with 'MODEL_OK'")
        print(f"[OK] SUCCESS {m}: {res.text.strip()}")
    except Exception as e:
        print(f"[FAIL] FAILED {m}: {e}")
