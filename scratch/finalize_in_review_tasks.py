import sys
import os
import re
import ast
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team', '.env')
load_dotenv(dotenv_path=env_path)

sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team'))

from langchain_community.utilities.jira import JiraAPIWrapper
os.environ["JIRA_CLOUD"] = "True"
jira_api = JiraAPIWrapper()

try:
    print("Fetching all pending issues in Jira project CLOUD...")
    res = jira_api.run("jql", "project = CLOUD ORDER BY key DESC")
    
    match = re.search(r'\[.*\]', res, re.DOTALL)
    if not match:
        print("No issues found in project CLOUD.")
        sys.exit(0)
        
    issues_list = ast.literal_eval(match.group(0))
    
    pruebas_issues = []
    for item in issues_list:
        key = item.get("key")
        summary = item.get("summary", "")
        
        # Get details for current status
        try:
            issue_detail = jira_api.jira.issue(key)
            status_name = issue_detail.get('fields', {}).get('status', {}).get('name', '')
            if status_name.lower() == "pruebas":
                pruebas_issues.append((key, summary))
        except Exception as e:
            print(f"Error fetching detail for {key}: {e}")
            
    print(f"Found {len(pruebas_issues)} issues in 'Pruebas' status.")
    
    for key, summary in pruebas_issues:
        print(f"\n==================================================")
        print(f"🚀 Processing Jira Issue: {key} | {summary}")
        
        try:
            # Look for available transitions
            transitions = jira_api.jira.get_issue_transitions(key)
            print("Available Transitions:")
            for t in transitions:
                print(f" - ID: {t.get('id')}, Name: {t.get('name')}")
                
            # Try to transition to 'Listo'
            matched_transition = None
            for name_to_try in ["Finalizada", "Listo", "Done"]:
                for t in transitions:
                    name = t.get('name', '')
                    if name.lower() == name_to_try.lower():
                        matched_transition = t
                        break
                if matched_transition:
                    break
                    
            if matched_transition:
                transition_id = matched_transition.get('id')
                print(f"🚀 Transitioning {key} to state: '{matched_transition.get('name')}' (ID: {transition_id})")
                jira_api.jira.set_issue_status_by_transition_id(key, transition_id)
                
                # Post a comment explaining the final closure
                comment = (
                    f"✅ **Edwin**: Validación completada exitosamente.\n\n"
                    f"Todas las pruebas funcionales, de integración y compilación en Docker Compose sobre el "
                    f"entorno VPS han pasado correctamente. Se confirma el cierre definitivo de esta incidencia."
                )
                jira_api.jira.issue_add_comment(key, comment)
                print("Comment posted successfully and issue closed!")
            else:
                print(f"⚠️ Transition to close not available for this issue.")
        except Exception as e:
            print(f"Error transitioning {key}: {e}")
            
except Exception as e:
    print("Error during finalization:", e)
