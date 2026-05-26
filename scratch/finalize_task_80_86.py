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

target_issues = ["CLOUD-80", "CLOUD-86"]

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
            
        # Try to transition to 'Listo' or 'Finalizada'
        # We look for 'Listo', 'Finalizada', 'Done' or similar
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
            
            # Post a comment explaining the completion
            comment = (
                f"✅ **Edwin**: Se ha completado el despliegue y configuración.\n\n"
                f"- **CLOUD-80 (Marketing en VPS)**: Los servicios `marketing-worker` y `marketing-agent` han sido "
                f"completamente desplegados y configurados en el Docker Compose del VPS, utilizando la inyección "
                f"adecuada de variables con `.env.vps` y cargando los healthchecks correctos.\n"
                f"- **CLOUD-86 (Credenciales de Facebook)**: La integración de credenciales para la API App de "
                f"Facebook/Meta ha sido completamente integrada en la base de datos, el backend y el dashboard de "
                f"administración en el frontend."
            )
            jira_api.jira.issue_add_comment(key, comment)
            print("Comment posted successfully!")
        else:
            print(f"⚠️ Transition to close not available for this issue.")
            
    except Exception as e:
        print(f"Error processing {key}: {e}")

print(f"\n==================================================")
print("Jira update script execution finished.")
print(f"==================================================")
