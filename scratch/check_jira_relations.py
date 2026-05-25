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
    # 1. Fetch recent issues in project CLOUD using JQL
    res = jira_api.run("jql", "project = CLOUD ORDER BY created DESC")
    
    # 2. Extract the list using regex
    match = re.search(r'\[.*\]', res, re.DOTALL)
    if not match:
        print("No issues found in JQL response.")
        sys.exit(0)
        
    issues_list = ast.literal_eval(match.group(0))
    print(f"Total issues found: {len(issues_list)}")
    
    print("\n🔍 ANALYZING JIRA ISSUES RELATIONSHIPS:")
    print("==================================================")
    
    for item in issues_list[:30]: # Look at the 30 most recent issues
        key = item.get("key")
        summary = item.get("summary")
        status = item.get("status")
        
        # Now fetch full issue details using native jira wrapper (which supports raw dictionary fields)
        try:
            issue_data = jira_api.jira.issue(key)
            fields = issue_data.get("fields", {})
            description = fields.get("description") or ""
            
            # Check for parent / subtask relationship
            parent = fields.get("parent")
            parent_key = parent.get("key") if parent else None
            
            subtasks = fields.get("subtasks", [])
            subtask_keys = [s.get("key") for s in subtasks] if subtasks else []
            
            # Check for issue links
            links = fields.get("issuelinks", [])
            link_details = []
            for link in links:
                if "outwardIssue" in link:
                    out_key = link["outwardIssue"]["key"]
                    l_type = link["type"]["outward"]
                    link_details.append(f"links to -> {out_key} ({l_type})")
                elif "inwardIssue" in link:
                    in_key = link["inwardIssue"]["key"]
                    l_type = link["type"]["inward"]
                    link_details.append(f"linked from <- {in_key} ({l_type})")
            
            print(f"📌 {key} | {summary}")
            print(f"   Status: {status}")
            if parent_key:
                print(f"   ⚠️ Parent Task: {parent_key}")
            if subtask_keys:
                print(f"   ⚠️ Subtasks: {', '.join(subtask_keys)}")
            if link_details:
                for ld in link_details:
                    print(f"   ⚠️ Relation: {ld}")
                    
            # Check description or summary for references to older tickets
            mentions = re.findall(r'CLOUD-\d+', description + " " + summary)
            mentions = [m for m in mentions if m != key]
            if mentions:
                print(f"   ⚠️ Mentioned tickets in desc/summary: {', '.join(set(mentions))}")
                
            print("-" * 50)
            
        except Exception as issue_err:
            print(f"Error fetching detail for {key}: {issue_err}")
            
except Exception as e:
    print("General error:", e)
