import sys
import os
import re
import ast
from dotenv import load_dotenv

# Reconfigure stdout for UTF-8 to prevent cp1252 errors on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Load the environment variables from ai_scrum_team/.env
env_path = os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team', '.env')
load_dotenv(dotenv_path=env_path)

# Adjust path to import from ai_scrum_team
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai_scrum_team'))

from langchain_community.utilities.jira import JiraAPIWrapper
os.environ["JIRA_CLOUD"] = "True"
jira_api = JiraAPIWrapper()

try:
    # 1. Search for all issues in project CLOUD
    print("Searching for issues in Jira...")
    res = jira_api.run("jql", "project = CLOUD AND summary ~ 'Test Issue' ORDER BY key DESC")
    
    # 2. Extract the list using regex
    match = re.search(r'\[.*\]', res, re.DOTALL)
    if not match:
        print("No dummy issues found to delete.")
        sys.exit(0)
        
    issues_list = ast.literal_eval(match.group(0))
    print(f"Found {len(issues_list)} potential dummy issues to delete.")
    
    deleted_count = 0
    for item in issues_list:
        key = item.get("key")
        summary = item.get("summary")
        
        # Double check that the summary is exactly "Test Issue" to prevent deleting real tickets
        if summary.strip().lower() == "test issue":
            print(f"🗑️ Deleting dummy issue: {key} | {summary}")
            try:
                # Use raw jira client to delete the issue
                jira_api.jira.delete_issue(key)
                deleted_count += 1
            except Exception as delete_err:
                print(f"Error deleting {key}: {delete_err}")
                
    print(f"\n==================================================")
    print(f"✅ CLEANUP COMPLETE: Successfully deleted {deleted_count} dummy tickets!")
    print(f"==================================================")
    
except Exception as e:
    print("Error during cleanup:", e)
