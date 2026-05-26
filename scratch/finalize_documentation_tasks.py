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

target_issues = ["CLOUD-83", "CLOUD-82"]

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
                f"✅ **Edwin**: Se ha completado e incorporado toda la documentación técnica correspondiente en el repositorio.\n\n"
                f"- **CLOUD-83 (Documentación API Meta)**: Toda la documentación para los endpoints de Meta Ads ha sido "
                f"creada exitosamente en la carpeta `docs/` con las referencias técnicas de arquitectura y API.\n"
                f"- **CLOUD-82 (README de Marketing Agent)**: El README de `marketing_agent/` ha sido actualizado detalladamente "
                f"con las especificaciones y flujos de integración del agente con la API de Facebook."
            )
            jira_api.jira.issue_add_comment(key, comment)
            print("Comment posted successfully!")
        else:
            print(f"⚠️ Transition to close not available for this issue.")
            
    except Exception as e:
        print(f"Error processing {key}: {e}")

print(f"\n==================================================")
print("Jira documentation update script execution finished.")
print(f"==================================================")
