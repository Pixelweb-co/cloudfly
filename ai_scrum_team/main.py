import os
import sys
import threading
import time
import json
import concurrent.futures
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Optional

# Force UTF-8 encoding for Windows terminals to support emojis
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from crewai import Crew, Process

# Load environment variables (API keys)
load_dotenv()

# Set required environment variable for CrewAI Embeddings (NVIDIA Llama Nemotron Embed VL 1B V2 - free)
os.environ["EMBEDDINGS_OLLAMA_MODEL_NAME"] = "nvidia/llama-nemotron-embed-vl-1b-v2:free"

from agents import product_owner, system_architect, software_developer, qa_engineer, devops_engineer, technical_writer, frontend_developer, marketing_specialist
from tasks import sprint_planning, research_task, development_task, quality_assurance, deployment_prep, documentation_task, frontend_development_task, marketing_task
from connector import ScrumConnector
from sprint_state_analyser import analyse_sprint_state, get_issue_resume_context
from kafka_consumer import poll_kafka_queue, format_kafka_message_for_sprint, is_kafka_configured

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
    
    # 0. Load last 3 lessons learned only (keep context small for LLM TPM limits)
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
    
    # 1. Read a short preview of spec.md (800 chars max to save LLM TPM budget)
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
    #try:
        # root_items = sorted(os.listdir(base_dir))
        # key_root_exts = {'.json', '.yml', '.yaml', '.md', '.py', '.sql', '.env'}
        # for item in root_items:
        #     if item.startswith('.') or item in exclude_dirs:
        #         continue
        #     item_path = os.path.join(base_dir, item)
        #     if os.path.isdir(item_path):
        #         # count files inside for reference, but don't list them
        #         try:
        #             n_files = len([f for f in os.listdir(item_path) if os.path.isfile(os.path.join(item_path, f))])
        #             context.append(f"    📁 {item}/  ({n_files} files — use 'list directory files' tool to explore)")
        #         except exception:
        #             context.append(f"    📁 {item}/")
        #     else:
        #         ext = os.path.splitext(item)[1].lower()
        #         if ext in key_root_exts:
        #             try:
        #                 size_bytes = os.path.getsize(item_path)
        #                 context.append(f"    📄 {item} ({size_bytes} bytes)")
        #             except exception:
        #                 context.append(f"    📄 {item}")
    #except Exception as e:
     #   context.append(f"[!] Error al listar directorio raíz: {e}")
            
    context.append("\n[!] INSTRUCCIÓN CRÍTICA DEL SCRUM MASTER:")
    context.append("El árbol de archivos ha sido comprimido al nivel raíz para evitar desbordes de contexto.")
    context.append("USA las herramientas 'List Directory Files' y 'Read Code File' para explorar subcarpetas y leer archivos específicos.")
    context.append("NO intentes explorar el árbol completo manualmente — céntrate en completar la tarea del sprint.")
    return "\n".join(context)

def compact_with_owl_alpha(raw_context: str, label: str = "contexto") -> str:
    """
    Uses the configured model (MODEL_DEFAULT from .env) to compress a large context 
    string into a concise summary of max ~600 tokens. Falls back to truncation if the API is unavailable.
    """
    import time
    import requests

    MAX_CHARS_BEFORE_SUMMARY = 6000  # ~1500 tokens — only summarize if larger
    
    # Leer configuración del modelo desde .env
    model_default = os.getenv("MODEL_DEFAULT", "openrouter/owl-alpha")
    if "/" in model_default:
        provider, model_name = model_default.split("/", 1)
    else:
        provider = "openrouter"
        model_name = model_default
    
    # Configurar según proveedor
    if provider == "openai":
        api_base = "https://api.openai.com/v1"
        api_key = os.getenv("OPENAI_API_KEY") or ""
        llm_model = model_name
    elif provider == "groq":
        api_base = "https://openrouter.ai/api/v1"
        api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENROUTER_API_KEY") or ""
        llm_model = f"groq/{model_name}"
    else:
        api_base = "https://openrouter.ai/api/v1"
        api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
        llm_model = f"openrouter/{model_name}"

    original_chars = len(raw_context)
    print(f"\n📏 [Context Compactor]: '{label}' tiene {original_chars} chars ({original_chars//4} tokens aprox.)")
    print(f"🤖 [Context Compactor]: Usando {llm_model} via {provider}")

    if original_chars <= MAX_CHARS_BEFORE_SUMMARY:
        print(f"✅ [Context Compactor]: Contexto dentro del límite — no se requiere resumen.")
        return raw_context

    print(f"⚠️  [Context Compactor]: Contexto grande. Resumiendo con {llm_model}...")

    prompt = (
        f"Eres un asistente técnico. Resume el siguiente contexto de forma concisa en español, "
        f"manteniendo TODA la información técnica clave (nombres de endpoints, rutas de archivos, "
        f"errores específicos, IDs de tickets, stack tecnológico, comentarios de agentes). "
        f"Solo devuelve el resumen, sin introducciones.\n\n"
        f"CONTEXTO:\n{raw_context[:12000]}\n\nRESUMEN CONCISO:"
    )

    t_start = time.time()
    try:
        resp = requests.post(
            f"{api_base}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": llm_model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 600,
                "temperature": 0.1
            },
            timeout=120
        )
        elapsed = round(time.time() - t_start, 2)

        if resp.status_code == 200:
            data = resp.json()
            summary = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            summary_chars = len(summary)
            compression = round((1 - summary_chars / original_chars) * 100, 1)
            print(f"✅ [Context Compactor]: Resumen generado en {elapsed}s")
            print(f"   📉 Compresión: {original_chars} → {summary_chars} chars ({compression}% reducción)")
            return f"[RESUMEN AUTOMATICO por {llm_model} en {elapsed}s]:\n{summary}"
        else:
            print(f"❌ [Context Compactor]: {llm_model} respondió {resp.status_code} en {elapsed}s — usando truncado.")
    except requests.exceptions.Timeout:
        elapsed = round(time.time() - t_start, 2)
        print(f"⏱️  [Context Compactor]: Timeout tras {elapsed}s — usando truncado.")
    except Exception as ex:
        elapsed = round(time.time() - t_start, 2)
        print(f"❌ [Context Compactor]: Error ({ex}) en {elapsed}s — usando truncado.")

    # Emergency fallback: hard truncate
    truncated = raw_context[:MAX_CHARS_BEFORE_SUMMARY]
    print(f"✂️  [Context Compactor]: Contexto truncado a {len(truncated)} chars como fallback.")
    return truncated


def compact_sprint_context(sprint_state: dict, sprint_goal: str, jira_backlog_context: str) -> str:
    """
    Compacts all the sprint context (Jira stories, comments, status) into a concise
    summary using owl-alpha. This is called AFTER the Scrum Master reviews Jira and
    BEFORE passing context to the agent crew.
    
    :param sprint_state: dict from analyse_sprint_state() with state, issues, resume_context
    :param sprint_goal: the sprint goal string
    :param jira_backlog_context: raw Jira context string
    :return: compacted context string ready for agent consumption
    """
    import time
    t_start = time.time()
    
    state = sprint_state.get("state", "unknown")
    issues = sprint_state.get("issues", [])
    resume_ctx = sprint_state.get("resume_context", {})
    
    # Build a structured but compact representation
    compact_parts = []
    compact_parts.append(f"OBJETIVO DEL SPRINT: {sprint_goal}")
    compact_parts.append(f"ESTADO: {state}")
    compact_parts.append(f"ISSUES RELEVANTES: {len(issues)}")
    
    # Add issue summaries (max 5 issues, truncated)
    for i, issue in enumerate(issues[:5]):
        key = issue.get("key", "Unknown")
        summary = issue.get("summary", "Sin título")
        status = issue.get("status", "Unknown")
        compact_parts.append(f"\n  [{key}] {summary} (status: {status})")
        
        # Add resume context (comments) if available — truncated
        if key in resume_ctx:
            rctx = resume_ctx[key]
            description = rctx.get("description", "")
            if description:
                compact_parts.append(f"  Descripción: {description[:200]}")
            comments = rctx.get("comments", [])
            if comments:
                compact_parts.append(f"  Comentarios recientes:")
                for c in comments[-3:]:  # last 3 comments only
                    c_short = c[:150] + "..." if len(c) > 150 else c
                    compact_parts.append(f"    - {c_short}")
    
    # Add raw Jira context (truncated)
    if jira_backlog_context:
        compact_parts.append(f"\nCONTEXTO JIRA ADICIONAL:")
        compact_parts.append(jira_backlog_context[:1000])
    
    raw_compact = "\n".join(compact_parts)
    
    # Use owl-alpha to further compact if still too large
    result = compact_with_owl_alpha(raw_compact, label="sprint context")
    
    elapsed = round(time.time() - t_start, 1)
    print(f"📦 [Sprint Context] Compactado en {elapsed}s")
    
    return result


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
                    return data.get("healthiest_model", "openrouter/owl-alpha")
            except Exception:
                pass
        return "openrouter/owl-alpha"

    def configure_agent_llm(agent, active_key, model_name):
        """Configure agent LLM. All models go through OpenRouter."""
        if not hasattr(agent, 'llm') or not agent.llm:
            return
        from crewai import LLM as CrewLLM
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

    # ── Execution Mode: PARALLEL (default) or SEQUENTIAL ─────────────────
    # Set to False to use the original sequential Crew execution
    USE_PARALLEL = os.environ.get("SCRUM_PARALLEL_MODE", "true").lower() == "true"
    if USE_PARALLEL:
        print("⚡ [Scrum Master]: Modo PARALELO activado — los agentes trabajarán en fases concurrentes.")
    else:
        print("📋 [Scrum Master]: Modo SECUENCIAL activado — los agentes trabajarán uno tras otro.")

    # ── Shared state for parallel execution ──────────────────────────────
    _parallel_results = {}
    _parallel_lock = threading.Lock()

    def _store_result(key: str, value: str):
        """Thread-safe storage for results shared across parallel phases."""
        with _parallel_lock:
            _parallel_results[key] = value

    def _get_result(key: str, default: str = "") -> str:
        """Thread-safe retrieval of shared results."""
        with _parallel_lock:
            return _parallel_results.get(key, default)

    def _run_single_task_with_retry(crew_instance, inputs, task_label, max_retries=6):
        """Run a single Crew task with retry logic and API key rotation."""
        retry_count = 0
        result = None
        while retry_count < max_retries:
            try:
                result = crew_instance.kickoff(inputs=inputs)
                return result
            except Exception as e:
                err_msg = str(e)
                retryable = (
                    "429" in err_msg
                    or "rate limit" in err_msg.lower()
                    or "Invalid response from LLM call" in err_msg
                    or "None or empty" in err_msg
                    or "401" in err_msg
                    or "unauthorized" in err_msg.lower()
                )
                if retryable:
                    retry_count += 1
                    if retry_count >= max_retries:
                        raise e
                    current_key = os.environ.get("OPENROUTER_API_KEY")
                    print(f"\n⚠️ [{task_label} - Intento {retry_count}/{max_retries}]: Error LLM: {err_msg[:120]}")
                    new_key = connector.get_healthy_api_key(current_key=current_key, mark_rate_limited=True)
                    if new_key and new_key != current_key:
                        print(f"🔄 [{task_label}]: Rotando API key: ...{new_key[-8:]}")
                        os.environ["OPENROUTER_API_KEY"] = new_key
                        os.environ["OPENAI_API_KEY"] = new_key
                        current_model = get_healthiest_model()
                        for agent in [product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer]:
                            configure_agent_llm(agent, new_key, current_model)
                    else:
                        print(f"⏳ [{task_label}]: Esperando 15s antes de reintentar...")
                        time.sleep(15)
                else:
                    raise e
        return result

    def _print_token_metrics(crew_instance, result):
        """Print token usage metrics from a Crew execution."""
        try:
            metrics = getattr(crew_instance, 'usage_metrics', None)
            if not metrics and hasattr(result, 'token_usage'):
                metrics = result.token_usage
            if not metrics and hasattr(result, 'usage_metrics'):
                metrics = result.usage_metrics
            if metrics:
                if isinstance(metrics, dict):
                    total = metrics.get('total_tokens', 0)
                    prompt = metrics.get('prompt_tokens', 0)
                    completion = metrics.get('completion_tokens', 0)
                    success = metrics.get('successful_requests', 0)
                else:
                    total = getattr(metrics, 'total_tokens', 0)
                    prompt = getattr(metrics, 'prompt_tokens', 0)
                    completion = getattr(metrics, 'completion_tokens', 0)
                    success = getattr(metrics, 'successful_requests', 0)
                print(f"\n📊 [Tokens]: Solicitudes={success}, Prompt={prompt}, Completion={completion}, Total={total}")
        except Exception:
            pass

    # ── Parallel Crew Execution ──────────────────────────────────────────
    def execute_crew_parallel(sprint_goal, codebase_ctx, JIRA_ctx):
        """
        Execute the Scrum team in PARALLEL PHASES using ThreadPoolExecutor.
        
        Phase 1 (Sequential): Sprint Planning — PO creates Jira tasks.
        Phase 2 (Parallel):  Research (Architect) + Backend Dev + Frontend Dev
                            — Architect researches while developers start coding.
        Phase 3 (Parallel):  DevOps + Documentation + QA
                            — Deploy, document, and test simultaneously.
        
        This reduces total sprint time by ~60% compared to fully sequential execution.
        """
        os.environ["OPENAI_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "sk-or-...")
        os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_MODEL_NAME"] = "openrouter/owl-alpha"

        # Clear shared results from previous sprint
        with _parallel_lock:
            _parallel_results.clear()

        exclude_devops = False
        issue_text = (JIRA_ctx + " " + sprint_goal).lower()
        if "devops no trabaja" in issue_text or "excluir devops" in issue_text:
            print("\n🚫 [Scrum Master]: DevOps excluido de este sprint.")
            exclude_devops = True

        print("\n" + "=" * 60)
        print("⚡ [Scrum Master]: INICIANDO EJECUCIÓN PARALELA DEL SPRINT")
        print("=" * 60)

        # ═══════════════════════════════════════════════════════════════
        # PHASE 1: Sprint Planning (Sequential — must complete first)
        # ═══════════════════════════════════════════════════════════════
        print("\n📋 [Fase 1/3] Sprint Planning — Product Owner creando tareas en Jira...")

        phase1_crew = Crew(
            agents=[product_owner],
            tasks=[sprint_planning],
            process=Process.sequential,
            memory=False,
            cache=False,
            verbose=True
        )

        try:
            phase1_result = _run_single_task_with_retry(
                phase1_crew,
                inputs={"feature": sprint_goal, "codebase_context": codebase_ctx, "jira_backlog_context": JIRA_ctx},
                task_label="Sprint Planning"
            )
            _store_result("planning", str(phase1_result))
            _print_token_metrics(phase1_crew, phase1_result)
            print("✅ [Fase 1] Sprint Planning completado.")
        except Exception as e:
            print(f"❌ [Fase 1] Error en Sprint Planning: {e}")
            raise

        # ═══════════════════════════════════════════════════════════════
        # PHASE 2: Research + Development (PARALLEL)
        # Architect researches while Backend and Frontend devs code
        # ═══════════════════════════════════════════════════════════════
        print("\n🔧 [Fase 2/3] Ejecutando en PARALELO: Architect + Backend Dev + Frontend Dev...")

        def run_research():
            """Phase 2a: System Architect researches and creates blueprint."""
            print("   🔍 [Architect Thread]: Iniciando investigación técnica...")
            crew = Crew(
                agents=[system_architect],
                tasks=[research_task],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx,
                    "jira_backlog_context": JIRA_ctx + "\n\n[PLANNING RESULT]: " + _get_result("planning", "")
                },
                task_label="Research"
            )
            _store_result("research", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [Architect Thread]: Investigación completada.")
            return result

        def run_backend_dev():
            """Phase 2b: Backend Developer writes code."""
            print("   💻 [Backend Dev Thread]: Iniciando desarrollo backend...")
            crew = Crew(
                agents=[software_developer],
                tasks=[development_task],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx,
                    "jira_backlog_context": JIRA_ctx + "\n\n[PLANNING RESULT]: " + _get_result("planning", "")
                },
                task_label="Backend Dev"
            )
            _store_result("backend_dev", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [Backend Dev Thread]: Desarrollo backend completado.")
            return result

        def run_frontend_dev():
            """Phase 2c: Frontend Developer builds UI."""
            print("   🎨 [Frontend Dev Thread]: Iniciando desarrollo frontend...")
            crew = Crew(
                agents=[frontend_developer],
                tasks=[frontend_development_task],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx,
                    "jira_backlog_context": JIRA_ctx + "\n\n[PLANNING RESULT]: " + _get_result("planning", "")
                },
                task_label="Frontend Dev"
            )
            _store_result("frontend_dev", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [Frontend Dev Thread]: Desarrollo frontend completado.")
            return result

        # Execute Phase 2 tasks in parallel using ThreadPoolExecutor
        phase2_futures = {}
        with ThreadPoolExecutor(max_workers=3, thread_name_prefix="Phase2") as executor:
            phase2_futures["research"] = executor.submit(run_research)
            phase2_futures["backend_dev"] = executor.submit(run_backend_dev)
            phase2_futures["frontend_dev"] = executor.submit(run_frontend_dev)

            # Wait for all Phase 2 tasks to complete
            for task_name, future in phase2_futures.items():
                try:
                    future.result()  # This will raise any exceptions from the thread
                except Exception as e:
                    print(f"   ❌ [Fase 2] Error en {task_name}: {e}")
                    raise

        print("✅ [Fase 2] Desarrollo paralelo completado (Architect + Backend + Frontend).")

        # ═══════════════════════════════════════════════════════════════
        # PHASE 3: DevOps + Documentation + QA (PARALLEL)
        # Deploy, document, and test simultaneously
        # ═══════════════════════════════════════════════════════════════
        print("\n🚀 [Fase 3/3] Ejecutando en PARALELO: DevOps + Technical Writer + QA...")

        combined_dev_results = (
            "\n\n[RESEARCH RESULT]: " + _get_result("research", "")
            + "\n\n[BACKEND DEV RESULT]: " + _get_result("backend_dev", "")
            + "\n\n[FRONTEND DEV RESULT]: " + _get_result("frontend_dev", "")
        )

        def run_devops():
            """Phase 3a: DevOps deploys containers."""
            if exclude_devops:
                print("   🚫 [DevOps Thread]: Saltado (excluido).")
                _store_result("devops", "DevOps excluido del sprint.")
                return "DevOps excluido"
            print("   🐳 [DevOps Thread]: Iniciando despliegue...")
            crew = Crew(
                agents=[devops_engineer],
                tasks=[deployment_prep],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx + combined_dev_results,
                    "jira_backlog_context": JIRA_ctx
                },
                task_label="DevOps"
            )
            _store_result("devops", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [DevOps Thread]: Despliegue completado.")
            return result

        def run_documentation():
            """Phase 3b: Technical Writer creates docs."""
            print("   📝 [Docs Thread]: Iniciando documentación...")
            crew = Crew(
                agents=[technical_writer],
                tasks=[documentation_task],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx + combined_dev_results,
                    "jira_backlog_context": JIRA_ctx
                },
                task_label="Documentation"
            )
            _store_result("docs", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [Docs Thread]: Documentación completada.")
            return result

        def run_qa():
            """Phase 3c: QA Engineer tests everything."""
            print("   🧪 [QA Thread]: Iniciando pruebas E2E...")
            crew = Crew(
                agents=[qa_engineer],
                tasks=[quality_assurance],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx + combined_dev_results,
                    "jira_backlog_context": JIRA_ctx
                },
                task_label="QA"
            )
            _store_result("qa", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [QA Thread]: Pruebas completadas.")
            return result

        def run_marketing():
            """Phase 3d: Marketing Specialist creates campaigns and content."""
            print("   📣 [Marketing Thread]: Iniciando estrategia de marketing...")
            crew = Crew(
                agents=[marketing_specialist],
                tasks=[marketing_task],
                process=Process.sequential,
                memory=False,
                cache=False,
                verbose=True
            )
            result = _run_single_task_with_retry(
                crew,
                inputs={
                    "feature": sprint_goal,
                    "codebase_context": codebase_ctx + combined_dev_results,
                    "jira_backlog_context": JIRA_ctx
                },
                task_label="Marketing"
            )
            _store_result("marketing", str(result))
            _print_token_metrics(crew, result)
            print("   ✅ [Marketing Thread]: Estrategia de marketing completada.")
            return result

        # Execute Phase 3 tasks in parallel using ThreadPoolExecutor
        phase3_futures = {}
        with ThreadPoolExecutor(max_workers=4, thread_name_prefix="Phase3") as executor:
            if not exclude_devops:
                phase3_futures["devops"] = executor.submit(run_devops)
            phase3_futures["docs"] = executor.submit(run_documentation)
            phase3_futures["qa"] = executor.submit(run_qa)
            phase3_futures["marketing"] = executor.submit(run_marketing)

            for task_name, future in phase3_futures.items():
                try:
                    future.result()
                except Exception as e:
                    print(f"   ❌ [Fase 3] Error en {task_name}: {e}")
                    raise

        print("✅ [Fase 3] DevOps + Docs + QA + Marketing completados en paralelo.")

        # ═══════════════════════════════════════════════════════════════
        # SPRINT COMPLETE
        # ═══════════════════════════════════════════════════════════════
        print("\n" + "=" * 60)
        print("⚡ [Scrum Master]: SPRINT COMPLETADO EN MODO PARALELO")
        print("=" * 60)
        print(f"   📋 Planning:  {_get_result('planning', 'N/A')[:80]}...")
        print(f"   🔍 Research:  {_get_result('research', 'N/A')[:80]}...")
        print(f"   💻 Backend:   {_get_result('backend_dev', 'N/A')[:80]}...")
        print(f"   🎨 Frontend:  {_get_result('frontend_dev', 'N/A')[:80]}...")
        print(f"   🐳 DevOps:    {_get_result('devops', 'N/A')[:80]}...")
        print(f"   📝 Docs:      {_get_result('docs', 'N/A')[:80]}...")
        print(f"   🧪 QA:        {_get_result('qa', 'N/A')[:80]}...")
        print(f"   📣 Marketing:{_get_result('marketing', 'N/A')[:80]}...")
        print("=" * 60)

        return _get_result("qa", "Sprint completado.")

    # ── Sequential Crew Execution (Legacy / Fallback) ────────────────────
    def execute_crew_locally(sprint_goal, codebase_ctx, JIRA_ctx):
        """
        Original sequential execution. Used as fallback or when parallel mode is disabled.
        """
        os.environ["OPENAI_API_KEY"] = os.environ.get("OPENROUTER_API_KEY", "sk-or-...")
        os.environ["OPENAI_API_BASE"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_BASE_URL"] = "https://openrouter.ai/api/v1"
        os.environ["OPENAI_MODEL_NAME"] = "openrouter/owl-alpha"
        
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
                retryable = (
                    "429" in err_msg
                    or "rate limit" in err_msg.lower()
                    or "Invalid response from LLM call" in err_msg
                    or "None or empty" in err_msg
                    or "401" in err_msg
                    or "unauthorized" in err_msg.lower()
                )
                if retryable:
                    retry_count += 1
                    if retry_count >= max_retries:
                        raise e
                    current_key = os.environ.get("OPENROUTER_API_KEY")
                    print(f"\n⚠️ [Rotación de API Key - Intento {retry_count}/{max_retries}]: Error LLM: {err_msg[:120]}")
                    
                    # Mark current key as limited and get a healthy one
                    new_key = connector.get_healthy_api_key(current_key=current_key, mark_rate_limited=True)
                    if new_key and new_key != current_key:
                        print(f"🔄 Rotando automáticamente a una nueva clave saludable del pool: ...{new_key[-8:]}")
                        os.environ["OPENROUTER_API_KEY"] = new_key
                        os.environ["OPENAI_API_KEY"] = new_key
                        
                        # Update all agents' LLM objects in-place with the healthiest model
                        current_model = get_healthiest_model()
                        print(f"📡 [Model Router]: Cambiando al modelo más saludable: {current_model}")
                        all_agents = [product_owner, system_architect, software_developer, frontend_developer, devops_engineer, technical_writer, qa_engineer]
                        for agent in all_agents:
                            configure_agent_llm(agent, new_key, current_model)
                                    
                        print("🔄 Reintentando ejecución del Crew con la nueva clave saludable...")
                    else:
                        print("⏳ No hay nuevas claves diferentes en el pool. Esperando 15 segundos antes de reintentar...")
                        import time
                        time.sleep(15)
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

    # ── New Cascade Decision Functions ────────────────────────────────────

    def _build_resume_jira_context(resume_ctx: dict, key: str) -> str:
        """Builds a Jira context string from resume context for in-progress issues."""
        ctx = f"\n--- CONTEXTO DE REANUDACIÓN: {key} ---\n"
        ctx += f"Status: {resume_ctx.get('status', 'Desconocido')}\n"
        ctx += f"Summary: {resume_ctx.get('summary', '')}\n"
        ctx += f"Descripción: {resume_ctx.get('description', '')}\n"
        comments = resume_ctx.get("comments", [])
        if comments:
            ctx += "\nHistorial de Comentarios (últimos mensajes de los agentes):\n"
            for c in comments[-10:]:  # last 10 comments to avoid token overflow
                ctx += f"  {c}\n"
        ctx += f"--- FIN CONTEXTO REANUDACIÓN ---\n"
        return ctx

    def resume_active_story(issues: list, resume_context: dict):
        """
        Resume in-progress stories.
        Only the agents implied by the current status re-engage.
        Reads Jira comments to know where they left off.
        """
        print("\n🔄 [Scrum Master]: Reanudando historia(s) en curso...")

        for issue in issues:
            key = issue.get("key", "Unknown")
            summary = issue.get("summary", "No summary")
            ctx = resume_context.get(key, {})

            print(f"\n{'='*50}")
            print(f"🔄 [Reanudando {key}]: {summary}")
            print(f"   Status actual: {ctx.get('status', 'Unknown')}")
            print(f"{'='*50}")

            jira_resume_str = _build_resume_jira_context(ctx, key)
            sprint_goal = (
                f"Reanudar y completar el ticket {key}: '{summary}'. "
                f"Lee el historial de comentarios de Jira para saber dónde se quedó el equipo. "
                f"Continúa desde el último avance reportado."
            )

            codebase_ctx = generate_codebase_context(sprint_goal)

            try:
                execute_crew_locally(sprint_goal, codebase_ctx, jira_resume_str)
                print(f"\n✅ [Scrum Master]: Historia {key} completada exitosamente.")
            except Exception as crew_err:
                print(f"\n❌ [Scrum Master]: Error en crew para {key}: {crew_err}")
                record_lesson_learned(crew_err, f"Resume-{key}")
                if hasattr(connector, 'local_rate_limits'):
                    connector.local_rate_limits.clear()
                time.sleep(15)

    def complete_existing_tasks(issues: list):
        """
        Complete stories that already have tasks defined.
        Runs the full pipeline but skips PO sprint planning (tasks already exist).
        """
        print("\n📋 [Scrum Master]: Completando historias con tareas existentes...")

        for issue in issues:
            key = issue.get("key", "Unknown")
            summary = issue.get("summary", "No summary")
            status = issue.get("status", "Unknown")

            print(f"\n{'='*50}")
            print(f"📋 [Completando {key}]: {summary} (status: {status})")
            print(f"{'='*50}")

            jira_ctx = f"--- TICKET JIRA: {key} ---\nSummary: {summary}\nStatus: {status}\n---"
            sprint_goal = f"Completar y cerrar el ticket {key}: '{summary}'. Las subtareas ya están definidas en Jira."

            codebase_ctx = generate_codebase_context(sprint_goal)

            try:
                execute_crew_locally(sprint_goal, codebase_ctx, jira_ctx)
                print(f"\n✅ [Scrum Master]: Tareas de {key} completadas exitosamente.")
            except Exception as crew_err:
                print(f"\n❌ [Scrum Master]: Error en crew para {key}: {crew_err}")
                record_lesson_learned(crew_err, f"CompleteTasks-{key}")
                if hasattr(connector, 'local_rate_limits'):
                    connector.local_rate_limits.clear()
                time.sleep(15)

    def process_kafka_queue():
        """
        Check Kafka for new messages. If a message is found,
        create a NEW story in Jira and run the full pipeline.
        Returns True if a message was processed, False otherwise.
        """
        if not is_kafka_configured():
            return False

        print("\n📨 [Scrum Master]: Verificando cola Kafka...")

        try:
            kafka_msg = poll_kafka_queue(timeout_ms=3000)
        except Exception as e:
            print(f"[Kafka] Error polling: {e}")
            return False

        if kafka_msg is None:
            print("[Kafka] No hay mensajes en la cola.")
            return False

        # Format the Kafka message as a sprint goal
        sprint_goal = format_kafka_message_for_sprint(kafka_msg)
        msg_type = kafka_msg.get("type", "feature").lower()
        type_label = "BUG FIX" if msg_type == "bug" else "NUEVO DESARROLLO"

        print(f"\n🆕 [Scrum Master]: ¡Nueva tarea desde Kafka! Tipo: {type_label}")
        print(f"   {sprint_goal[:100]}...")

        # Build Jira context to guide the PO on issue type
        jira_ctx = (
            f"--- TAREA DESDE KAFKA ---\n"
            f"Tipo: {type_label}\n"
            f"Contenido: {sprint_goal}\n"
            f"---\n"
            f"CRITICAL: El Product Owner DEBE crear una NUEVA historia en Jira.\n"
            f"Issue type: {'Error' if msg_type == 'bug' else 'Tarea'}.\n"
            f"Usa el contenido del mensaje como summary y descripción."
        )

        codebase_ctx = generate_codebase_context(sprint_goal)

        try:
            execute_crew_locally(sprint_goal, codebase_ctx, jira_ctx)
            print(f"\n✅ [Scrum Master]: Tarea de Kafka procesada exitosamente.")
            return True
        except Exception as crew_err:
            print(f"\n❌ [Scrum Master]: Error procesando tarea de Kafka: {crew_err}")
            record_lesson_learned(crew_err, "KafkaTask")
            if hasattr(connector, 'local_rate_limits'):
                connector.local_rate_limits.clear()
            time.sleep(15)
            return False

    def prompt_user_for_task() -> str:
        """
        Last resort: ask the user for a new task.
        Returns the user input as a sprint goal string.
        """
        print("\n" + "="*50)
        print("[🤖 Scrum Master]: No hay tareas pendientes, historias en curso ni mensajes Kafka.")
        print("="*50)
        print("\n[!] Hola! Soy el Scrum Master de tu equipo autónomo de IA.")
        try:
            user_feature = input("¿Qué funcionalidad o aplicación deseas que construyamos?\n> ")
        except EOFError:
            user_feature = ""

        if not user_feature.strip():
            user_feature = "Crear un PBX FreeSWITCH en docker con 2 extensiones"
            print(f"\nEntrada vacía. Usando por defecto: '{user_feature}'")

        return user_feature

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

    # ═══════════════════════════════════════════════════════════════════
    # NEW CASCADE DECISION FLOW
    # Priority: In-Progress → Pending with Tasks → Kafka → Ask User
    # ═══════════════════════════════════════════════════════════════════
    first_cycle = True

    while True:
        print(f"\n\n==================================================")
        print(f"🔄 INICIANDO SPRINT #{sprint_number}")
        print(f"==================================================")
        
        # Si estamos en modo distribuido y somos el Master, vigilar los latidos y re-encolar tareas caídas
        if use_distributed and connector.is_master:
            connector.heal_workers_and_tasks()
            connector.rebalance_tasks()

        print_jira_sprint_stats()

        # ── STEP 1: Check for IN-PROGRESS issues (resume) ──────────────
        print("\n[🤖 Scrum Master]: Verificando historias en curso...")
        sprint_state = analyse_sprint_state()

        if sprint_state["state"] == "in_progress":
            resume_active_story(sprint_state["issues"], sprint_state["resume_context"])
            sprint_number += 1
            time.sleep(10)
            continue

        # ── STEP 2: Check for PENDING issues with tasks (complete) ─────
        if sprint_state["state"] == "pending_with_tasks":
            complete_existing_tasks(sprint_state["issues"])
            sprint_number += 1
            time.sleep(10)
            continue

        # ── At this point, backlog is clean ────────────────────────────

        # ── STEP 3: Check Kafka queue (new story from message) ─────────
        print("\n[🤖 Scrum Master]: Backlog limpio. Verificando cola Kafka...")
        if is_kafka_configured():
            kafka_processed = process_kafka_queue()
            if kafka_processed:
                sprint_number += 1
                time.sleep(10)
                continue
        else:
            print("[Kafka] No configurado. Saltando...")

        # ── STEP 4: Nothing to do → Ask user ───────────────────────────
        if first_cycle or not initial_feature_set:
            print("\n[🤖 Scrum Master]: No hay historias en curso, tareas pendientes ni mensajes Kafka.")
            user_feature = prompt_user_for_task()
            if user_feature.strip():
                initial_feature_set = True
                current_sprint_goal = user_feature
            else:
                current_sprint_goal = "Crear un PBX FreeSWITCH en docker con 2 extensiones"
        else:
            print(f"\n✅ [🤖 Scrum Master]: ¡No hay bugs ni tareas pendientes! Todo ha quedado en estado 'Done'.")
            print("==================================================")
            print(f"[X] CICLO COMPLETADO EXITOSAMENTE TRAS {sprint_number - 1} SPRINTS")
            print("==================================================")
            break

        first_cycle = False

        # ── Execute user-provided sprint goal ──────────────────────────
        print(f"\nEntendido. Iniciando nueva funcionalidad: '{current_sprint_goal}'\n")
        jira_backlog_context = "Backlog limpio de Jira. Esta es una tarea/funcionalidad completamente nueva."

        # Check if DevOps should be excluded
        exclude_devops = "devops no trabaja" in current_sprint_goal.lower() or "excluir devops" in current_sprint_goal.lower()
        if exclude_devops:
            print("\n🚫 [Scrum Master]: Se detectó que DevOps no trabaja en esta historia. Excluyendo del crew...")

        # ── Generate codebase context for user-provided goal ─────────────
        print("[🤖 Scrum Master]: Generando contexto del código fuente...")
        raw_codebase_ctx = generate_codebase_context(current_sprint_goal)
        codebase_context = compact_with_owl_alpha(raw_codebase_ctx, label="codebase context")

        # ── Compact sprint context (Jira stories + comments + state) ─────
        print("[🤖 Scrum Master]: Compactando contexto global del sprint...")
        compacted_jira_context = compact_sprint_context(
            sprint_state, 
            current_sprint_goal, 
            jira_backlog_context
        )

        try:
            if USE_PARALLEL:
                execute_crew_parallel(current_sprint_goal, codebase_context, compacted_jira_context)
            else:
                execute_crew_locally(current_sprint_goal, codebase_context, compacted_jira_context)
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

        if use_distributed and connector.is_master:
            connector.redis_client.set("scrum:backlog_empty", "false")

if __name__ == "__main__":
    run_sprint()
