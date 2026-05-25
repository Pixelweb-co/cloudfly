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
    print("Searching for orphaned or junk test issues in Jira project CLOUD...")
    # Search for all issues in project CLOUD containing 'Test Issue' or summary ~ 'Test Issue'
    res = jira_api.run("jql", "project = CLOUD AND (summary ~ 'Test Issue' OR summary ~ 'Test' OR summary ~ 'Junk') ORDER BY key DESC")
    
    match = re.search(r'\[.*\]', res, re.DOTALL)
    if not match:
        print("No junk issues found.")
        sys.exit(0)
        
    issues_list = ast.literal_eval(match.group(0))
    print(f"Found {len(issues_list)} potential match issues.")
    
    deleted_count = 0
    for item in issues_list:
        key = item.get("key")
        summary = item.get("summary", "")
        
        # We only delete if it's exactly "Test Issue" or highly generic "Test Issue" variants
        is_junk = False
        if summary.strip().lower() == "test issue":
            is_junk = True
        elif summary.strip().lower() == "test":
            is_junk = True
        elif "junk" in summary.strip().lower():
            is_junk = True
            
        if is_junk:
            print(f"🗑️ Deleting orphaned junk issue: {key} | {summary}")
            try:
                jira_api.jira.delete_issue(key)
                deleted_count += 1
            except Exception as delete_err:
                print(f"Error deleting {key}: {delete_err}")
                
    print(f"\n==================================================")
    print(f"✅ CLEANUP COMPLETE: Successfully deleted {deleted_count} orphaned test issues!")
    print(f"==================================================")
    
except Exception as e:
    print("Error during cleanup:", e)
