import os
import sys
from dotenv import load_dotenv
load_dotenv(dotenv_path=r"c:\apps\cloudfly\ai_scrum_team\.env")

from langchain_community.utilities.jira import JiraAPIWrapper

def main():
    os.environ["JIRA_CLOUD"] = "True"
    jira_api = JiraAPIWrapper()
    try:
        issue = jira_api.jira.issue("CLOUD-147")
        print("Summary:", issue.get("fields", {}).get("summary"))
        print("Description:", issue.get("fields", {}).get("description"))
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    main()
