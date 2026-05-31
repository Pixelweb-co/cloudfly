import os
import json
import subprocess
import threading
import time
import sys
from typing import Type, List, Dict, Any
from crewai.tools import BaseTool, tool
from langchain_community.utilities.jira import JiraAPIWrapper

# Ensure JIRA_CLOUD is set for the API Wrapper
os.environ["JIRA_CLOUD"] = "True"

# ── Background Process Registry ────────────────────────────────────────
# Shared registry for tracking background commands across tool calls.
# Key: PID (int), Value: dict with process info
_bg_process_registry: Dict[int, dict] = {}
_bg_registry_lock = threading.Lock()

def _register_bg_process(pid: int, proc: subprocess.Popen, command: str):
    """Register a background process in the shared registry."""
    with _bg_registry_lock:
        _bg_process_registry[pid] = {
            "process": proc,
            "command": command,
            "output": [],
            "done": False,
            "exit_code": None,
            "start_time": time.time()
        }

def _update_bg_output(pid: int, line: str):
    """Append output line to a background process."""
    with _bg_registry_lock:
        if pid in _bg_process_registry:
            _bg_process_registry[pid]["output"].append(line)

def _mark_bg_done(pid: int, exit_code: int):
    """Mark a background process as completed."""
    with _bg_registry_lock:
        if pid in _bg_process_registry:
            _bg_process_registry[pid]["done"] = True
            _bg_process_registry[pid]["exit_code"] = exit_code

def _get_bg_task(pid: int) -> dict:
    """Get a background task by PID."""
    with _bg_registry_lock:
        return _bg_process_registry.get(pid)

def _remove_bg_task(pid: int):
    """Remove a completed task from the registry."""
    with _bg_registry_lock:
        _bg_process_registry.pop(pid, None)

def _get_all_bg_pids() -> list:
    """Get list of all tracked PIDs."""
    with _bg_registry_lock:
        return list(_bg_process_registry.keys())


# Initialize the wrapper globally so tools can use it
try:
    jira_wrapper = JiraAPIWrapper()
except Exception as e:
    print(f"Warning: Failed to initialize Jira API Wrapper. {e}")
    jira_wrapper = None

@tool("JQL Query Tool")
def jql_query(query: str) -> str:
    """Useful for running a JQL query in Jira. 
    Input should be a valid JQL string."""
    if not jira_wrapper:
        return "Jira is not configured."
    return jira_wrapper.run("jql", query)

@tool("Create Jira Issue")
def create_issue(summary: str, description: str, project_key: str = "CLOUD", issue_type: str = "Task", parent_key: str = "") -> str:
    """
    Create a new Jira issue (Task, Sub-task, Bug).
    :param summary: Title of the issue.
    :param description: Detailed description of the issue.
    :param project_key: The Jira project key (default: CLOUD).
    :param issue_type: The type of issue (e.g., Task, Sub-task, Bug).
    :param parent_key: ONLY use this if issue_type is 'Sub-task'. Pass the ID of the parent Task/Epic (e.g., 'CLOUD-12').
    """
    if not jira_wrapper:
        return "Jira is not configured."
    import json
    
    # Map standard English issue types to Spanish equivalents for localized Jira instances
    issue_type_lower = issue_type.lower()
    if "sub-task" in issue_type_lower or "subtask" in issue_type_lower or "subtarea" in issue_type_lower:
        mapped_issue_type = "Subtarea"
    elif "task" in issue_type_lower or "tarea" in issue_type_lower:
        mapped_issue_type = "Tarea"
    elif "bug" in issue_type_lower or "error" in issue_type_lower or "defecto" in issue_type_lower:
        mapped_issue_type = "Error"
    elif "story" in issue_type_lower or "historia" in issue_type_lower:
        mapped_issue_type = "Historia"
    elif "epic" in issue_type_lower or "épica" in issue_type_lower:
        mapped_issue_type = "Epic"
    else:
        mapped_issue_type = issue_type # Fallback
        
    payload = {
        "summary": summary,
        "description": description,
        "project": {"key": project_key},
        "issuetype": {"name": mapped_issue_type}
    }
    if mapped_issue_type == "Subtarea" and parent_key:
        payload["parent"] = {"key": parent_key}
        
    return jira_wrapper.run("create_issue", json.dumps(payload, ensure_ascii=False))

@tool("Get Jira Projects")
def get_projects(query: str = "all") -> str:
    """Get a list of Jira projects."""
    if not jira_wrapper:
        return "Jira is not configured."
    return jira_wrapper.run("get_projects", query)

@tool("Comment on Jira Issue")
def comment_issue(issue_key: str, comment: str) -> str:
    """
    Add a comment to an existing Jira issue.
    :param issue_key: The exact Jira issue key (e.g., 'CLOUD-14'). DO NOT invent keys.
    :param comment: The text you want to post.
    """
    if not jira_wrapper or not hasattr(jira_wrapper, 'jira'):
        return "Jira is not configured."
    try:
        jira_wrapper.jira.issue_add_comment(issue_key, comment)
        return f"Successfully added comment to {issue_key}"
    except Exception as e:
        return f"Error adding comment: {str(e)}"

@tool("Transition Jira Issue")
def transition_issue(issue_key: str, status: str) -> str:
    """
    Change the status of a Jira issue (e.g., 'In Progress', 'Done', 'To Do').
    :param issue_key: The exact Jira issue key (e.g., 'CLOUD-14'). DO NOT invent keys.
    :param status: The new status string.
    """
    if not jira_wrapper or not hasattr(jira_wrapper, 'jira'):
        return "Jira is not configured."
    try:
        # Get available transitions dynamically from Jira Cloud
        transitions = jira_wrapper.jira.get_issue_transitions(issue_key)
        
        status_lower = status.lower()
        transition_id = None
        
        # Multilingual mapping for standard Jira transition statuses
        match_keywords = []
        if any(w in status_lower for w in ["done", "listo", "finalizada", "cerrada", "cerrar", "terminar"]):
            match_keywords = ["listo", "finalizada", "done", "closed", "resolved", "finalizado"]
        elif any(w in status_lower for w in ["progress", "curso", "desarrollo"]):
            match_keywords = ["curso", "progress", "in progress", "en curso"]
        elif any(w in status_lower for w in ["todo", "por hacer", "backlog", "abierto"]):
            match_keywords = ["por hacer", "todo", "to do", "tareas por hacer"]
        elif any(w in status_lower for w in ["review", "revision", "revisión", "pruebas", "test", "validar"]):
            match_keywords = ["pruebas", "review", "in review", "en pruebas", "validación", "testing"]
            
        # 1. Search using keywords mapping
        if match_keywords:
            for t in transitions:
                t_name = str(t.get('name', '')).lower()
                t_to = str(t.get('to', '')).lower()
                if any(k in t_name or k in t_to for k in match_keywords):
                    transition_id = t.get('id')
                    break
                    
        # 2. Substring fallback match if no keyword match
        if not transition_id:
            for t in transitions:
                t_name = str(t.get('name', '')).lower()
                t_to = str(t.get('to', '')).lower()
                if status_lower in t_name or status_lower in t_to:
                    transition_id = t.get('id')
                    break
                    
        # 3. Last fallback: use first transition in the list if nothing matched
        if not transition_id and transitions:
            transition_id = transitions[0].get('id')
            
        if transition_id is not None:
            # Perform transition by ID to satisfy Jira Cloud workflows
            jira_wrapper.jira.set_issue_status_by_transition_id(issue_key, transition_id)
            return f"Successfully transitioned {issue_key} using transition ID {transition_id} to status '{status}'"
        else:
            return f"Failed to transition {issue_key}: No matching transition found for status '{status}'."
            
    except Exception as e:
        return f"Error transitioning issue: {str(e)}"

@tool("Write Code To File")
def write_code_to_file(content: str, filepath: str = "generated_code.txt") -> str:
    """
    Saves generated code to a physical file inside the CloudFly workspace directory.
    :param content: The exact source code, configuration, or content to write. Must contain the complete file contents.
    :param filepath: The relative target filepath (e.g. 'developmentAI/docker-compose.yml' or 'marketing-worker/src/...'). Defaults to 'generated_code.txt'. DO NOT use absolute paths.
    """
    import os
    import re
    
    # Strip hallucinated absolute paths to force relativity
    filepath = re.sub(r'^(/home/[^/]+/|/app/|c:/|/|\\)', '', filepath, flags=re.IGNORECASE)
    
    base_dir = r"C:\apps\cloudfly"
    target_path = os.path.abspath(os.path.join(base_dir, filepath))
    
    if not target_path.startswith(base_dir):
        return f"Error: {target_path} is outside CloudFly directory. Use relative paths."
        
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(content)
    return f"Success! Code saved to {target_path}"

@tool("Docker Management Tool")
def docker_manage(action: str = "up") -> str:
    """
    Manages the local Docker environment for the application.
    :param action: Action to perform: 'up' (starts the app), 'down' (stops the app), 'status' (shows running containers).
    """
    import subprocess
    import os
    base_dir = r"C:\apps\cloudfly"
    
    if action == "up":
        cmd = ["docker-compose", "up", "--build", "-d"]
    elif action == "down":
        cmd = ["docker-compose", "down"]
    elif action == "status":
        cmd = ["docker-compose", "ps"]
    else:
        return "Invalid action. Use 'up', 'down', or 'status'."
        
    try:
        result = subprocess.run(cmd, cwd=base_dir, capture_output=True, encoding='utf-8', errors='replace', check=True)
        return f"Success:\n{result.stdout}\n{result.stderr}"
    except subprocess.CalledProcessError as e:
        return f"Error executing docker-compose {action}:\n{e.stderr}"

@tool("Test Endpoint Tool")
def test_endpoint(url: str = "http://localhost:3000") -> str:
    """
    Tests if a local endpoint is up and returns its HTTP status code.
    :param url: The URL to test (e.g. 'http://localhost:3000' or 'http://localhost:8000').
    """
    import urllib.request
    import urllib.error
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            return f"Success! {url} is UP. Status Code: {response.getcode()}"
    except urllib.error.URLError as e:
        return f"Failed to reach {url}. Error: {e.reason}"

@tool("Web Search")
def web_search(query: str) -> str:
    """Useful to search the internet for code documentation, examples, and general information."""
    from langchain_community.tools import DuckDuckGoSearchRun
    try:
        search = DuckDuckGoSearchRun()
        return search.run(query)
    except Exception as e:
        return f"Error performing web search: {str(e)}"

@tool("List Directory Files")
def list_directory_files(directory: str = "") -> str:
    """
    Lists all files and folders recursively inside the developmentAI directory.
    :param directory: Optional relative subdirectory to list (e.g. 'conf'). Defaults to root.
    """
    import os
    import re
    
    # Strip absolute paths
    directory = re.sub(r'^(/home/[^/]+/|/app/|c:/|/|\\)', '', directory, flags=re.IGNORECASE)
    
    base_dir = r"C:\apps\cloudfly"
    target_dir = os.path.abspath(os.path.join(base_dir, directory))
    
    if not target_dir.startswith(base_dir):
        return f"Error: {target_dir} is outside developmentAI directory."
        
    if not os.path.exists(target_dir):
        return f"Error: Directory '{directory}' does not exist."
        
    try:
        tree = []
        for root, dirs, files in os.walk(target_dir):
            # Skip hidden folders, build artifacts, and node_modules
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

            level = root.replace(target_dir, '').count(os.sep)
            indent = ' ' * 4 * level
            subfolder = os.path.basename(root)
            if subfolder:
                tree.append(f"{indent}📁 {subfolder}/")
            else:
                tree.append(f"📁 [developmentAI Root]/")
                
            sub_indent = ' ' * 4 * (level + 1)
            for f in sorted(files):
                file_path = os.path.join(root, f)
                size_bytes = os.path.getsize(file_path)
                tree.append(f"{sub_indent}📄 {f} ({size_bytes} bytes)")
                
        return "\n".join(tree)
    except Exception as e:
        return f"Error listing directory: {str(e)}"

@tool("Read Code File")
def read_code_file(filepath: str) -> str:
    """
    Reads the content of an existing file inside the developmentAI directory.
    :param filepath: The relative target filepath (e.g. 'docker-compose.yml' or 'conf/vars.xml'). DO NOT use absolute paths.
    """
    import os
    import re
    
    # Strip hallucinated absolute paths to force relativity
    filepath = re.sub(r'^(/home/[^/]+/|/app/|c:/|/|\\)', '', filepath, flags=re.IGNORECASE)
    
    base_dir = r"C:\apps\cloudfly"
    target_path = os.path.abspath(os.path.join(base_dir, filepath))
    
    if not target_path.startswith(base_dir):
        return f"Error: {target_path} is outside developmentAI directory. Use relative paths."
        
    if not os.path.exists(target_path):
        return f"Error: File '{filepath}' does not exist inside developmentAI directory."
        
    if os.path.isdir(target_path):
        return f"Error: '{filepath}' is a directory. Use 'List Directory Files' instead."
        
    try:
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read()
        return f"--- Content of {filepath} ---\n{content}"
    except Exception as e:
        return f"Error reading file: {str(e)}"

@tool("Read Jira Issue")
def read_jira_issue(issue_key: str) -> str:
    """
    Get the full description and latest comments of a specific Jira issue.
    :param issue_key: The exact Jira issue key (e.g., 'CLOUD-14').
    """
    if not jira_wrapper or not hasattr(jira_wrapper, 'jira'):
        return "Jira is not configured."
    try:
        issue = jira_wrapper.jira.issue(issue_key)
        fields = issue.get("fields", {})
        description = fields.get("description") or "No description provided."
        
        comments_list = []
        comments = fields.get("comment", {}).get("comments", [])
        if comments:
            # get last 5 comments for context
            for c in comments[-5:]: 
                author = c.get("author", {}).get("displayName", "Unknown")
                body = c.get("body", "")
                comments_list.append(f"[{author}]: {body}")
                
        comments_str = "\n".join(comments_list) if comments_list else "No comments."
        
        return f"--- Issue: {issue_key} ---\nDescription:\n{description}\n\nLatest Comments:\n{comments_str}"
    except Exception as e:
        return f"Error reading issue {issue_key}: {str(e)}"

@tool("Execute Console Command")
def execute_console_command(command: str, background: bool = False, timeout_seconds: int = 120) -> str:
    """
    Execute a PowerShell command on the Windows development machine (C:\\apps\\cloudfly).
    IMPORTANT: This is a Windows environment — use ONLY PowerShell commands (Get-ChildItem, not dir; docker-compose, not docker compose).
    Use this to run tests, inspect logs (Get-Content), install dependencies (pip install, npm install), manage Docker (docker-compose), or run Python scripts.
    If you get an error you don't understand, use the 'Web Search' tool to search for the error message and find a fix (e.g. search: "npm error EPERM Windows", "docker-compose port already in use", "pip install access denied Windows", etc.).
    
    :param command: The exact PowerShell command to run.
    :param background: If True, runs the command asynchronously in a background thread and returns immediately with a process ID. Use 'Check Background Task' tool to retrieve results later. Default False.
    :param timeout_seconds: Maximum time to wait for the command to complete (default 120s). For long-running commands like builds or npm install, increase this.
    """
    workspace_dir = r"C:\apps\cloudfly"
    ps_command = f"Set-Location -Path '{workspace_dir}'; {command}"

    # ── Background mode: launch and return immediately ──────────────────
    if background:
        def _run_bg():
            try:
                proc = subprocess.Popen(
                    ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_command],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    encoding='utf-8',
                    errors='replace',
                    cwd=workspace_dir
                )
                pid = proc.pid
                _register_bg_process(pid, proc, command)
                for line in iter(proc.stdout.readline, ''):
                    if line:
                        _update_bg_output(pid, line)
                proc.wait()
                _mark_bg_done(pid, proc.returncode)
            except Exception as e:
                _register_bg_process(-1, None, command)
                _update_bg_output(-1, str(e))
                _mark_bg_done(-1, -1)

        thread = threading.Thread(target=_run_bg, daemon=True)
        thread.start()
        time.sleep(0.5)
        pids = _get_all_bg_pids()
        newest_pid = pids[-1] if pids else "unknown"
        return (
            f"🚀 [Background] Command launched asynchronously (PID: {newest_pid}).\n"
            f"Command: {command}\n"
            f"Use 'Check Background Task' tool with PID {newest_pid} to retrieve results when ready.\n"
            f"The agent can continue working while this runs."
        )

    # ── Foreground mode: run with polling (non-blocking reads) ──────────
    try:
        process = subprocess.Popen(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps_command],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            encoding='utf-8',
            errors='replace',
            cwd=workspace_dir,
            bufsize=1
        )

        start_time = time.time()
        output_accumulated = []

        while process.poll() is None:
            elapsed = int(time.time() - start_time)
            if elapsed >= timeout_seconds:
                process.terminate()
                return f"⏱️ Command timed out after {timeout_seconds}s.\nPartial Output:\n" + "".join(output_accumulated)

            try:
                line = process.stdout.readline()
                if line:
                    output_accumulated.append(line)
                    sys.stdout.write(f"  [Console]: {line}")
                    sys.stdout.flush()
            except Exception:
                pass

            time.sleep(1)

        remaining = process.stdout.read()
        if remaining:
            output_accumulated.append(remaining)

        exit_code = process.returncode
        complete_output = "".join(output_accumulated).strip()

        if exit_code == 0:
            return f"✅ Command completed successfully (exit code 0).\nOutput:\n{complete_output}"
        else:
            return f"❌ Command completed with exit code {exit_code}.\nOutput:\n{complete_output}"

    except Exception as e:
        return f"Failed to execute command: {str(e)}"


@tool("Check Background Task")
def check_background_task(pid: int) -> str:
    """
    Check the status and output of a background command launched with 'Execute Console Command' (background=True).
    :param pid: The process ID returned by the background execution.
    """
    task = _get_bg_task(pid)
    if task is None:
        return f"Error: No background task found with PID {pid}. Available PIDs: {_get_all_bg_pids()}"

    output = "".join(task.get("output", []))

    if task.get("done"):
        exit_code = task.get("exit_code", "unknown")
        elapsed = round(time.time() - task.get("start_time", time.time()), 1)
        _remove_bg_task(pid)
        return (
            f"✅ Background task (PID {pid}) completed in {elapsed}s.\n"
            f"Command: {task.get('command', 'unknown')}\n"
            f"Exit code: {exit_code}\n"
            f"Output:\n{output}"
        )
    else:
        elapsed = round(time.time() - task.get("start_time", time.time()), 1)
        return (
            f"⏳ Background task (PID {pid}) still running ({elapsed}s elapsed)...\n"
            f"Command: {task.get('command', 'unknown')}\n"
            f"Partial output so far:\n{output[-500:] if output else '(no output yet)'}"
        )


def no_cache(*args, **kwargs):
    """Function to completely disable caching for a tool."""
    return False

@tool("Commit Code")
def commit_code(commit_message: str) -> str:
    """
    Commits the current codebase to Git. Use this to save your work safely before passing it to QA.
    :param commit_message: A brief description of what you changed (e.g., 'Add marketing microservice structure').
    """
    try:
        workspace_dir = r"C:\apps\cloudfly"
        subprocess.run("git add .", shell=True, cwd=workspace_dir, capture_output=True, encoding='utf-8', errors='replace')
        result = subprocess.run(f'git commit -m "🤖 AI: {commit_message}"', shell=True, cwd=workspace_dir, capture_output=True, encoding='utf-8', errors='replace')
        return f"Git commit successful:\n{result.stdout}"
    except Exception as e:
        return f"Failed to commit code: {str(e)}"

@tool("Ask Human Clarification")
def ask_human_clarification(question: str) -> str:
    """
    Use this tool if you are stuck, confused, or need Edwin (the Human Product Owner) to make a decision or provide a password/API key.
    :param question: The exact question you want to ask the human.
    """
    print(f"\n\n==================================================")
    print(f"⚠️  [AGENT REQUIRES YOUR INPUT] ⚠️")
    print(f"==================================================")
    print(f"Question: {question}")
    answer = input("\n> Your Answer: ")
    print(f"==================================================\n")
    return answer

@tool("Execute VPS SSH Command")
def execute_vps_ssh_command(command: str) -> str:
    """
    Connects to the CloudFly VPS (api.cloudfly.com.co) via SSH and executes a bash command.
    Used by DevOps for pulling git updates, building, or managing containers on the VPS.
    :param command: The exact bash command to execute on the VPS (e.g. 'cd /app && git pull origin desarrollo && docker-compose restart').
    """
    import subprocess
    import os
    
    key_path = r"C:\Users\Edwin\.ssh\id_rsa_cloudfly"
    if not os.path.exists(key_path):
        return f"Error: SSH private key not found at {key_path}."
        
    ssh_cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-i", key_path,
        "-p", "22",
        "root@api.cloudfly.com.co",
        command
    ]
    
    try:
        result = subprocess.run(
            ssh_cmd,
            capture_output=True,
            encoding='utf-8',
            errors='replace',
            shell=True # Required on Windows for built-in command parsing
        )
        output = result.stdout + "\n" + result.stderr
        return f"SSH command executed on VPS. Exit code: {result.returncode}\nOutput:\n{output.strip()}"
    except Exception as e:
        return f"Failed to execute SSH command on VPS: {str(e)}"

@tool("Wait Seconds")
def wait_seconds(seconds: int) -> str:
    """
    Pauses the agent execution for a specified number of seconds.
    Extremely useful after starting Docker containers, starting a background process, or deploying to the VPS,
    allowing services and migrations to fully boot up and become healthy before verifying or running tests.
    :param seconds: The number of seconds to wait (e.g. 15, 30, 60).
    """
    import time
    try:
        sec_int = int(seconds)
        print(f"\n⏳ [Timer]: Pausando ejecución por {sec_int} segundos para permitir la inicialización del servicio...")
        time.sleep(sec_int)
        return f"Successfully paused execution and waited for {sec_int} seconds. Background services, databases, or migrations should now be fully booted up and healthy. You can proceed with E2E verification."
    except Exception as e:
        return f"Failed to pause execution: {str(e)}"

@tool("Execute Command and Wait")
def execute_command_and_wait(command: str, is_vps: bool = False, expected_output: str = "", timeout_seconds: int = 120) -> str:
    """
    Executes a local PowerShell command or a VPS SSH command asynchronously, polls and waits for its completion.
    IMPORTANT: Local commands run on Windows via PowerShell. Use ONLY PowerShell syntax (not cmd.exe or bash).
    Useful for running builds, starting services, or executing long-running migrations and verifying results.
    :param command: The exact PowerShell command to run (local) or bash command (if is_vps=True).
    :param is_vps: If True, executes the command on the CloudFly VPS via SSH (Linux/bash). If False, runs locally (Windows/PowerShell).
    :param expected_output: Optional string to look for in the output to declare early success.
    :param timeout_seconds: Maximum time to wait in seconds (default 120).
    """
    import subprocess
    import time
    import os
    import sys
    
    # 1. Build the command line
    if is_vps:
        key_path = r"C:\Users\Edwin\.ssh\id_rsa_cloudfly"
        if not os.path.exists(key_path):
            return f"Error: SSH private key not found at {key_path}."
        final_cmd = f'ssh -o StrictHostKeyChecking=no -i "{key_path}" -p 22 root@api.cloudfly.com.co "{command}"'
        cwd = None
    else:
        final_cmd = command
        cwd = r"C:\apps\cloudfly"
        
    print(f"\n🚀 [Scrum Master - Polling Timer]: Lanzando comando {'en VPS' if is_vps else 'en Local'}: '{command}'")
    print(f"⏳ Esperando terminación y verificando resultados (Timeout: {timeout_seconds}s)...")
    
    try:
        # Start the process in the background (asynchronous) via PowerShell on Windows
        if is_vps:
            popen_cmd = final_cmd
            popen_shell = True
        else:
            popen_cmd = ["powershell", "-NoProfile", "-NonInteractive", "-Command", f"Set-Location -Path '{cwd}'; {final_cmd}"]
            popen_shell = False
        process = subprocess.Popen(
            popen_cmd,
            shell=popen_shell,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            encoding='utf-8',
            errors='replace',
            cwd=cwd,
            bufsize=1
        )
        
        start_time = time.time()
        output_accumulated = []
        
        # Poll the process status in a non-blocking loop
        while process.poll() is None:
            elapsed = int(time.time() - start_time)
            if elapsed >= timeout_seconds:
                process.terminate()
                return f"Error: Command execution timed out after {timeout_seconds} seconds.\nAccumulated Output:\n" + "".join(output_accumulated)
                
            # Read stdout chunk-by-chunk without blocking
            try:
                line = process.stdout.readline()
                if line:
                    output_accumulated.append(line)
                    # print to console in real-time
                    sys.stdout.write(f" [VPS/Local Output]: {line}")
                    sys.stdout.flush()
                    
                    if expected_output and expected_output in "".join(output_accumulated):
                        process.terminate()
                        return f"Success! Expected string '{expected_output}' detected early.\nOutput:\n" + "".join(output_accumulated)
            except Exception:
                pass
                
            time.sleep(2)
            
        # Read any remaining output after process completes
        remaining = process.stdout.read()
        if remaining:
            output_accumulated.append(remaining)
            
        exit_code = process.returncode
        complete_output = "".join(output_accumulated).strip()
        
        if exit_code == 0:
            return f"Success! Command completed successfully with exit code 0.\nOutput:\n{complete_output}"
        else:
            return f"Error: Command completed with non-zero exit code {exit_code}.\nOutput:\n{complete_output}"
            
    except Exception as e:
        return f"Failed to execute command: {str(e)}"

def get_jira_tools():
    """
    Returns native CrewAI tools for Jira to avoid Pydantic validation errors 
    with LangChain community tools. Also disables tool caching globally.
    """
    all_tools = [jql_query, create_issue, get_projects, write_code_to_file, docker_manage, test_endpoint, comment_issue, transition_issue, web_search, list_directory_files, read_code_file, read_jira_issue, execute_console_command, check_background_task, commit_code, ask_human_clarification, execute_vps_ssh_command, wait_seconds, execute_command_and_wait]
    
    # Force disable caching on every tool to avoid 'from cache' ghost results
    for t in all_tools:
        t.cache_function = no_cache
        
    return all_tools
