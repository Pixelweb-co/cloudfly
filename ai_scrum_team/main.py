import os
import sys

# Force UTF-8 encoding for Windows terminals to support emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from crewai import Crew, Process

# Load environment variables (API keys)
load_dotenv()

# Set required environment variable for CrewAI Ollama Memory
os.environ["EMBEDDINGS_OLLAMA_MODEL_NAME"] = "nomic-embed-text"

from agents import product_owner, system_architect, software_developer, qa_engineer, devops_engineer, technical_writer, frontend_developer
from tasks import sprint_planning, research_task, development_task, quality_assurance, deployment_prep, documentation_task, frontend_development_task

def print_jira_sprint_stats():
    import re
    import ast
    from tools import jira_wrapper
    if not jira_wrapper or not hasattr(jira_wrapper, 'run'):
        print("[!] Advertencia: Jira no está conectado para obtener estadísticas.")
        return
    try:
        res = jira_wrapper.run("jql", "project = CLOUD")
        if not res or "Found 0 issues" in res:
            print("[🤖 Scrum Master]: No se encontraron tareas en el proyecto CLOUD.")
            return
            
        match = re.search(r'\[.*\]', res, re.DOTALL)
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
    import re
    import ast
    from tools import jira_wrapper
    if not jira_wrapper or not hasattr(jira_wrapper, 'run'):
        print("[!] Advertencia: Jira no está conectado o configurado.")
        return []
    try:
        # Search issues in project CLOUD that are not Done using native LangChain run
        res = jira_wrapper.run("jql", "project = CLOUD AND status != Done")
        if not res or "Found 0 issues" in res:
            return []
            
        # Extract the list part (enclosed in brackets [ ... ])
        match = re.search(r'\[.*\]', res, re.DOTALL)
        if not match:
            return []
            
        # Parse using ast.literal_eval since it is outputted as a Python list representation
        issues = ast.literal_eval(match.group(0))
        return issues
    except Exception as e:
        print(f"[!] Advertencia al buscar tareas en Jira: {e}")

def generate_codebase_context():
    """
    Scans the entire C:\apps\cloudfly directory tree and generates a markdown
    context representation to be injected into agent prompts.
    If spec.md exists, its content is directly injected to improve SDD.
    """
    base_dir = r"C:\apps\cloudfly"
    exclude_dirs = {'.git', 'node_modules', '__pycache__', 'venv', '.env', 'db', '.gemini', 'tmp'}
    if not os.path.exists(base_dir):
        return "No existing code found (C:\\apps\\cloudfly directory does not exist or is empty)."
        
    context = []
    
    # 1. Read spec.md if it exists as the Master Reference
    spec_path = os.path.join(base_dir, "spec.md")
    if os.path.exists(spec_path):
        try:
            with open(spec_path, 'r', encoding='utf-8') as sf:
                spec_content = sf.read()
            context.append("=== SPECIFICATION MASTER REFERENCE (spec.md) ===")
            context.append(spec_content)
            context.append("================================================\n")
        except Exception as e:
            print(f"[!] Advertencia al leer spec.md para el contexto: {e}")

    context.append("=== EXISTING DIRECTORY TREE ===")
    
    # Build tree
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if not d.startswith('.') and d not in exclude_dirs]
        level = root.replace(base_dir, '').count(os.sep)
        indent = ' ' * 4 * level
        subfolder = os.path.basename(root)
        if subfolder:
            context.append(f"{indent}📁 {subfolder}/")
        else:
            context.append("📁 [developmentAI Root]/")
            
        sub_indent = ' ' * 4 * (level + 1)
        for f in sorted(files):
            file_path = os.path.join(root, f)
            size_bytes = os.path.getsize(file_path)
            context.append(f"{sub_indent}📄 {f} ({size_bytes} bytes)")
            
    context.append("\n[!] IMPORTANT FOR AGENTS: Use the 'Read Code File' tool to read the contents of any of these files if you need them. The file contents are not provided here to save context window space.")
    return "\n".join(context)

def run_sprint():
    print("==================================================")
    print(">>> AI AGILE TEAM: CONTINUOUS INTEGRATION STARTED")
    print("==================================================")
    
    sprint_number = 1
    initial_feature_set = False
    user_feature = ""
    
    while True:
        print(f"\n\n==================================================")
        print(f"🔄 INICIANDO SPRINT #{sprint_number}")
        print(f"==================================================")
        
        # Spoof internal OpenAI variables so CrewAI memory analyzer uses OpenRouter (Owl Alpha 1M context) for free!
        os.environ["OPENAI_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "sk-or-...")
        os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1" # Required for newer OpenAI SDKs
        os.environ["OPENAI_MODEL_NAME"] = "openrouter/openrouter/owl-alpha"
        
        # Instantiate Crew fresh each iteration to ensure memory and tasks are clean
        scrum_crew = Crew(
            agents=[product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer],
            tasks=[sprint_planning, research_task, development_task, frontend_development_task, deployment_prep, documentation_task, quality_assurance],
            process=Process.sequential,
            memory=False,
            cache=False,
            verbose=True
        )
        
        print_jira_sprint_stats()
        print("\n[🤖 Scrum Master]: Revisando tareas pendientes en Jira...")
        pending_issues = check_pending_jira_tasks()
        
        if pending_issues:
            print(f"\n[!] ¡Se han encontrado {len(pending_issues)} tareas/bugs PENDIENTES en Jira!")
            issue_details = []
            for issue in pending_issues:
                key = issue.get('key', 'Unknown')
                summary = issue.get('summary', 'No summary')
                status = issue.get('status', 'Unknown')
                print(f"    📌 [{key}] - {summary} (Estado: {status})")
                
                # Fetch the latest comment to provide context automatically
                latest_comment_text = ""
                try:
                    from tools import jira_wrapper
                    if jira_wrapper and hasattr(jira_wrapper, 'jira'):
                        j_issue = jira_wrapper.jira.issue(key)
                        fields = j_issue.get("fields", {})
                        comments = fields.get("comment", {}).get("comments", [])
                        if comments:
                            latest_c = comments[-1]
                            author = latest_c.get("author", {}).get("displayName", "Unknown")
                            body = latest_c.get("body", "")
                            latest_comment_text = f" - [LATEST COMMENT from {author}]: {body}"
                except Exception:
                    pass
                
                issue_details.append(f"[{key}]: '{summary}'{latest_comment_text}")
                
            print("\n[🤖 Scrum Master]: El equipo priorizará la resolución y cierre de estos tickets considerando sus comentarios recientes.")
            current_sprint_goal = "Completar, finalizar y arreglar los errores mencionados en los comentarios de estas tareas pendientes: " + " | ".join(issue_details) + ". IMPORTANT: Use 'Read Jira Issue' tool if you need the full description and older comments."
            initial_feature_set = True
            
        else:
            if not initial_feature_set:
                print("\n[🤖 Scrum Master]: No hay tareas pendientes en Jira. El backlog está limpio.")
                print("\n[!] Hola! Soy el Scrum Master de tu equipo autónomo de IA.")
                user_feature = input("¿Qué funcionalidad o aplicación deseas que construyamos? \n> ")
                if not user_feature.strip():
                    user_feature = "Crear un PBX FreeSWITCH en docker con 2 extensiones"
                    print(f"Entrada vacía. Usando por defecto: '{user_feature}'")
                
                print(f"\nEntendido. Iniciando nueva funcionalidad: '{user_feature}'\n")
                current_sprint_goal = user_feature
                initial_feature_set = True
            else:
                # If we already processed a feature/bug and now there are 0 pending tasks, QA approved everything!
                print_jira_sprint_stats()
                print(f"\n✅ [🤖 Scrum Master]: ¡No hay bugs ni tareas pendientes! Todo ha quedado en estado 'Done'.")
                print("==================================================")
                print(f"[X] CICLO COMPLETADO EXITOSAMENTE TRAS {sprint_number - 1} SPRINTS")
                print("==================================================")
                break
                
        # Generate codebase context
        print("[🤖 Scrum Master]: Generando contexto del código fuente para el equipo...")
        codebase_context = generate_codebase_context()
        
        # Start the sprint iteration
        result = scrum_crew.kickoff(inputs={"feature": current_sprint_goal, "codebase_context": codebase_context})
        
        print(f"\n[X] RESULTADO DEL SPRINT #{sprint_number}:")
        print(result)
        
        sprint_number += 1

if __name__ == "__main__":
    run_sprint()
