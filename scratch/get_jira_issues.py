import sys
import os
from dotenv import load_dotenv

# Reconfigure stdout for UTF-8 to prevent cp1252 errors on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Load the environment variables from ai_scrum_team/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team', '.env')
load_dotenv(dotenv_path=env_path)

# Adjust path to import from ai_scrum_team
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team'))

from tools import jira_wrapper

keys = [
    'CLOUD-100', 'CLOUD-99', 'CLOUD-98', 'CLOUD-97', 'CLOUD-96',
    'CLOUD-95', 'CLOUD-94', 'CLOUD-93', 'CLOUD-92', 'CLOUD-91',
    'CLOUD-90', 'CLOUD-89', 'CLOUD-88', 'CLOUD-87'
]

# Reinitialize JiraAPIWrapper to use the loaded environment variables
from langchain_community.utilities.jira import JiraAPIWrapper
os.environ["JIRA_CLOUD"] = "True"
jira_api = JiraAPIWrapper()

for key in keys:
    print(f"==================================================")
    print(f"🔑 Issue: {key}")
    print(f"==================================================")
    try:
        issue = jira_api.jira.issue(key)
        fields = issue.get("fields", {})
        summary = fields.get("summary") or "No summary"
        description = fields.get("description") or "No description"
        status = fields.get("status", {}).get("name") or "No status"
        print(f"Summary: {summary}")
        print(f"Status: {status}")
        print(f"Description:\n{description}")
        
        comments = fields.get("comment", {}).get("comments", [])
        if comments:
            print("Comments:")
            for c in comments:
                author = c.get("author", {}).get("displayName", "Unknown")
                body = c.get("body", "")
                print(f" - [{author}]: {body}")
    except Exception as e:
        print(f"Error fetching {key}: {e}")
    print("\n")
