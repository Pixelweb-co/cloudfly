import os
import sys
from dotenv import load_dotenv
load_dotenv(dotenv_path=r"c:\apps\cloudfly\ai_scrum_team\.env")

# Force UTF-8 encoding for Windows terminal
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from langchain_community.utilities.jira import JiraAPIWrapper

def main():
    os.environ["JIRA_CLOUD"] = "True"
    jira_api = JiraAPIWrapper()
    try:
        issue = jira_api.jira.issue("CLOUD-158")
        fields = issue.get("fields", {})
        print("Summary:", fields.get("summary"))
        comments = fields.get("comment", {}).get("comments", [])
        print("Comments count:", len(comments))
        for idx, c in enumerate(comments, 1):
            author = c.get("author", {}).get("displayName", "Unknown")
            body = c.get("body", "")
            print(f"[{idx}] {author}: {body}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
