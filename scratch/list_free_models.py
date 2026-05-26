import urllib.request
import json

url = "https://openrouter.ai/api/v1/models"
try:
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read().decode('utf-8'))
        models = data.get("data", [])
        print("Available Free Models on OpenRouter:")
        count = 0
        for m in models:
            # Check if model has free pricing
            pricing = m.get("pricing", {})
            prompt_price = float(pricing.get("prompt", 0))
            completion_price = float(pricing.get("completion", 0))
            if prompt_price == 0.0 and completion_price == 0.0:
                print(f" - {m.get('id')} ({m.get('name')})")
                count += 1
        if count == 0:
            print("No free models found.")
except Exception as e:
    print("Error fetching models:", e)
