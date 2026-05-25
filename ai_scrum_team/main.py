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
from connector import ScrumConnector

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
    r"""
    Scans the C:\apps\cloudfly directory tree and generates a clean, optimized markdown
    context representation to be injected into agent prompts.
    To avoid overloading the LLM's context window and causing empty responses,
    it limits the inline spec.md content and filters out heavy or irrelevant files/folders,
    urging the agents to read files in parts or fully using their tools.
    """
    base_dir = r"C:\apps\cloudfly"
    exclude_dirs = {
        '.git', 'node_modules', '__pycache__', 'venv', '.env', 'db', '.gemini', 'tmp',
        '.cloudflared', '.vscode', 'chatwoot', 'apache2', 'debug_reports', 'vuexy', 'terraform'
    }
    exclude_extensions = {'.log', '.txt', '.tar', '.zip', '.exe', '.png', '.jpg', '.jpeg', '.gif'}
    
    if not os.path.exists(base_dir):
        return "No existing code found (C:\\apps\\cloudfly directory does not exist or is empty)."
        
    context = []
    
    # 1. Read a summarized preview of spec.md as the Master Reference
    spec_path = os.path.join(base_dir, "spec.md")
    if os.path.exists(spec_path):
        try:
            with open(spec_path, 'r', encoding='utf-8') as sf:
                spec_content = sf.read()
            
            # If the spec is long, we send the first part and instruct the agents to read the rest using tools
            limit = 3500
            if len(spec_content) > limit:
                context.append("=== SPECIFICATION MASTER REFERENCE (spec.md) - PRIMERA PARTE ===")
                context.append(spec_content[:limit])
                context.append(f"\n[!] AVISO SCRUM MASTER: El archivo spec.md es muy largo ({len(spec_content)} caracteres). Se ha enviado solo la primera parte para no sobrecargar el prompt.")
                context.append("UTILIZA LA HERRAMIENTA DE LECTURA DE ARCHIVOS para leer las partes específicas o el archivo completo si necesitas más detalles.")
                context.append("================================================\n")
            else:
                context.append("=== SPECIFICATION MASTER REFERENCE (spec.md) ===")
                context.append(spec_content)
                context.append("================================================\n")
        except Exception as e:
            print(f"[!] Advertencia al leer spec.md para el contexto: {e}")

    context.append("=== EXISTING DIRECTORY TREE (OPTIMIZED) ===")
    
    # Build tree with heavy exclusions to save prompt space and allow models to process without errors
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
            ext = os.path.splitext(f)[1].lower()
            if ext in exclude_extensions:
                continue
            # Don't list root files unless they are config/specs to keep context extremely clean
            if root == base_dir and ext not in ('.json', '.yml', '.yaml', '.md', '.py', '.sql', '.js'):
                continue
                
            file_path = os.path.join(root, f)
            try:
                size_bytes = os.path.getsize(file_path)
                context.append(f"{sub_indent}📄 {f} ({size_bytes} bytes)")
            except Exception:
                pass
            
    context.append("\n[!] IMPORTANTE PARA LOS AGENTES: Para ahorrar espacio de contexto y evitar respuestas vacías (None/empty response), el árbol de directorios ha sido optimizado y los archivos pesados no se listan ni se leen completos directamente en esta prompt.")
    context.append("POR FAVOR, envía tus solicitudes y lee el código EN PARTES usando la herramienta 'Read Code File' para acceder al contenido real de cualquier archivo de código o especificación cuando lo requieras.")
    return "\n".join(context)

def run_sprint():
    import threading
    import time
    import json
    
    print("==================================================")
    print(">>> AI AGILE TEAM: CONTINUOUS INTEGRATION STARTED")
    print("==================================================")
    
    # 1. Inicializar conector de Redis
    connector = ScrumConnector()
    if not connector.connect():
        print("[!] No se pudo conectar a Redis. Corriendo en modo STANDALONE tradicional...")
        use_distributed = False
    else:
        use_distributed = True
        # Registrar salida limpia
        import atexit
        atexit.register(connector.shutdown)
        # Intentar elegir Master
        connector.elect_master()

    sprint_number = 1
    initial_feature_set = False
    user_feature = ""

    # Función auxiliar para ejecutar el Crew en local (para Workers o para Master Standalone)
    def execute_crew_locally(sprint_goal, codebase_ctx, JIRA_ctx):
        # Spoof internal OpenAI variables so CrewAI memory analyzer uses OpenRouter (ZOO Owl Alpha) for free!
        os.environ["OPENAI_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "sk-or-...")
        os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_MODEL_NAME"] = "openrouter/openrouter/owl-alpha"
        
        scrum_crew = Crew(
            agents=[product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer],
            tasks=[sprint_planning, research_task, development_task, frontend_development_task, deployment_prep, documentation_task, quality_assurance],
            process=Process.sequential,
            memory=False,
            cache=False,
            verbose=True
        )
        
        result = scrum_crew.kickoff(inputs={
            "feature": sprint_goal,
            "codebase_context": codebase_ctx,
            "jira_backlog_context": JIRA_ctx
        })
        
        # Mostrar indicador de uso de tokens
        try:
            metrics = getattr(scrum_crew, 'usage_metrics', None)
            if not metrics and hasattr(result, 'token_usage'):
                metrics = result.token_usage
            if not metrics and hasattr(result, 'usage_metrics'):
                metrics = result.usage_metrics
                
            if metrics:
                total_tokens = getattr(metrics, 'total_tokens', 0)
                prompt_tokens = getattr(metrics, 'prompt_tokens', 0)
                completion_tokens = getattr(metrics, 'completion_tokens', 0)
                successful_requests = getattr(metrics, 'successful_requests', 0)
                
                if isinstance(metrics, dict):
                    total_tokens = metrics.get('total_tokens', 0)
                    prompt_tokens = metrics.get('prompt_tokens', 0)
                    completion_tokens = metrics.get('completion_tokens', 0)
                    successful_requests = metrics.get('successful_requests', 0)
                
                print("\n==================================================")
                print("📊 [Scrum Master]: METRICAS DE USO DE IA (TOKENS)")
                print("==================================================")
                print(f"🔑 Solicitudes Exitosas: {successful_requests}")
                print(f"📥 Tokens de Entrada (Prompt): {prompt_tokens}")
                print(f"📤 Tokens de Salida (Completion): {completion_tokens}")
                print(f"🧮 Total de Tokens Consumidos: {total_tokens}")
                print("==================================================\n")
        except Exception as usage_err:
            pass
            
        return result

    # Lógica de WORKER distribuido
    if use_distributed and not connector.is_master:
        print(f"\n👷 [Worker {connector.instance_id}]: Listo y escuchando cola para recibir tareas...")
        
        # Iniciar un hilo secundario para imprimir eventos Pub/Sub generales en la terminal del worker
        def listen_events():
            try:
                pubsub = connector.redis_client.pubsub()
                pubsub.subscribe("scrum:events")
                for message in pubsub.listen():
                    if message['type'] == 'message':
                        data = json.loads(message['data'])
                        if data['instance_id'] != connector.instance_id:
                            print(f"📡 [Red - {data['timestamp']}] {data['instance_id']}: {data['message']}")
            except Exception:
                pass
        threading.Thread(target=listen_events, daemon=True).start()

        while True:
            # Esperar tarea asignada por el Master
            task_id = connector.get_task()
            if task_id:
                # Registrar que estamos ejecutando activamente esta tarea
                connector.redis_client.set(f"scrum:active_task:{connector.instance_id}", task_id, ex=43200)
                print(f"\n🚀 [Worker {connector.instance_id}]: ¡Tarea recibida! Procesando {task_id}...")
                connector.update_task_status(task_id, "Iniciando", "Preparando entorno de ejecución.")
                
                # Buscar información de Jira para esta tarea específica
                from tools import jira_wrapper
                
                summary = f"Resolver ticket {task_id}"
                description = "Cargar y resolver ticket."
                comments_list = []
                try:
                    if jira_wrapper and hasattr(jira_wrapper, 'jira'):
                        j_issue = jira_wrapper.jira.issue(task_id)
                        fields = j_issue.get("fields", {})
                        summary = fields.get("summary") or "Sin resumen"
                        description = fields.get("description") or "Sin descripción"
                        comments = fields.get("comment", {}).get("comments", [])
                        for c in comments:
                            author = c.get("author", {}).get("displayName", "Unknown")
                            body = c.get("body", "")
                            comments_list.append(f"   [{author}]: {body}")
                except Exception as e:
                    print(f"Error cargando detalles del ticket: {e}")
                    
                comments_str = "\n".join(comments_list) if comments_list else "Sin comentarios."
                
                sprint_goal = f"Completar y finalizar la tarea {task_id}: {summary}. "
                jira_ctx = f"""--- TICKET JIRA: {task_id} ---
Summary: {summary}
Description: {description}
Historial de Comentarios:
{comments_str}
-------------------------"""
                
                connector.update_task_status(task_id, "Desarrollando", f"Ejecutando crews de diseño y código para {task_id}.")
                
                codebase_context = generate_codebase_context()
                
                try:
                    res = execute_crew_locally(sprint_goal, codebase_context, jira_ctx)
                    print(f"\n✅ [Worker {connector.instance_id}]: Tarea {task_id} completada con éxito.")
                    connector.update_task_status(task_id, "Finalizada", f"La tarea {task_id} fue resuelta y validada.")
                except Exception as e:
                    print(f"❌ [Worker {connector.instance_id}] ERROR en ejecución: {e}")
                    connector.update_task_status(task_id, "Fallida", f"Error: {e}")
                    # Quitar lock de tarea para que sea re-procesada
                    connector.redis_client.delete(f"scrum:task:{task_id}")
                finally:
                    connector.redis_client.delete(f"scrum:active_task:{connector.instance_id}")
            else:
                # Comprobar si el backlog está marcado como vacío y no hay tareas activas
                backlog_empty = connector.redis_client.get("scrum:backlog_empty") == "true"
                if backlog_empty:
                    current_time = time.time()
                    if not hasattr(connector, 'last_empty_log') or current_time - connector.last_empty_log > 15:
                        print(f"👷 [Worker {connector.instance_id}]: No hay tareas disponibles.")
                        connector.last_empty_log = current_time
            
            time.sleep(2)

    # Lógica de MASTER (Orquestador principal)
    # Hilo para escuchar eventos Pub/Sub de avances de los Workers en tiempo real
    if use_distributed and connector.is_master:
        def listen_events_master():
            try:
                pubsub = connector.redis_client.pubsub()
                pubsub.subscribe("scrum:events")
                for message in pubsub.listen():
                    if message['type'] == 'message':
                        data = json.loads(message['data'])
                        print(f"📡 [Avance - {data['timestamp']}] {data['instance_id']}: {data['message']}")
                        if data.get('event_type') == 'worker_connected':
                            print(f"\n⚡ [👑 Master - Evento]: ¡Nuevo worker detectado ({data['instance_id']})! Rebalanceando tareas pendientes...")
                            connector.rebalance_tasks()
            except Exception:
                pass
        threading.Thread(target=listen_events_master, daemon=True).start()

    while True:
        print(f"\n\n==================================================")
        print(f"🔄 INICIANDO SPRINT #{sprint_number}")
        print(f"==================================================")
        
        # Si estamos en modo distribuido y somos el Master, vigilar los latidos y re-encolar tareas caídas
        if use_distributed and connector.is_master:
            connector.heal_workers_and_tasks()
            connector.rebalance_tasks()
            
        print_jira_sprint_stats()
        print("\n[🤖 Scrum Master]: Revisando tareas pendientes en Jira...")
        pending_issues = check_pending_jira_tasks()
        
        if pending_issues:
            if use_distributed and connector.is_master:
                connector.redis_client.set("scrum:backlog_empty", "false")
                
            print(f"\n[!] ¡Se han encontrado {len(pending_issues)} tareas/bugs PENDIENTES en Jira!")
            
            # Si estamos en modo distribuido y hay trabajadores conectados, repartirles las tareas
            if use_distributed and connector.is_master:
                workers = list(connector.redis_client.smembers("scrum:workers"))
                
                # Si no hay trabajadores, el Master asume la tarea localmente (Standalone)
                if not workers:
                    print("[🤖 Scrum Master]: No hay Workers conectados aún en Redis. Ejecutando localmente...")
                else:
                    print(f"[🤖 Scrum Master]: {len(workers)} Workers activos detectados en Redis. Distribuyendo tareas...")
                    
                    tasks_assigned = 0
                    for i, issue in enumerate(pending_issues):
                        key = issue.get('key')
                        # Verificar si la tarea ya tiene un lock activo
                        active_worker = connector.redis_client.get(f"scrum:task:{key}")
                        if active_worker:
                            # Verificar si ese worker sigue vivo
                            if connector.redis_client.sismember("scrum:workers", active_worker):
                                print(f"    ℹ️ Tarea {key} ya está siendo procesada de forma activa por {active_worker}. Omitiendo.")
                                continue
                            else:
                                # El worker murió, quitar lock
                                connector.redis_client.delete(f"scrum:task:{key}")
                        
                        # Balancear de forma round-robin entre los workers disponibles
                        target_worker = workers[i % len(workers)]
                        connector.send_task(target_worker, key)
                        connector.update_task_status(key, "Asignada", f"Asignada por el Master a {target_worker}")
                        tasks_assigned += 1
                        
                    if tasks_assigned == 0:
                        print("[🤖 Scrum Master]: Todas las tareas pendientes ya están siendo trabajadas activamente. Esperando ciclo...")
                    else:
                        print(f"[🤖 Scrum Master]: ¡Se han distribuido {tasks_assigned} tareas con éxito!")
                        
                    # Esperar antes del siguiente ciclo del Master
                    time.sleep(30)
                    sprint_number += 1
                    continue

            # Ejecución tradicional o fallback síncrono local si no hay workers
            issue_details = []
            backlog_parts = []
            
            for issue in pending_issues:
                key = issue.get('key', 'Unknown')
                summary = issue.get('summary', 'No summary')
                status = issue.get('status', 'Unknown')
                print(f"    📌 [{key}] - {summary} (Estado: {status})")
                
                description = "Sin descripcion."
                comments_list = []
                latest_comment_text = ""
                try:
                    from tools import jira_wrapper
                    if jira_wrapper and hasattr(jira_wrapper, 'jira'):
                        j_issue = jira_wrapper.jira.issue(key)
                        fields = j_issue.get("fields", {})
                        description = fields.get("description") or "Sin descripcion."
                        comments = fields.get("comment", {}).get("comments", [])
                        if comments:
                            latest_c = comments[-1]
                            author = latest_c.get("author", {}).get("displayName", "Unknown")
                            body = latest_c.get("body", "")
                            latest_comment_text = f" - [LATEST COMMENT from {author}]: {body}"
                            for c in comments:
                                c_author = c.get("author", {}).get("displayName", "Unknown")
                                c_body = c.get("body", "")
                                comments_list.append(f"   [{c_author}]: {c_body}")
                except Exception as e:
                    print(f"Warning fetching details for {key}: {e}")
                
                issue_details.append(f"[{key}]: '{summary}'{latest_comment_text}")
                comments_str = "\n".join(comments_list) if comments_list else "Sin comentarios anteriores."
                part = f"""--- TICKET JIRA: {key} ---
Summary: {summary}
Description: {description}
Status en Jira: {status}
Historial de Comentarios:
{comments_str}
-------------------------"""
                backlog_parts.append(part)
                
            jira_backlog_context = "\n\n".join(backlog_parts)
            print("\n[🤖 Scrum Master]: El equipo priorizará la resolución y cierre de estos tickets considerando sus comentarios recientes.")
            current_sprint_goal = "Completar, finalizar y arreglar los errores mencionados en los comentarios de estas tareas pendientes: " + " | ".join(issue_details) + ". IMPORTANT: Use 'Read Jira Issue' tool if you need the full description and older comments."
            initial_feature_set = True
            
        else:
            jira_backlog_context = "Backlog limpio de Jira. Esta es una tarea/funcionalidad completamente nueva."
            if use_distributed and connector.is_master:
                connector.redis_client.set("scrum:backlog_empty", "true")
                print("\n[🤖 Scrum Master]: No hay tareas disponibles.")
                
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
                print_jira_sprint_stats()
                print(f"\n✅ [🤖 Scrum Master]: ¡No hay bugs ni tareas pendientes! Todo ha quedado en estado 'Done'.")
                print("==================================================")
                print(f"[X] CICLO COMPLETADO EXITOSAMENTE TRAS {sprint_number - 1} SPRINTS")
                print("==================================================")
                break
                
        # Generate codebase context
        print("[🤖 Scrum Master]: Generando contexto del código fuente para el equipo...")
        codebase_context = generate_codebase_context()
        
        # Start the local sprint execution (standalone fallback)
        execute_crew_locally(current_sprint_goal, codebase_context, jira_backlog_context)
        
        sprint_number += 1

if __name__ == "__main__":
    run_sprint()
