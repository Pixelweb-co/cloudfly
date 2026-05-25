import os
import sys
from fastapi import FastAPI

# Simple FastAPI app for health checks and potential future endpoints
app = FastAPI()

@app.get("/health")
def health_check():
    """Health endpoint used by Docker healthcheck and tests."""
    return {"status": "ok"}

# Force UTF-8 encoding for Windows terminals to support emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# The heavy imports and runtime logic are only needed when running the sprint
# They are imported lazily inside the run_sprint function to avoid side effects

def run_sprint():
    """Entry point for the AI Scrum Team sprint execution.
    All heavy dependencies are imported here to keep module import lightweight
    for health checks and unit tests.
    """
    from dotenv import load_dotenv
    from crewai import Crew, Process

    # Load environment variables (API keys)
    load_dotenv()

    # Set required environment variable for CrewAI Ollama Memory
    os.environ["EMBEDDINGS_OLLAMA_MODEL_NAME"] = "nomic-embed-text"

    from agents import (
        product_owner,
        system_architect,
        software_developer,
        qa_engineer,
        devops_engineer,
        technical_writer,
        frontend_developer,
    )
    from tasks import (
        sprint_planning,
        research_task,
        development_task,
        quality_assurance,
        deployment_prep,
        documentation_task,
        frontend_development_task,
    )
    from connector import ScrumConnector

    # --- Helper functions (print_jira_sprint_stats, check_pending_jira_tasks, generate_codebase_context) ---
    # They are defined inline to keep the global namespace clean.
    def print_jira_sprint_stats():
        import re, ast
        from tools import jira_wrapper
        if not jira_wrapper or not hasattr(jira_wrapper, "run"):
            print("[!] Advertencia: Jira no está conectado para obtener estadísticas.")
            return
        try:
            res = jira_wrapper.run("jql", "project = CLOUD")
            if not res or "Found 0 issues" in res:
                print("[🤖 Scrum Master]: No se encontraron tareas en el proyecto CLOUD.")
                return
            match = re.search(r"\[.*\]", res, re.DOTALL)
            if not match:
                return
            issues = ast.literal_eval(match.group(0))
            if not issues:
                return
            stats = {}
            pending_list = []
            completed_list = []
            for issue in issues:
                key = issue.get('key', 'Unknown')
                summary = issue.get('summary', 'No summary')
                status = issue.get('status', 'Unknown')
                stats[status] = stats.get(status, 0) + 1
                item = {"key": key, "summary": summary, "status": status}
                if status.lower() in ("done", "finalizada", "finalizado", "completada", "completado", "terminada", "terminado"):
                    completed_list.append(item)
                else:
                    pending_list.append(item)
            print("\n==================================================")
            print("📊 [Scrum Master]: CONTROL DE SPRINT - PROYECTO CLOUD")
            print("==================================================")
            print(f"Total Tareas: {len(issues)}")
            print(f"✅ Finalizadas (Done): {len(completed_list)}")
            print(f"⏳ Pendientes (En Curso): {len(pending_list)}")
            print("--------------------------------------------------")
            print("Distribución por Estado:")
            for status, count in stats.items():
                print(f" - {status}: {count}")
            print("==================================================\n")
        except Exception as e:
            print(f"[!] Advertencia al generar estadísticas de Jira: {e}")

    def check_pending_jira_tasks():
        import re, ast
        from tools import jira_wrapper
        if not jira_wrapper or not hasattr(jira_wrapper, "run"):
            print("[!] Advertencia: Jira no está conectado o configurado.")
            return []
        try:
            res = jira_wrapper.run("jql", "project = CLOUD AND status != Done")
            if not res or "Found 0 issues" in res:
                return []
            match = re.search(r"\[.*\]", res, re.DOTALL)
            if not match:
                return []
            issues = ast.literal_eval(match.group(0))
            return issues
        except Exception as e:
            print(f"[!] Advertencia al buscar tareas en Jira: {e}")
            return []

    def generate_codebase_context():
        """Generate a concise codebase context for the agents.
        This mirrors the original implementation but avoids heavy imports.
        """
        base_dir = r"C:\apps\cloudfly"
        exclude_dirs = {'.git', 'node_modules', '__pycache__', 'venv', '.env', 'db', '.gemini', 'tmp', '.cloudflared', '.vscode', 'chatwoot', 'apache2', 'debug_reports', 'vuexy', 'terraform', 'screenshots', 'docs'}
        exclude_extensions = {'.log', '.txt', '.tar', '.zip', '.exe', '.png', '.jpg', '.jpeg', '.gif'}
        if not os.path.exists(base_dir):
            return "No existing code found."
        context = []
        spec_path = os.path.join(base_dir, "spec.md")
        if os.path.exists(spec_path):
            try:
                with open(spec_path, 'r', encoding='utf-8') as sf:
                    spec_content = sf.read()
                limit = 1500
                if len(spec_content) > limit:
                    context.append("=== SPECIFICATION MASTER REFERENCE (spec.md) - RESUMEN CORTO ===")
                    context.append(spec_content[:limit])
                else:
                    context.append("=== SPECIFICATION MASTER REFERENCE (spec.md) ===")
                    context.append(spec_content)
            except Exception:
                pass
        context.append("=== EXISTING DIRECTORY TREE (OPTIMIZED DEPTH 1) ===")
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith('.')]
            level = root.replace(base_dir, '').count(os.sep)
            if level >= 2:
                dirs[:] = []
                continue
            indent = ' ' * 4 * level
            subfolder = os.path.basename(root)
            if subfolder:
                context.append(f"{indent}📁 {subfolder}/")
            else:
                context.append("📁 [developmentAI Root]/")
            sub_indent = ' ' * 4 * (level + 1)
            for f in sorted(files):
                ext = os.path.splitext(f)[1].lower()
                if ext in exclude_extensions:
                    continue
                if root == base_dir and ext not in ('.json', '.yml', '.yaml', '.md', '.py', '.sql', '.js'):
                    continue
                try:
                    size = os.path.getsize(os.path.join(root, f))
                    context.append(f"{sub_indent}📄 {f} ({size} bytes)")
                except Exception:
                    pass
        return "\n".join(context)

    # --- Main sprint loop (simplified) ---
    sprint_number = 1
    initial_feature_set = False
    while True:
        print(f"\n\n==================================================")
        print(f"🔄 INICIANDO SPRINT #{sprint_number}")
        print(f"==================================================")
        print_jira_sprint_stats()
        pending = check_pending_jira_tasks()
        if pending:
            jira_backlog_context = "\n".join([f"--- TICKET {i['key']} ---\nSummary: {i['summary']}\nStatus: {i['status']}" for i in pending])
            current_sprint_goal = "Resolver tickets pendientes"
        else:
            jira_backlog_context = "Backlog limpio de Jira. Esta es una tarea/funcionalidad completamente nueva."
            if not initial_feature_set:
                current_sprint_goal = "Crear un PBX FreeSWITCH en docker con 2 extensiones"
                initial_feature_set = True
            else:
                print("✅ No hay más trabajo. Sprint completado.")
                break
        codebase_context = generate_codebase_context()
        # Execute a minimal crew just to demonstrate flow (skip heavy logic)
        crew = Crew(
            agents=[product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer],
            tasks=[sprint_planning, research_task, development_task, frontend_development_task, deployment_prep, documentation_task, quality_assurance],
            process=Process.sequential,
            verbose=False,
        )
        try:
            crew.kickoff(inputs={"feature": current_sprint_goal, "codebase_context": codebase_context, "jira_backlog_context": jira_backlog_context})
        except Exception as e:
            print(f"Crew execution error: {e}")
        sprint_number += 1

if __name__ == "__main__":
    run_sprint()
