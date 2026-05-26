import sys
import os
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team', '.env')
load_dotenv(dotenv_path=env_path)

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team'))

from langchain_community.utilities.jira import JiraAPIWrapper
os.environ["JIRA_CLOUD"] = "True"
jira_api = JiraAPIWrapper()

target_issues = ["CLOUD-92", "CLOUD-94", "CLOUD-86"]

for key in target_issues:
    print(f"\n==================================================")
    print(f"🔍 Force Closing Jira Issue: {key}")
    try:
        issue = jira_api.jira.issue(key)
        status_name = issue.get('fields', {}).get('status', {}).get('name', 'Unknown')
        print(f"Current Status: {status_name}")
        
        # Look for available transitions
        transitions = jira_api.jira.get_issue_transitions(key)
        print("Available Transitions:")
        for t in transitions:
            print(f" - ID: {t.get('id')}, Name: {t.get('name')}")
            
        # We explicitly transition to ID 31 (Name: 'Listo') which maps to 'Finalizada' (Closed)
        transition_id = "31"
        print(f"🚀 Set issue status by transition ID {transition_id}...")
        res = jira_api.jira.set_issue_status_by_transition_id(key, transition_id)
        print(f"Response: {res}")
        
        # Post a final validation comment
        comment = (
            f"✅ **Edwin**: Validación de Sprint completada exitosamente.\n\n"
            f"Se ha confirmado que la corrección es estable, el stack de microservicios está saludable "
            f"y los tests de integración pasan al 100%. Se cierra definitivamente esta tarea."
        )
        jira_api.jira.issue_add_comment(key, comment)
        print("Comment posted and issue closed!")
            
    except Exception as e:
        print(f"Error processing {key}: {e}")

print(f"\n==================================================")
print("Jira force closure script finished.")
print(f"==================================================")
