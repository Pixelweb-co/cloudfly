import httpx
import os
from typing import List, Optional
from cache import get_cache
from cachetools import cached

class JIRAClient:
    def __init__(self):
        self.base_url = os.getenv("JIRA_URL")
        self.auth = (os.getenv("JIRA_USER"), os.getenv("JIRA_TOKEN"))
        self.client = httpx.AsyncClient(base_url=self.base_url, auth=self.auth)

    @cached(cache=get_cache())
    async def fetch_pending_tickets(
        self,
        project: Optional[str],
        assignee: Optional[str],
        limit: int
    ) -> List[dict]:
        jql = "status = Pendiente"
        if project:
            jql += f" AND project = {project}"
        if assignee:
            jql += f" AND assignee = {assignee}"
        params = {"jql": jql, "maxResults": limit, "fields": "summary,status,assignee,created,updated"}
        resp = await self.client.get("/rest/api/3/search", params=params)
        resp.raise_for_status()
        data = resp.json()
        tickets = []
        for issue in data.get("issues", []):
            fields = issue.get("fields", {})
            tickets.append({
                "id": issue.get("key"),
                "summary": fields.get("summary"),
                "status": fields.get("status", {}).get("name"),
                "assignee": fields.get("assignee", {}).get("displayName") if fields.get("assignee") else None,
                "created": fields.get("created"),
                "updated": fields.get("updated"),
                "url": f"{self.base_url}/browse/{issue.get('key')}"
            })
        return tickets
