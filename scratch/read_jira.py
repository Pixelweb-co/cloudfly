import sys
import os

# Set output encoding to UTF-8
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add ai_scrum_team to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team')))

from tools import jira_wrapper

if __name__ == "__main__":
    print("Fetching recent Jira issues in project CLOUD...")
    if jira_wrapper:
        # Run JQL query to list last 15 issues
        res = jira_wrapper.run("jql", "project = CLOUD ORDER BY created DESC")
        print(res)
    else:
        print("Jira wrapper not initialized.")
