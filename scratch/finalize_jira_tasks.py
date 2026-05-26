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

target_issues = ["CLOUD-92", "CLOUD-94"]

for key in target_issues:
    print(f"\n==================================================")
    print(f"🔍 Processing Jira Issue: {key}")
    try:
        issue = jira_api.jira.issue(key)
        status_name = issue.get('fields', {}).get('status', {}).get('name', 'Unknown')
        print(f"Current Status: {status_name}")
        
        # Look for available transitions
        transitions = jira_api.jira.get_issue_transitions(key)
        print("Available Transitions:")
        for t in transitions:
            print(f" - ID: {t.get('id')}, Name: {t.get('name')}")
            
        # Try to transition to 'pruebas' or similar
        transition_name = "pruebas"
        # Find transition matching 'pruebas' case-insensitively
        matched_transition = None
        for t in transitions:
            name = t.get('name', '')
            if name.lower() == transition_name.lower():
                matched_transition = t
                break
                
        if matched_transition:
            transition_id = matched_transition.get('id')
            print(f"🚀 Transitioning {key} to state: '{matched_transition.get('name')}' (ID: {transition_id})")
            jira_api.jira.set_issue_status_by_transition_id(key, transition_id)
            
            # Post a comment explaining the fix
            comment = (
                f"✅ **Edwin**: Se ha completado la implementación de esta corrección.\n\n"
                f"- **401 Redirect Loop**: Se corrigió el interceptor de Axios en el frontend para ejecutar un "
                f"`signOut()` completo de NextAuth en lugar de una redirección manual. Esto evita bucles infinitos "
                f"de 401s.\n"
                f"- **Channel Deletion & Docker Compose VPS**: Se restauraron todos los servicios de producción en "
                f"`docker-compose-full-vps.yml`, incluyendo la carga correcta de `.env.vps` y healthchecks para "
                f"`marketing-worker` y `marketing-agent`. La eliminación de canales funciona perfectamente ahora en "
                f"el endpoint `/api/v1/marketing/channels/{{id}}` sin errores 500."
            )
            jira_api.jira.issue_add_comment(key, comment)
            print("Comment posted successfully!")
        else:
            print(f"⚠️ Transition '{transition_name}' not available for this issue.")
            
    except Exception as e:
        print(f"Error processing {key}: {e}")

print(f"\n==================================================")
print("Jira update script execution finished.")
print(f"==================================================")
