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

def record_lesson_learned(error_msg, context_area="General"):
    """
    Appends a new lesson learned entry to lessons_learned.md to continuously train
    and improve the Scrum Team from its failures.
    """
    import os
    import time
    lessons_path = r"C:\apps\cloudfly\ai_scrum_team\lessons_learned.md"
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Extract clean error message to keep it token efficient
    clean_err = str(error_msg).split(" - {'error':")[0] # Strip verbose raw JSON structures
    
    entry = f"\n\n## 🔄 Autocorrección y Aprendizaje Continuo ({timestamp}) - Área: {context_area}\n"
    entry += f"*   **Fallo Detectado**: `{clean_err}`\n"
    entry += f"*   **Lección y Acción Correctiva**: Cuando ocurra este error, el equipo debe re-evaluar la sintaxis o variables en juego, limpiar el búfer de rate limits, rotar las claves del pool de OpenRouter de inmediato y simplificar el volumen de datos consultado para reducir la carga de tokens.\n"
    
    try:
        with open(lessons_path, "a", encoding="utf-8") as lf:
            lf.write(entry)
        print(f"🧠 [Memoria Scrum]: Nuevo aprendizaje registrado con éxito en 'lessons_learned.md' sobre: {clean_err}")
    except Exception:
        pass

def scan_and_process_jira_images(j_issue, key):
    """
    Scans a Jira issue for image attachments and launches the asynchronous
    VisionWorker to analyze them in a non-blocking background thread.
    """
    try:
        import os
        fields = j_issue.get("fields", {})
        attachments = fields.get("attachment", [])
        if not attachments:
            return
            
        from vision_worker import VisionWorker
        worker = VisionWorker()
        
        for att in attachments:
            filename = att.get("filename", "")
            ext = os.path.splitext(filename)[1].lower()
            if ext in ('.png', '.jpg', '.jpeg', '.gif'):
                att_id = att.get("id")
                content_url = att.get("content")
                # Trigger non-blocking vision analysis in background thread
                worker.analyze_comment_image_async(key, att_id, filename, content_url)
    except Exception as e:
        print(f"[!] Advertencia al buscar imágenes adjuntas: {e}")

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

def get_relevant_past_stories(sprint_goal, limit=2):
    """
    Performs a lightweight keyword/token overlap search against past_stories_db.json
    to retrieve the top matching past stories dynamically, preventing token bloat.
    """
    import os
    import json
    import re
    
    db_path = r"C:\apps\cloudfly\ai_scrum_team\past_stories_db.json"
    if not os.path.exists(db_path):
        return ""
        
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            stories = json.load(f)
            
        if not stories:
            return ""
            
        # Clean and tokenise the goal
        stop_words = {"de", "la", "el", "en", "y", "a", "los", "las", "para", "con", "un", "una", "del", "por", "que", "se", "al"}
        goal_tokens = set(re.findall(r'\w+', sprint_goal.lower())) - stop_words
        
        scored_stories = []
        for s in stories:
            # Combine fields to search
            search_text = (s.get("summary", "") + " " + s.get("description", "") + " " + s.get("lessons", "")).lower()
            story_tokens = set(re.findall(r'\w+', search_text))
            
            # Jaccard / Overlap similarity
            intersection = goal_tokens.intersection(story_tokens)
            score = len(intersection)
            
            # Boost score for exact matches on key technical terms
            tech_terms = ["kafka", "whatsapp", "mysql", "evolution", "freeswitch", "frontend", "next", "role", "admin"]
            for term in tech_terms:
                if term in sprint_goal.lower() and term in search_text:
                    score += 3
                    
            if score > 0:
                scored_stories.append((score, s))
                
        # Sort by score descending
        scored_stories.sort(key=lambda x: x[0], reverse=True)
        top_matches = [item[1] for item in scored_stories[:limit]]
        
        if not top_matches:
            # Fallback to last 2 if no search overlap
            top_matches = stories[:limit]
            
        # Format as Markdown
        ctx = []
        for s in top_matches:
            ctx.append(f"### 📌 [{s.get('key')}] {s.get('summary')}")
            ctx.append(f"*   **Descripción**: {s.get('description')}")
            ctx.append(f"*   **Solución Aplicada**: {s.get('solution')}")
            ctx.append(f"*   **Lección Histórica**: {s.get('lessons')}")
            ctx.append("")
            
        return "\n".join(ctx)
    except Exception as e:
        return f"Error al recuperar memoria de historias pasadas: {e}"

def generate_codebase_context(sprint_goal=""):
    r"""
    Scans the C:\apps\cloudfly directory tree at a limited depth of level 1 and generates a clean,
    highly optimized markdown context representation to be injected into agent prompts.
    This prevents overloading the LLM's context window and solves empty response errors,
    guiding agents to read folders and files in parts using their native tools.
    """
    base_dir = r"C:\apps\cloudfly"
    exclude_dirs = {
        '.git', 'node_modules', '__pycache__', 'venv', '.env', 'db', '.gemini', 'tmp',
        '.cloudflared', '.vscode', 'chatwoot', 'apache2', 'debug_reports', 'vuexy', 'terraform',
        'screenshots', 'docs'
    }
    exclude_extensions = {'.log', '.txt', '.tar', '.zip', '.exe', '.png', '.jpg', '.jpeg', '.gif'}
    
    if not os.path.exists(base_dir):
        return "No existing code found (C:\\apps\\cloudfly directory does not exist or is empty)."
        
    context = []
    
    # 0. Load relevant past completed stories to boost context intelligence (RAG Semántico)
    if sprint_goal:
        past_stories_ctx = get_relevant_past_stories(sprint_goal)
        if past_stories_ctx:
            context.append("=== 🧠 CONTEXTO HISTÓRICO Y MEMORIA DE HISTORIAS PASADAS RELACIONADAS ===")
            context.append(past_stories_ctx)
            context.append("=======================================================================\n")
    
    # 0. Load last 3 lessons learned only (keep context small for Groq TPM limits)
    lessons_path = r"C:\apps\cloudfly\ai_scrum_team\lessons_learned.md"
    if os.path.exists(lessons_path):
        try:
            with open(lessons_path, 'r', encoding='utf-8') as lf:
                lessons_content = lf.read()
            # Keep only last 2000 chars to avoid TPM overflow
            if len(lessons_content) > 2000:
                lessons_content = "..." + lessons_content[-2000:]
            context.append("=== 🧠 LECCIONES RECIENTES (MEMORIA SCRUM) ===")
            context.append(lessons_content)
            context.append("=============================================\n")
        except Exception:
            pass
    
    # 1. Read a short preview of spec.md (800 chars max to save Groq TPM budget)
    spec_path = os.path.join(base_dir, "spec.md")
    if os.path.exists(spec_path):
        try:
            with open(spec_path, 'r', encoding='utf-8') as sf:
                spec_content = sf.read()
            context.append("=== SPEC.MD (resumen - usa 'Read Code File' para ver completo) ===")
            context.append(spec_content[:800])
            context.append("[...] Usa la herramienta 'Read Code File' con path=C:\\apps\\cloudfly\\spec.md para leer el spec completo.")
            context.append("================================================\n")
        except Exception as e:
            print(f"[!] Advertencia al leer spec.md para el contexto: {e}")

    context.append("=== EXISTING DIRECTORY STRUCTURE (ROOT LEVEL ONLY) ===")
    context.append("📁 C:\\apps\\cloudfly\\")
    
    # Only list root-level directories and key root config files - NO file listing inside subdirs
    # This prevents the agent from getting lost in a massive file tree and exhausting iterations
    try:
        root_items = sorted(os.listdir(base_dir))
        key_root_exts = {'.json', '.yml', '.yaml', '.md', '.py', '.sql', '.env'}
        for item in root_items:
            if item.startswith('.') or item in exclude_dirs:
                continue
            item_path = os.path.join(base_dir, item)
            if os.path.isdir(item_path):
                # Count files inside for reference, but don't list them
                try:
                    n_files = len([f for f in os.listdir(item_path) if os.path.isfile(os.path.join(item_path, f))])
                    context.append(f"    📁 {item}/  ({n_files} files — use 'List Directory Files' tool to explore)")
                except Exception:
                    context.append(f"    📁 {item}/")
            else:
                ext = os.path.splitext(item)[1].lower()
                if ext in key_root_exts:
                    try:
                        size_bytes = os.path.getsize(item_path)
                        context.append(f"    📄 {item} ({size_bytes} bytes)")
                    except Exception:
                        context.append(f"    📄 {item}")
    except Exception as e:
        context.append(f"[!] Error al listar directorio raíz: {e}")
            
    context.append("\n[!] INSTRUCCIÓN CRÍTICA DEL SCRUM MASTER:")
    context.append("El árbol de archivos ha sido comprimido al nivel raíz para evitar desbordes de contexto.")
    context.append("USA las herramientas 'List Directory Files' y 'Read Code File' para explorar subcarpetas y leer archivos específicos.")
    context.append("NO intentes explorar el árbol completo manualmente — céntrate en completar la tarea del sprint.")
    return "\n".join(context)

def summarize_context_with_ollama(raw_context: str, label: str = "contexto") -> str:
    """
    Uses local Ollama (llama3.2) to compress a large context string into a concise
    summary of max ~2000 tokens. Falls back to truncation if Ollama is unavailable.
    Logs elapsed time so we can measure Ollama's summarization speed.
    """
    import time
    import requests

    OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    MAX_CHARS_BEFORE_SUMMARY = 6000  # ~1500 tokens — only summarize if larger
    TARGET_SUMMARY_WORDS = 350       # ~500 tokens output

    original_chars = len(raw_context)
    print(f"\n📏 [Context Manager]: '{label}' tiene {original_chars} chars ({original_chars//4} tokens aprox.)")

    if original_chars <= MAX_CHARS_BEFORE_SUMMARY:
        print(f"✅ [Context Manager]: Contexto dentro del límite — no se requiere resumen.")
        return raw_context

    print(f"⚠️  [Context Manager]: Contexto demasiado grande para Groq (límite ~10K tokens).")
    print(f"🏠 [Context Manager]: Enviando a Ollama local para resumir ({original_chars} chars → ~{TARGET_SUMMARY_WORDS*5} chars)...")

    prompt = (
        f"Eres un asistente técnico. Resume el siguiente contexto de forma concisa en español, "
        f"manteniendo TODA la información técnica clave (nombres de endpoints, rutas de archivos, "
        f"errores específicos, IDs de tickets, stack tecnológico). "
        f"El resumen debe tener máximo {TARGET_SUMMARY_WORDS} palabras.\n\n"
        f"CONTEXTO:\n{raw_context[:12000]}\n\nRESUMEN CONCISO:"
    )

    t_start = time.time()
    try:
        resp = requests.post(
            f"{OLLAMA_BASE}/api/chat",
            json={
                "model": "llama3.2:latest",
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"num_predict": 600, "temperature": 0.1}
            },
            timeout=120
        )
        elapsed = round(time.time() - t_start, 2)

        if resp.status_code == 200:
            summary = resp.json().get("message", {}).get("content", "").strip()
            summary_chars = len(summary)
            compression = round((1 - summary_chars / original_chars) * 100, 1)
            print(f"✅ [Context Manager]: Resumen generado en {elapsed}s")
            print(f"   📉 Compresión: {original_chars} → {summary_chars} chars ({compression}% reducción)")
            return f"[RESUMEN AUTOMÁTICO por Ollama en {elapsed}s]:\n{summary}"
        else:
            elapsed = round(time.time() - t_start, 2)
            print(f"❌ [Context Manager]: Ollama respondió {resp.status_code} en {elapsed}s — usando truncado de emergencia.")
    except requests.exceptions.Timeout:
        elapsed = round(time.time() - t_start, 2)
        print(f"⏱️  [Context Manager]: Ollama timeout tras {elapsed}s — usando truncado de emergencia.")
    except requests.exceptions.ConnectionError:
        elapsed = round(time.time() - t_start, 2)
        print(f"🔌 [Context Manager]: Ollama no disponible en {elapsed}s — usando truncado de emergencia.")
    except Exception as ex:
        elapsed = round(time.time() - t_start, 2)
        print(f"❌ [Context Manager]: Error Ollama ({ex}) en {elapsed}s — usando truncado de emergencia.")

    # Emergency fallback: hard truncate
    truncated = raw_context[:MAX_CHARS_BEFORE_SUMMARY]
    print(f"✂️  [Context Manager]: Contexto truncado a {len(truncated)} chars como fallback.")
    return truncated


def run_sprint():
    import threading
    import time
    import json
    
    print("==================================================")
    print(">>> AI AGILE TEAM: CONTINUOUS INTEGRATION STARTED")
    print("==================================================")
    
    # 1. Inicializar conector de Redis
    connector = ScrumConnector()
    
    # Iniciar Worker de salud de modelos en segundo plano y realizar primer chequeo síncronamente
    try:
        from model_health_worker import start_daemon_worker, run_health_check_cycle
        print("🔍 [Scrum Master]: Inicializando Health Checker de Modelos síncronamente...")
        run_health_check_cycle()
        start_daemon_worker()
    except Exception as e:
        print(f"[!] Error al iniciar el Health Checker de Modelos: {e}")

    def get_healthiest_model():
        import json
        base_dir = os.path.dirname(os.path.abspath(__file__))
        status_path = os.path.join(base_dir, "model_health_status.json")
        if os.path.exists(status_path):
            try:
                with open(status_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("healthiest_model", "openrouter/openrouter/owl-alpha")
            except Exception:
                pass
        return "openrouter/openrouter/owl-alpha"

    def configure_agent_llm(agent, active_key, model_name):
        if not hasattr(agent, 'llm') or not agent.llm:
            return
        from crewai import LLM as CrewLLM
        ollama_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        if model_name.startswith("ollama/"):
            # Local Ollama — no API key needed, point to local server
            agent.llm = CrewLLM(
                model=model_name,
                base_url=f"{ollama_base}/v1",
                api_key="ollama",  # LiteLLM requires a non-empty key
                temperature=0.2
            )
        elif model_name.startswith("groq/"):
            groq_key = os.getenv("GROQ_API_KEY")
            agent.llm = CrewLLM(
                model=model_name,
                api_key=groq_key,
                temperature=0.2
            )
        else:
            agent.llm = CrewLLM(
                model=model_name,
                api_key=active_key,
                base_url="https://openrouter.ai/api/v1",
                temperature=0.2
            )

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
        
    # Balanceador dinámico de cuentas y tokens por worker al iniciar (Ejecutar siempre, incluso en standalone)
    active_key = connector.get_healthy_api_key()
    if active_key:
        current_model = get_healthiest_model()
        print(f"\n🔑 [Balanceador de Cuentas]: Clave primaria asignada desde el pool: ...{active_key[-8:]}")
        print(f"📡 [Model Router]: Modelo más saludable asignado: {current_model}")
        os.environ["OPENROUTER_API_KEY"] = active_key
        os.environ["OPENAI_API_KEY"] = active_key
        
        # Actualizar todos los agentes en memoria con la clave activa y el modelo más saludable
        for agent in [product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer]:
            configure_agent_llm(agent, active_key, current_model)

    sprint_number = 1
    initial_feature_set = False
    user_feature = ""

    # Función auxiliar para ejecutar el Crew en local (para Workers o para Master Standalone)
    def execute_crew_locally(sprint_goal, codebase_ctx, JIRA_ctx):
        # Spoof internal OpenAI variables so CrewAI memory analyzer uses OpenRouter (ZOO Owl Alpha) for free!
        os.environ["OPENAI_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "sk-or-...")
        os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_MODEL_NAME"] = "openrouter/openrouter/free"
        
        # Check if DevOps should be excluded based on Jira or Sprint goal comments
        exclude_devops = False
        issue_text = (JIRA_ctx + " " + sprint_goal).lower()
        if "devops no trabaja" in issue_text or "excluir devops" in issue_text:
            print("\n🚫 [Scrum Master]: Se detectó que DevOps no trabaja en esta historia. Excluyendo al DevOps Engineer del equipo de este Sprint...")
            exclude_devops = True

        agents_list = [product_owner, system_architect, software_developer, frontend_developer, technical_writer, qa_engineer]
        tasks_list = [sprint_planning, research_task, development_task, frontend_development_task, documentation_task, quality_assurance]

        if not exclude_devops:
            agents_list.insert(4, devops_engineer)
            tasks_list.insert(4, deployment_prep)
            
        scrum_crew = Crew(
            agents=agents_list,
            tasks=tasks_list,
            process=Process.sequential,
            memory=False,
            cache=False,
            verbose=True
        )
        
        max_retries = 6
        retry_count = 0
        result = None
        
        while retry_count < max_retries:
            try:
                result = scrum_crew.kickoff(inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx,
                    "jira_backlog_context": JIRA_ctx
                })
                break # Success! Exit the retry loop
            except Exception as e:
                err_msg = str(e)
                if "429" in err_msg or "rate limit" in err_msg.lower():
                    retry_count += 1
                    current_key = os.environ.get("OPENROUTER_API_KEY")
                    print(f"\n⚠️ [Rotación de API Key - Intento {retry_count}/{max_retries}]: Se detectó un error de Rate Limit (429) en la clave ...{current_key[-8:] if current_key else 'None'}.")
                    
                    # Marcar la clave actual como limitada y obtener una nueva clave saludable
                    new_key = connector.get_healthy_api_key(current_key=current_key, mark_rate_limited=True)
                    if new_key and new_key != current_key:
                        print(f"🔄 Rotando automáticamente a una nueva clave saludable del pool: ...{new_key[-8:]}")
                        os.environ["OPENROUTER_API_KEY"] = new_key
                        os.environ["OPENAI_API_KEY"] = new_key
                        
                        # Update all agents' LLM objects in-place with the healthiest model
                        current_model = get_healthiest_model()
                        print(f"📡 [Model Router]: Cambiando al modelo más saludable: {current_model}")
                        for agent in [product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer]:
                            configure_agent_llm(agent, new_key, current_model)
                                    
                        print("🔄 Reintentando ejecución del Crew con la nueva clave saludable...")
                    else:
                        if retry_count >= max_retries:
                            raise e
                        print("⏳ No hay nuevas claves diferentes en el pool o Redis está desconectado. Esperando 10 segundos antes de reintentar...")
                        import time
                        time.sleep(10)
                else:
                    raise e
        
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
                        # Scan and process image attachments in background (non-blocking)
                        scan_and_process_jira_images(j_issue, task_id)
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
                
                codebase_context = generate_codebase_context(sprint_goal)
                
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

            # ── ONE TICKET AT A TIME ─────────────────────────────────────────────
            # Procesar cada ticket individualmente para mantener el contexto pequeño
            # y no superar el límite de TPM de Groq (12K tokens).
            print(f"\n🗂️  [Scrum Master]: Procesando {len(pending_issues)} ticket(s) UNO POR UNO para optimizar contexto...")

            for ticket_idx, issue in enumerate(pending_issues, start=1):
                key   = issue.get('key', 'Unknown')
                summary = issue.get('summary', 'No summary')
                status  = issue.get('status', 'Unknown')

                print(f"\n{'='*50}")
                print(f"🎫 [Ticket {ticket_idx}/{len(pending_issues)}]: {key} — {summary}")
                print(f"{'='*50}")

                # ── Fetch full Jira details for this single ticket ────────────
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
                        print(f"   📝 Descripción: {len(description)} chars | Comentarios: {len(comments)}")
                        if comments:
                            latest_c = comments[-1]
                            author = latest_c.get("author", {}).get("displayName", "Unknown")
                            body   = latest_c.get("body", "")
                            latest_comment_text = f" - [LATEST COMMENT from {author}]: {body}"
                            for c in comments:
                                c_author = c.get("author", {}).get("displayName", "Unknown")
                                c_body   = c.get("body", "")
                                comments_list.append(f"   [{c_author}]: {c_body}")
                            scan_and_process_jira_images(j_issue, key)
                except Exception as e:
                    print(f"   ⚠️  Warning al obtener detalles de {key}: {e}")

                comments_str = "\n".join(comments_list) if comments_list else "Sin comentarios anteriores."
                raw_jira_ctx = f"""--- TICKET JIRA: {key} ---
                    Summary: {summary}
                    Description: {description}
                    Status en Jira: {status}
                    Historial de Comentarios:
                    {comments_str}
-------------------------"""

                # ── Summarize Jira context with Ollama if too large ───────────
                jira_backlog_context = summarize_context_with_ollama(
                    raw_jira_ctx, label=f"Jira {key}"
                )

                sprint_goal_ticket = (
                    f"Completar y cerrar el ticket {key}: '{summary}'{latest_comment_text}. "
                    f"IMPORTANT: Usa la herramienta 'Read Jira Issue' si necesitas la descripción completa."
                )
                initial_feature_set = True

                # ── Generate codebase context & summarize if needed ───────────
                print(f"\n[🤖 Scrum Master]: Generando contexto del código fuente para {key}...")
                raw_codebase_ctx = generate_codebase_context(sprint_goal_ticket)
                codebase_context = summarize_context_with_ollama(
                    raw_codebase_ctx, label="codebase context"
                )

                # ── Execute crew for this single ticket ───────────────────────
                print(f"\n🚀 [Scrum Master]: Lanzando crew para {key}...")
                try:
                    execute_crew_locally(sprint_goal_ticket, codebase_context, jira_backlog_context)
                    print(f"\n✅ [Scrum Master]: Ticket {key} procesado exitosamente.")
                    sprint_number += 1
                except Exception as crew_err:
                    print(f"\n❌ [Scrum Master]: Error en crew para {key}: {crew_err}")
                    record_lesson_learned(crew_err, f"CrewExecution-{key}")
                    print(f"🔄 [Scrum Master]: Limpiando rate limits y continuando con el siguiente ticket...")
                    if hasattr(connector, 'local_rate_limits'):
                        connector.local_rate_limits.clear()
                    if connector.redis_client:
                        try:
                            for rkey in connector.redis_client.scan_iter("scrum:rate_limit:*"):
                                connector.redis_client.delete(rkey)
                        except Exception:
                            pass
                    print("⏳ Esperando 15s antes del siguiente ticket...")
                    time.sleep(15)

            # All tickets processed for this sprint cycle
            continue

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

            # ── Nueva funcionalidad (backlog vacío) ───────────────────────────
            print("[🤖 Scrum Master]: Generando contexto del código fuente...")
            raw_codebase_ctx = generate_codebase_context(current_sprint_goal)
            codebase_context = summarize_context_with_ollama(raw_codebase_ctx, label="codebase context")

            try:
                execute_crew_locally(current_sprint_goal, codebase_context, jira_backlog_context)
                sprint_number += 1
            except Exception as crew_err:
                print(f"\n❌ [Scrum Master]: Error crítico durante la ejecución del Crew: {crew_err}")
                record_lesson_learned(crew_err, "CrewExecution")
                print("🔄 [Scrum Master]: Reiniciando tras fallo...")
                if hasattr(connector, 'local_rate_limits'):
                    connector.local_rate_limits.clear()
                if connector.redis_client:
                    try:
                        for rkey in connector.redis_client.scan_iter("scrum:rate_limit:*"):
                            connector.redis_client.delete(rkey)
                    except Exception:
                        pass
                print("⏳ Esperando 30 segundos antes de reiniciar...")
                time.sleep(30)

if __name__ == "__main__":
    run_sprint()
