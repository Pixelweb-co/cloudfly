import os
import sys
import json
import time
import requests
from datetime import datetime
from dotenv import load_dotenv

# Load environmental variables from the local .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

# Force UTF-8 encoding for Windows terminals to support emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Path references
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEYS_POOL_PATH = os.path.join(BASE_DIR, "keys_pool.json")
STATUS_PATH = os.path.join(BASE_DIR, "model_health_status.json")

# ── Active Models (all via OpenRouter) ─────────────────────────────────
# Primary:   openrouter/owl-alpha
# Secondary: z-ai/glm-4.5-air:free
CANDIDATE_MODELS = [
    "openrouter/owl-alpha",
    "z-ai/glm-4.5-air:free",
]
DEFAULT_MODEL = "openrouter/owl-alpha"


def load_keys_pool():
    if os.path.exists(KEYS_POOL_PATH):
        try:
            with open(KEYS_POOL_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Health Worker] Error reading keys_pool.json: {e}")
    return {"keys": [], "default_model": DEFAULT_MODEL}


def get_healthy_key_for_testing(keys):
    env_key = os.environ.get("OPENROUTER_API_KEY")
    if env_key:
        return env_key
    if keys:
        return keys[0]
    return None


def check_model_health(model_name, api_key):
    """Check model health via OpenRouter API."""
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    # Use model name as-is (OpenRouter expects the full model ID)
    payload = {
        "model": model_name,
        "messages": [{"role": "user", "content": "say ok"}],
        "max_tokens": 5
    }

    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=8)
        latency = round(time.time() - start_time, 2)

        if response.status_code == 200:
            return {"status": "healthy", "latency": latency}
        elif response.status_code == 429:
            return {"status": "rate_limited", "latency": latency, "error": "429 Rate Limit"}
        else:
            return {"status": "unhealthy", "latency": latency, "error": f"Status {response.status_code}: {response.text[:100]}"}
    except requests.exceptions.Timeout:
        return {"status": "unhealthy", "latency": 8.0, "error": "Timeout"}
    except Exception as e:
        return {"status": "unhealthy", "latency": round(time.time() - start_time, 2), "error": str(e)}


def run_health_check_cycle():
    config = load_keys_pool()
    keys = config.get("keys", [])

    api_key = get_healthy_key_for_testing(keys)
    if not api_key:
        print("[Health Worker] Error: No API keys found to perform health check.")
        return

    print(f"\n🔍 [Health Worker - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]: Checking health of models...")

    models_status = {}
    healthiest_model = None
    best_latency = float("inf")

    for model in CANDIDATE_MODELS:
        status_info = check_model_health(model, api_key)
        models_status[model] = status_info
        print(f"  - {model}: {status_info['status'].upper()} (Latency: {status_info['latency']}s) {status_info.get('error', '')}")

        if status_info["status"] == "healthy" and status_info["latency"] < best_latency:
            best_latency = status_info["latency"]
            healthiest_model = model

    # Fallback to default if all are down
    if healthiest_model is None:
        healthiest_model = DEFAULT_MODEL
        print(f"  ⚠️  All models down. Falling back to default: {DEFAULT_MODEL}")

    # Write the health status file
    status_data = {
        "healthiest_model": healthiest_model,
        "last_check": datetime.now().isoformat(),
        "models_status": models_status
    }

    try:
        with open(STATUS_PATH, "w", encoding="utf-8") as f:
            json.dump(status_data, f, indent=2, ensure_ascii=False)
        print(f"✅ [Health Worker]: Healthiest model: {healthiest_model}\n")
    except Exception as e:
        print(f"[Health Worker] Error writing health status file: {e}")


def start_daemon_worker():
    import threading
    def worker_loop():
        try:
            run_health_check_cycle()
        except Exception as e:
            print(f"[Health Worker Initial Loop Exception]: {e}")

        while True:
            time.sleep(300)  # Every 5 minutes
            try:
                run_health_check_cycle()
            except Exception as e:
                print(f"[Health Worker Loop Exception]: {e}")

    t = threading.Thread(target=worker_loop, daemon=True, name="ModelHealthWorkerThread")
    t.start()
    print("🚀 [Health Worker]: Background thread started.")


if __name__ == "__main__":
    try:
        while True:
            run_health_check_cycle()
            time.sleep(300)
    except KeyboardInterrupt:
        print("\n[Health Worker] Stopped by user.")
