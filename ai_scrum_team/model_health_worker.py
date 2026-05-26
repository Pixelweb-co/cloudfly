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

def load_keys_pool():
    if os.path.exists(KEYS_POOL_PATH):
        try:
            with open(KEYS_POOL_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"[Health Worker] Error reading keys_pool.json: {e}")
    # Fallback structure
    return {
        "keys": [],
        "candidate_models": [
            "openrouter/openrouter/owl-alpha",
            "openrouter/meta-llama/llama-3.3-70b-instruct:free",
            "openrouter/qwen/qwen3-coder:free",
            "openrouter/google/gemini-2.5-flash:free"
        ],
        "default_model": "openrouter/openrouter/owl-alpha"
    }

def get_healthy_key_for_testing(keys):
    # Use current active environment key first, then fall back to the first available in pool
    env_key = os.environ.get("OPENROUTER_API_KEY")
    if env_key:
        return env_key
    if keys:
        return keys[0]
    return None

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

def check_ollama_health(model_name):
    """Check if a local Ollama model is available and responsive."""
    # Strip the 'ollama/' prefix to get the raw model name
    raw_model = model_name[len("ollama/"):] if model_name.startswith("ollama/") else model_name
    url = f"{OLLAMA_BASE_URL}/api/chat"
    payload = {
        "model": raw_model,
        "messages": [{"role": "user", "content": "say ok"}],
        "stream": False,
        "options": {"num_predict": 3}
    }
    start_time = time.time()
    try:
        response = requests.post(url, json=payload, timeout=15)
        latency = round(time.time() - start_time, 2)
        if response.status_code == 200:
            return {"status": "healthy", "latency": latency}
        else:
            return {"status": "unhealthy", "latency": latency, "error": f"Ollama status {response.status_code}"}
    except requests.exceptions.ConnectionError:
        return {"status": "unhealthy", "latency": 0.0, "error": "Ollama not reachable at localhost:11434"}
    except requests.exceptions.Timeout:
        return {"status": "unhealthy", "latency": 15.0, "error": "Ollama timeout"}
    except Exception as e:
        return {"status": "unhealthy", "latency": round(time.time() - start_time, 2), "error": str(e)}

def check_model_health(model_name, api_key):
    # --- Ollama local models ---
    if model_name.startswith("ollama/"):
        return check_ollama_health(model_name)
    
    # --- Groq cloud models ---
    if model_name.startswith("groq/"):
        url = "https://api.groq.com/openai/v1/chat/completions"
        groq_key = os.getenv("GROQ_API_KEY")
        if not groq_key:
            return {"status": "unhealthy", "latency": 0.0, "error": "Missing GROQ_API_KEY"}
        headers = {
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json"
        }
        api_model_name = model_name[len("groq/"):]
    else:
        # --- OpenRouter cloud models ---
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        api_model_name = model_name
        if api_model_name.startswith("openrouter/"):
            api_model_name = api_model_name[len("openrouter/"):]
        
    payload = {
        "model": api_model_name,
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
    models = config.get("candidate_models", [])
    keys = config.get("keys", [])
    default_model = config.get("default_model", "openrouter/openrouter/owl-alpha")
    
    api_key = get_healthy_key_for_testing(keys)
    if not api_key:
        print("[Health Worker] Error: No API keys found to perform health check.")
        return
        
    print(f"\n🔍 [Health Worker - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]: Checking health of candidate models...")
    
    models_status = {}
    healthiest_model = None  # Will be set after checking all models
    best_latency = float("inf")
    
    # Check each candidate model (remote first)
    for model in models:
        status_info = check_model_health(model, api_key)
        models_status[model] = status_info
        print(f"  - {model}: {status_info['status'].upper()} (Latency: {status_info['latency']}s) {status_info.get('error', '')}")
        
        # Prefer remote healthy models first (lower latency = better)
        if status_info["status"] == "healthy" and status_info["latency"] < best_latency:
            best_latency = status_info["latency"]
            healthiest_model = model

    # --- Ollama local fallback: activate ONLY if ALL remote models are down ---
    OLLAMA_LOCAL_MODELS = ["ollama/qwen2.5-coder:7b", "ollama/llama3.2:latest"]
    if healthiest_model is None:
        print("  ⚠️  Todos los modelos remotos están caídos o con rate limit. Probando Ollama local...")
        for local_model in OLLAMA_LOCAL_MODELS:
            status_info = check_ollama_health(local_model)
            models_status[local_model] = status_info
            print(f"  - {local_model}: {status_info['status'].upper()} (Latency: {status_info['latency']}s) {status_info.get('error', '')}")
            if status_info["status"] == "healthy":
                healthiest_model = local_model
                print(f"  🏠 [Ollama Fallback]: Usando modelo local '{local_model}' como respaldo de emergencia.")
                break
    
    # Last resort: use the default model from config even if unhealthy
    if healthiest_model is None:
        healthiest_model = default_model
        print(f"  ⚠️  Ningún modelo disponible. Usando default '{default_model}' como último recurso.")
            
    # Write the health status file
    status_data = {
        "healthiest_model": healthiest_model,
        "last_check": datetime.now().isoformat(),
        "models_status": models_status
    }
    
    try:
        with open(STATUS_PATH, "w", encoding="utf-8") as f:
            json.dump(status_data, f, indent=2, ensure_ascii=False)
        print(f"✅ [Health Worker]: Health status updated! Healthiest model chosen: {healthiest_model}\n")
    except Exception as e:
        print(f"[Health Worker] Error writing health status file: {e}")

def start_daemon_worker():
    # Helper to start in a non-blocking background thread
    import threading
    def worker_loop():
        # Run the first health check cycle immediately on boot to prevent race conditions in main process
        try:
            run_health_check_cycle()
        except Exception as e:
            print(f"[Health Worker Initial Loop Exception]: {e}")
            
        while True:
            time.sleep(300) # Every 5 minutes
            try:
                run_health_check_cycle()
            except Exception as e:
                print(f"[Health Worker Loop Exception]: {e}")
            
    t = threading.Thread(target=worker_loop, daemon=True, name="ModelHealthWorkerThread")
    t.start()
    print("🚀 [Health Worker]: Background thread ModelHealthWorkerThread started successfully.")

if __name__ == "__main__":
    # If run standalone, execute immediately and run in a loop
    try:
        while True:
            run_health_check_cycle()
            time.sleep(300)
    except KeyboardInterrupt:
        print("\n[Health Worker] Stopped by user.")
