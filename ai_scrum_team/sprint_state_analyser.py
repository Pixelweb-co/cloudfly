"""
Sprint State Analyser for AI Scrum Team.

Consults Jira to determine the current state of the sprint:
- In-progress issues (stories being actively worked on)
- Pending issues with subtasks (ready to start development)
- Clean backlog (nothing to do)

Uses JQL queries against the Jira API via the existing jira_wrapper.
"""

import os
from tools import jira_wrapper

# Status keywords that indicate a story is actively being worked on
IN_PROGRESS_KEYWORDS = [
    "in progress", "en curso", "desarrollo",
    "in review", "en revision", "en revisión",
    "en pruebas", "testing", "pruebas",
    "iniciada", "started", "assigned", "asignada",
]

# Status keywords that indicate a story is pending / ready to start
TODO_KEYWORDS = [
    "to do", "por hacer", "todo",
    "backlog", "abierto",
    "open", "reopened", "reabierto",
    "todo - in progress", "por hacer - en curso",
]


def _has_subtasks(issue_key: str) -> bool:
    """
    Checks whether a Jira issue has subtasks via the Jira API.
    Returns True if the issue has at least one subtask.
    """
    if not jira_wrapper or not hasattr(jira_wrapper, 'jira'):
        return False
    try:
        j_issue = jira_wrapper.jira.issue(issue_key, fields="subtasks")
        subtasks = j_issue.get("fields", {}).get("subtasks", [])
        return len(subtasks) > 0
    except Exception as e:
        print(f"[SprintState] Error verificando subtareas de {issue_key}: {e}")
        return False


def _get_issue_list(jql: str) -> list:
    """Execute a JQL query using jira_wrapper.run() and return the list of issues."""
    if not jira_wrapper or not hasattr(jira_wrapper, 'run'):
        return []
    try:
        result = jira_wrapper.run("jql", jql)
        if not result or "Found 0 issues" in str(result):
            return []
        import re, ast
        # Extract the list part (enclosed in brackets [ ... ])
        match = re.search(r'\[.*\]', str(result), re.DOTALL)
        if not match:
            return []
        issues = ast.literal_eval(match.group(0))
        return issues
    except Exception as e:
        print(f"[SprintState] Error en JQL '{jql}': {e}")
        return []


def get_in_progress_issues() -> list:
    """
    Returns Jira issues that are currently 'In Progress' (or equivalent status).
    These are stories being actively worked on — the team should RESUME them.
    """
    keyword_filters = " OR ".join(
        [f'status="{kw}"' for kw in IN_PROGRESS_KEYWORDS]
    )
    jql = f'project = CLOUD AND ({keyword_filters}) AND created >= -30d ORDER BY updated DESC'
    issues = _get_issue_list(jql)
    if issues:
        print(f"[SprintState] 🔄 {len(issues)} historia(s) EN CURSO detectada(s).")
    return issues


def get_pending_issues_with_tasks() -> list:
    """
    Returns Jira issues in 'To Do' status that already have subtasks created.
    Filters the pending issues by checking subtasks via the Jira API (subtasks > 0).
    """
    keyword_filters = " OR ".join(
        [f'status="{kw}"' for kw in TODO_KEYWORDS]
    )
    jql = f'project = CLOUD AND ({keyword_filters}) AND issuetype != Subtask ORDER BY created ASC'
    all_pending = _get_issue_list(jql)

    # Filter: keep only issues that actually have subtasks (checked via API)
    with_tasks = []
    for issue in all_pending:
        key = issue.get("key", "")
        if key and _has_subtasks(key):
            with_tasks.append(issue)

    if with_tasks:
        print(f"[SprintState] 📋 {len(with_tasks)} historia(s) con tareas detectada(s).")
    return with_tasks


def get_pending_issues_without_tasks() -> list:
    """
    Returns Jira issues in 'To Do' status WITHOUT subtasks.
    These are stories the PO has not yet decomposed into tasks.
    """
    keyword_filters = " OR ".join(
        [f'status="{kw}"' for kw in TODO_KEYWORDS]
    )
    jql = f'project = CLOUD AND ({keyword_filters}) AND issuetype != Subtask ORDER BY created ASC'
    all_pending = _get_issue_list(jql)

    # Filter: keep only issues WITHOUT subtasks
    without_tasks = []
    for issue in all_pending:
        key = issue.get("key", "")
        if key and not _has_subtasks(key):
            without_tasks.append(issue)

    return without_tasks


def get_issue_resume_context(issue_key: str) -> dict:
    """
    Fetches a single issue's details for resumption context.
    Returns a dict with summary, description, status, and comment history.
    """
    if not jira_wrapper or not hasattr(jira_wrapper, 'jira'):
        return {}
    try:
        j_issue = jira_wrapper.jira.issue(issue_key)
        fields = j_issue.get("fields", {})
        comments = fields.get("comment", {}).get("comments", [])
        comment_history = []
        for c in comments:
            author = c.get("author", {}).get("displayName", "Unknown")
            body = c.get("body", "")
            comment_history.append(f"[{author}]: {body}")

        return {
            "key": issue_key,
            "summary": fields.get("summary", ""),
            "description": fields.get("description", ""),
            "status": fields.get("status", {}).get("name", ""),
            "comments": comment_history,
        }
    except Exception as e:
        print(f"[SprintState] Error obteniendo contexto de {issue_key}: {e}")
        return {}


def analyse_sprint_state() -> dict:
    """
    Main analysis function. Returns a dict with the sprint state:
    {
        "state": "in_progress" | "pending_with_tasks" | "clean",
        "issues": [...],   # list of relevant Jira issues
        "resume_context": {...}  # detailed context for in-progress issues
    }
    """
    print("\n[🤖 Scrum Master]: Analizando estado del sprint en Jira...")

    # 1. Check for in-progress issues first
    in_progress = get_in_progress_issues()
    if in_progress:
        resume_context = {}
        for issue in in_progress:
            key = issue.get("key", "")
            if key:
                resume_context[key] = get_issue_resume_context(key)
        return {
            "state": "in_progress",
            "issues": in_progress,
            "resume_context": resume_context,
        }

    # 2. Check for pending issues with subtasks
    pending_with_tasks = get_pending_issues_with_tasks()
    if pending_with_tasks:
        return {
            "state": "pending_with_tasks",
            "issues": pending_with_tasks,
            "resume_context": {},
        }

    # 3. Check for pending issues without subtasks (raw PO input)
    pending_no_tasks = get_pending_issues_without_tasks()
    if pending_no_tasks:
        return {
            "state": "pending_with_tasks",
            "issues": pending_no_tasks,
            "resume_context": {},
        }

    # 4. Clean backlog
    print("[SprintState] ✅ Backlog limpio. No hay historias pendientes.")
    return {
        "state": "clean",
        "issues": [],
        "resume_context": {},
    }
