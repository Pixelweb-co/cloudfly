import os, json, requests
from dotenv import load_dotenv
load_dotenv(dotenv_path=r'c:\apps\cloudfly\.env')

base_url = os.getenv('JIRA_API_URL')
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = (email, token)
headers = {"Accept": "application/json", "Content-Type": "application/json"}

# 1. Get CLOUD-191 details
print("=== CLOUD-191 ===")
r = requests.get(f"{base_url}/rest/api/3/issue/CLOUD-191", auth=auth, headers=headers, timeout=15)
if r.status_code == 200:
    d = r.json()
    f = d.get('fields', {})
    print(f"Summary: {f.get('summary')}")
    print(f"Status: {f.get('status', {}).get('name')}")
    print(f"Type: {f.get('issuetype', {}).get('name')}")
    # Get subtasks
    subtasks = f.get('subtasks', [])
    print(f"Subtasks: {len(subtasks)}")
    for st in subtasks:
        print(f"  {st['key']}: {st['fields']['summary']} [{st['fields']['status']['name']}]")
    # Get parent
    parent = f.get('parent', {})
    if parent:
        print(f"Parent: {parent.get('key')} - {parent['fields'].get('summary', '')}")
else:
    print(f"Error: {r.status_code} - {r.text[:300]}")

# 2. Get ALL issues in CLOUD project
print("\n=== ALL CLOUD Issues ===")
r = requests.post(
    f"{base_url}/rest/api/3/search/jql",
    json={"jql": "project = CLOUD ORDER BY created DESC", "maxResults": 100, "fields": ["summary", "status", "issuetype", "parent"]},
    auth=auth, headers=headers, timeout=15
)
if r.status_code == 200:
    d = r.json()
    print(f"Total: {d.get('total', 0)}")
    for issue in d.get('issues', []):
        f = issue['fields']
        itype = f.get('issuetype', {}).get('name', '?')
        status = f.get('status', {}).get('name', '?')
        parent = f.get('parent', {})
        parent_key = parent.get('key', '') if parent else ''
        print(f"  {issue['key']:10} [{itype:12}] {status:20} {parent_key:10} {f['summary'][:60]}")
else:
    print(f"Error: {r.status_code} - {r.text[:300]}")
