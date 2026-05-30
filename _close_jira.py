import os, json, requests
from dotenv import load_dotenv
load_dotenv(dotenv_path=r'c:\apps\cloudfly\.env')

base_url = os.getenv('JIRA_API_URL')
email = os.getenv('JIRA_EMAIL')
token = os.getenv('JIRA_API_TOKEN')
auth = (email, token)
headers = {"Accept": "application/json", "Content-Type": "application/json"}

# Get available transitions for CLOUD-191
print("=== Transitions for CLOUD-191 ===")
r = requests.get(f"{base_url}/rest/api/3/issue/CLOUD-191/transitions", auth=auth, headers=headers, timeout=15)
print(f"Status: {r.status_code}")
if r.status_code == 200:
    for t in r.json().get('transactions', []):
        print(f"  ID: {t['id']}, Name: {t['name']}")

# Transition CLOUD-191 to Finalizada
print("\n=== Moving CLOUD-191 to Finalizada ===")
# Try common transition names
for transition_name in ["Finalizada", "Done", "Hecho", "Cerrada", "Closed"]:
    r = requests.post(
        f"{base_url}/rest/api/3/issue/CLOUD-191/transitions",
        json={"transition": {"name": transition_name}},
        auth=auth, headers=headers, timeout=15
    )
    if r.status_code == 204:
        print(f"SUCCESS - Transitioned to '{transition_name}'")
        break
    else:
        print(f"  Failed '{transition_name}': {r.status_code} {r.text[:100]}")
