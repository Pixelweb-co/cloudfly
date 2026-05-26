import os
import re
import sys

# Reconfigure stdout for UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = r"C:\apps\cloudfly\vps_backend_logs.txt"
if not os.path.exists(filepath):
    print("File not found.")
    exit(0)

encodings = ['utf-8', 'utf-16', 'utf-16-le', 'latin-1', 'cp1252']
content = None

for enc in encodings:
    try:
        with open(filepath, 'r', encoding=enc) as f:
            content = f.read()
        print(f"Successfully decoded with {enc}!")
        break
    except Exception as e:
        continue

if content:
    lines = content.splitlines()
    print(f"Total lines: {len(lines)}")
    
    error_patterns = [
        re.compile(r'exception', re.IGNORECASE),
        re.compile(r'error', re.IGNORECASE),
        re.compile(r'fail', re.IGNORECASE),
        re.compile(r'warn', re.IGNORECASE)
    ]
    
    matches = []
    for idx, line in enumerate(lines):
        if any(pat.search(line) for pat in error_patterns):
            matches.append((idx + 1, line))
            
    print(f"\nFound {len(matches)} potential issue/error lines:")
    print("==================================================")
    for num, match in matches[-40:]:
        print(f"Line {num}: {match}")
else:
    print("Failed to decode file.")
