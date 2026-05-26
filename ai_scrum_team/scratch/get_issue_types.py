import os
import sys
from dotenv import load_dotenv
sys.path.append('ai_scrum_team')
load_dotenv('ai_scrum_team/.env')
os.environ['JIRA_CLOUD'] = 'True'
from tools import jira_wrapper

if not jira_wrapper or not hasattr(jira_wrapper, 'jira'):
    print("Jira wrapper not configured.")
    sys.exit(1)

try:
    print("Getting issue types...")
    issue_types = jira_wrapper.jira.get_issue_types()
    for it in issue_types:
        print(f"Name: {it.get('name')}, ID: {it.get('id')}")
except Exception as e:
    print("Error:", e)
