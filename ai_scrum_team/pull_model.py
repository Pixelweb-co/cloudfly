import subprocess
import time

def check_model():
    result = subprocess.run(["docker", "exec", "ollama", "ollama", "list"], capture_output=True, text=True)
    return "qwen2.5-coder:7b:latest" in result.stdout or "qwen2.5-coder:7b" in result.stdout

print("Downloading qwen2.5-coder:7b...")
while not check_model():
    print("Pulling qwen2.5-coder:7b...")
    subprocess.run(["docker", "exec", "ollama", "ollama", "pull", "qwen2.5-coder:7b"])
    time.sleep(2)

print("qwen2.5-coder:7b successfully downloaded and verified!")
