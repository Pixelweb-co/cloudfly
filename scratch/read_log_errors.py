import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

log_path = r"C:\Users\Edwin\.gemini\antigravity\brain\ab97df92-e82e-4b6f-8469-de750247ccb2\.system_generated\tasks\task-285.log"

with open(log_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

print("Log total lines:", len(lines))

# Search for actual Traceback or Crew Failure exceptions
print("\n--- Exception matches ---")
found_count = 0
for idx, line in enumerate(lines):
    # Filter out file list names
    if any(ext in line.lower() for ext in [".js", ".py", ".sql", ".md", ".json", ".xml", ".txt", ".sh", ".yml", ".ts"]):
        continue
    if "traceback" in line.lower() or "crew execution failed" in line.lower() or "error" in line.lower() or "fail" in line.lower():
        if any(w in line.lower() for w in ["litellm", "redis", "botocore", "sagemaker"]):
            continue
        start = max(0, idx - 5)
        end = min(len(lines), idx + 20)
        print(f"\n--- EXCEPTION MATCH at line {idx} ---")
        for j in range(start, end):
            clean_line = lines[j].encode('ascii', 'ignore').decode('ascii')
            print(f"{j}: {clean_line.strip()}")
        found_count += 1
        if found_count >= 5:
            break
