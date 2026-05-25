import os
import re
import ast
import sys
from dotenv import load_dotenv
load_dotenv(dotenv_path=r"c:\apps\cloudfly\ai_scrum_team\.env")

# Force UTF-8 encoding for Windows terminals to support emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from langchain_community.utilities.jira import JiraAPIWrapper

def main():
    os.environ["JIRA_CLOUD"] = "True"
    
    print("Connecting to Jira...")
    try:
        wrapper = JiraAPIWrapper()
    except Exception as e:
        print(f"Error initializing Jira API Wrapper: {e}")
        return

    print("Fetching issues from project CLOUD...")
    try:
        # Fetch all issues for project CLOUD using LangChain wrapper's JQL tool
        res = wrapper.run("jql", "project = CLOUD")
    except Exception as e:
        print(f"Error running JQL query: {e}")
        return

    if not res:
        print("No response from Jira.")
        return

    # Extract the list representation
    match = re.search(r'\[.*\]', res, re.DOTALL)
    if not match:
        print("No issues parsed from response.")
        print("Raw response:", res)
        return

    try:
        issues = ast.literal_eval(match.group(0))
    except Exception as e:
        print(f"Error parsing issues array: {e}")
        return

    if not issues:
        print("No issues found in project CLOUD.")
        return

    # Categorize and count
    stats = {}
    pending_list = []
    completed_list = []
    
    for issue in issues:
        key = issue.get('key', 'Unknown')
        summary = issue.get('summary', 'No summary')
        status = issue.get('status', 'Unknown')
        
        stats[status] = stats.get(status, 0) + 1
        
        item = {
            "key": key,
            "summary": summary,
            "status": status
        }
        
        # In Spanish Jira, 'Finalizada' or 'Completada' means Done
        if status.lower() in ("done", "finalizada", "finalizado", "completada", "completado", "terminada", "terminado"):
            completed_list.append(item)
        else:
            pending_list.append(item)

    print("\n" + "="*50)
    print("ESTADISTICAS DE TAREAS JIRA - PROYECTO: CLOUD")
    print("="*50)
    print(f"Total Tareas Encontradas: {len(issues)}")
    print(f"Ejecutadas/Finalizadas (Done): {len(completed_list)}")
    print(f"Pendientes (En Curso, Por Hacer, etc.): {len(pending_list)}")
    print("-"*50)
    print("Distribucion por Estado:")
    for status, count in stats.items():
        print(f" - {status}: {count}")
    print("="*50)
    
    print("\nTAREAS PENDIENTES:")
    print("-" * 50)
    if pending_list:
        for idx, item in enumerate(pending_list, 1):
            print(f"{idx:02d}. [{item['key']}] - {item['summary']} (Estado: {item['status']})")
    else:
        print("No hay tareas pendientes.")
        
    print("\nTAREAS EJECUTADAS / COMPLETADAS:")
    print("-" * 50)
    if completed_list:
        for idx, item in enumerate(completed_list, 1):
            print(f"{idx:02d}. [{item['key']}] - {item['summary']} (Estado: {item['status']})")
    else:
        print("No hay tareas completadas todavia.")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
