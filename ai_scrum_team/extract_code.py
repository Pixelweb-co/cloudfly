import os
import re

log_path = r"C:\Users\Edwin\.gemini\antigravity\brain\a019d71f-0a75-4346-8c93-f793fc7147ff\.system_generated\tasks\task-394.log"
out_dir = r"C:\apps\cloudfly\developmentAI"

os.makedirs(out_dir, exist_ok=True)

with open(log_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract code blocks
# Looking for ### filename followed by ```language
blocks = re.findall(r'###\s+([^\n]+)\n+```[a-zA-Z]*\n(.*?)```', content, re.DOTALL)

for filename, code in blocks:
    # Clean filename
    filename = filename.strip().replace('`', '').split()[-1]
    # some filenames might be paths like backend/main.py
    if not filename.endswith(('.py', '.js', '.json', '.yml', '.yaml', 'Dockerfile', 'txt', 'tsx')):
        continue
    
    file_path = os.path.join(out_dir, filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, 'w', encoding='utf-8') as out_f:
        # Remove markdown formatting artifacts if any
        clean_code = "\n".join([line.lstrip("│").strip() for line in code.split("\n")])
        out_f.write(clean_code)
        
print("Code extracted successfully!")
