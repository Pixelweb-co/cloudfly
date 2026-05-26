import os
import sys
import time
import socket
import json
import threading
import redis

class ScrumConnector:
    def __init__(self, instance_id=None):
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", 6379))
        self.password = os.getenv("REDIS_PASSWORD", "Elian2020#")
        
        # Generar ID único de instancia si no se provee
        if not instance_id:
            hostname = socket.gethostname()
            pid = os.getpid()
            self.instance_id = f"scrum_{hostname}_{pid}_{int(time.time())}"
        else:
            self.instance_id = instance_id
            
        self.redis_client = None
        self.is_master = False
        self.heartbeat_active = True
        self.heartbeat_thread = None
        self.local_rate_limits = {}

    def connect(self):
        try:
            self.redis_client = redis.Redis(
                host=self.host,
                port=self.port,
                password=self.password,
                decode_responses=True,
                socket_timeout=5
            )
            self.redis_client.ping()
            print(f"[🔌 Redis]: Conectado a Redis en {self.host}:{self.port} con éxito.")
            return True
        except Exception as e:
            print(f"[🔌 Redis] ERROR: No se pudo conectar a Redis en {self.host}:{self.port}: {e}")
            self.redis_client = None
            return False

    def elect_master(self):
        """
        Intenta elegir a esta instancia como MASTER.
        Retorna True si gana el rol, False si queda como WORKER.
        """
        try:
            # SET scrum:master instance_id EX 30 NX -> adquiere el rol con lease de 30s
            acquired = self.redis_client.set("scrum:master", self.instance_id, ex=30, nx=True)
            if acquired:
                self.is_master = True
                print(f"\n👑 [Scrum Master]: ¡Esta instancia ({self.instance_id}) ha sido elegida como MASTER!")
                # Remover de workers en caso de que estuviera registrado antes
                self.redis_client.srem("scrum:workers", self.instance_id)
            else:
                self.is_master = False
                current_master = self.redis_client.get("scrum:master")
                print(f"\n👷 [Worker]: Registrado como WORKER. El MASTER actual es: {current_master}")
                self.redis_client.sadd("scrum:workers", self.instance_id)
                self.publish_event("worker_connected", f"Worker {self.instance_id} se ha conectado.")
                
            # Iniciar hilo de latido (heartbeat) y renovación
            self.start_heartbeat()
            return self.is_master
        except Exception as e:
            print(f"[!] Error al elegir Master: {e}")
            return False

    def start_heartbeat(self):
        self.heartbeat_active = True
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_loop, daemon=True)
        self.heartbeat_thread.start()

    def _heartbeat_loop(self):
        """
        Bucle secundario que mantiene los leases vivos tanto para el Master como para los Workers.
        """
        while self.heartbeat_active:
            try:
                # 1. Registrar latido individual con TTL de 20 segundos
                self.redis_client.set(f"scrum:heartbeat:{self.instance_id}", "alive", ex=20)
                
                # 2. Si es Master, renovar el lock de liderazgo en Redis
                if self.is_master:
                    # Usar EVAL/Lua script para renovar el lock solo si aún somos el dueño legítimo
                    lua_renew = """
                    if redis.call('get', KEYS[1]) == ARGV[1] then
                        return redis.call('expire', KEYS[1], 30)
                    else
                        return 0
                    end
                    """
                    renewed = self.redis_client.eval(lua_renew, 1, "scrum:master", self.instance_id)
                    if not renewed:
                        print("\n⚠️ [Scrum Master]: ¡Se ha perdido el liderazgo Master!")
                        self.is_master = False
                        self.redis_client.sadd("scrum:workers", self.instance_id)
                else:
                    # Si es Worker, asegurarse de que sigue listado en el set
                    self.redis_client.sadd("scrum:workers", self.instance_id)
                    
            except Exception as e:
                # Silent failure recovery
                pass
                
            time.sleep(10)

    def shutdown(self):
        self.heartbeat_active = False
        try:
            if self.redis_client:
                # Quitarse de la lista de workers
                self.redis_client.srem("scrum:workers", self.instance_id)
                self.redis_client.delete(f"scrum:heartbeat:{self.instance_id}")
                if self.is_master:
                    # Liberar el Master si somos nosotros
                    current_master = self.redis_client.get("scrum:master")
                    if current_master == self.instance_id:
                        self.redis_client.delete("scrum:master")
                print(f"[🔌 Redis]: Instancia {self.instance_id} desconectada limpiamente.")
        except Exception as e:
            print(f"[!] Error al apagar conector: {e}")

    # ── Task Queueing ───────────────────────────────────────────────────────

    def send_task(self, worker_id, task_id):
        """
        Coloca una tarea en la cola privada de un Worker específico.
        """
        try:
            # Poner el lock de la tarea en Redis mapeándolo al worker
            self.redis_client.set(f"scrum:task:{task_id}", worker_id, ex=43200) # Lock por 12 horas
            self.redis_client.lpush(f"scrum:queue:{worker_id}", task_id)
            print(f"[👑 Master]: Tarea {task_id} asignada y encolada para {worker_id}.")
            return True
        except Exception as e:
            print(f"[!] Error al enviar tarea a {worker_id}: {e}")
            return False

    def get_task(self):
        """
        Polleo bloqueante de la cola privada del Worker.
        """
        try:
            # brpop devuelve una tupla (nombre_cola, valor)
            result = self.redis_client.brpop(f"scrum:queue:{self.instance_id}", timeout=5)
            if result:
                return result[1] # Devuelve el task_id
            return None
        except Exception as e:
            # Ignorar timeouts de red normales
            return None

    # ── Pub/Sub and Event Monitoring ────────────────────────────────────────

    def publish_event(self, event_type, message, task_id=None):
        """
        Publica un evento para ser escuchado por el Master y otras terminales en tiempo real.
        """
        try:
            payload = {
                "instance_id": self.instance_id,
                "event_type": event_type,
                "message": message,
                "task_id": task_id,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            self.redis_client.publish("scrum:events", json.dumps(payload))
        except Exception as e:
            print(f"[!] Error al publicar evento: {e}")

    def update_task_status(self, task_id, status, details=""):
        """
        Actualiza el estado síncrono de un ticket y lo publica en Pub/Sub.
        """
        try:
            key = f"scrum:status:{task_id}"
            self.redis_client.hset(key, mapping={
                "status": status,
                "worker": self.instance_id,
                "details": details,
                "last_update": time.strftime("%Y-%m-%d %H:%M:%S")
            })
            self.redis_client.expire(key, 86400) # Expira en 24 horas
            self.publish_event("task_progress", f"[{status}] {details}", task_id=task_id)
        except Exception as e:
            print(f"[!] Error al actualizar estado de tarea {task_id}: {e}")

    # ── Self-Healing and Cleaning ───────────────────────────────────────────

    def heal_workers_and_tasks(self):
        """
        Vigila los Workers registrados y re-encola las tareas de aquellos cuyos latidos expiraron.
        Sólo debe ser corrido periódicamente por el MASTER.
        """
        if not self.is_master:
            return
            
        try:
            # Asegurarse de que el Master no esté listado en workers
            if self.redis_client.sismember("scrum:workers", self.instance_id):
                self.redis_client.srem("scrum:workers", self.instance_id)
                
            # Obtener todos los workers registrados
            workers = self.redis_client.smembers("scrum:workers")
            
            for w_id in list(workers):
                # Verificar si el latido sigue existiendo
                alive = self.redis_client.get(f"scrum:heartbeat:{w_id}")
                if not alive:
                    print(f"\n🚨 [👑 Master]: Se ha detectado caída del Worker {w_id}. Limpiando...")
                    # Remover del set de workers activos
                    self.redis_client.srem("scrum:workers", w_id)
                    
                    # Buscar si tenía alguna tarea asignada en la cola o lock
                    # Buscamos claves de locks que apunten a ese worker
                    for k in self.redis_client.scan_iter("scrum:task:*"):
                        assigned_worker = self.redis_client.get(k)
                        if assigned_worker == w_id:
                            task_id = k.split(":")[-1]
                            print(f"🚨 [👑 Master]: Tarea {task_id} re-encolada por pérdida de latido de {w_id}.")
                            self.redis_client.delete(k)
                            self.redis_client.delete(f"scrum:status:{task_id}")
                            # La tarea queda libre y volverá a ser leída de Jira en el próximo ciclo
        except Exception as e:
            print(f"[!] Error en auto-curación de workers: {e}")

    def rebalance_tasks(self):
        """
        Realiza el balanceo dinámico de tareas (work-stealing) entre los Workers activos.
        Si un Worker tiene 0 tareas asignadas y otro tiene >= 2, se roba una tarea de la cola
        del sobrecargado y se asigna al inactivo.
        Garantiza que todos los workers activos tengan al menos una tarea si hay suficientes.
        """
        if not self.is_master:
            return

        try:
            # Obtener todos los workers del Set
            workers = list(self.redis_client.smembers("scrum:workers"))
            # Filtrar solo por workers activos con latido vigente
            active_workers = [w for w in workers if self.redis_client.get(f"scrum:heartbeat:{w}")]
            
            if not active_workers:
                return

            print(f"[👑 Master - Balanceador]: Analizando carga de {len(active_workers)} workers activos...")

            # Bucle de rebalanceo iterativo
            while True:
                worker_tasks = {}
                for w_id in active_workers:
                    queued_tasks = self.redis_client.lrange(f"scrum:queue:{w_id}", 0, -1) or []
                    active_t = self.redis_client.get(f"scrum:active_task:{w_id}")
                    worker_tasks[w_id] = {
                        "queued": queued_tasks,
                        "active": active_t,
                        "total_count": len(queued_tasks) + (1 if active_t else 0)
                    }

                # Buscar si hay algún worker con 0 tareas
                idle_worker = next((w for w, info in worker_tasks.items() if info["total_count"] == 0), None)
                if not idle_worker:
                    # Todos tienen al menos 1 tarea, balanceo perfecto
                    break

                # Buscar al worker con más tareas asignadas
                busy_worker = max(worker_tasks.keys(), key=lambda w: worker_tasks[w]["total_count"])
                
                # Si el worker con más tareas tiene menos de 2, no hay de dónde robar
                # (1 tarea en progreso o cola no se puede robar sin dejar al otro ocioso)
                if worker_tasks[busy_worker]["total_count"] < 2:
                    break

                # Robar una tarea de la cola del busy_worker
                stolen_task = self.redis_client.rpop(f"scrum:queue:{busy_worker}")
                if stolen_task:
                    # Encolar en el idle_worker
                    self.redis_client.lpush(f"scrum:queue:{idle_worker}", stolen_task)
                    # Cambiar el lock/asignación
                    self.redis_client.set(f"scrum:task:{stolen_task}", idle_worker, ex=43200)
                    # Actualizar estado y publicar evento
                    self.update_task_status(stolen_task, "Reasignada", f"Reasignada automáticamente de {busy_worker} a {idle_worker}")
                    self.publish_event(
                        "task_rebalanced", 
                        f"Tarea {stolen_task} reasignada por balanceo desde {busy_worker} a {idle_worker}.",
                        task_id=stolen_task
                    )
                    print(f"[👑 Master - Balanceador]: Tarea {stolen_task} robada exitosamente de {busy_worker} y asignada a {idle_worker}.")
                else:
                    break
        except Exception as e:
            print(f"[!] Error al rebalancear tareas: {e}")

    def get_healthy_api_key(self, current_key=None, mark_rate_limited=False):
        """
        Retorna una clave de OpenRouter saludable del pool que no haya alcanzado el límite.
        Si mark_rate_limited=True, registra 'current_key' como limitada en Redis por 12 horas.
        """
        import os
        import json
        
        # Primero intentar cargar de keys_pool.json local
        keys = []
        base_dir = os.path.dirname(os.path.abspath(__file__))
        pool_json_path = os.path.join(base_dir, "keys_pool.json")
        if os.path.exists(pool_json_path):
            try:
                with open(pool_json_path, "r", encoding="utf-8") as f:
                    pool_data = json.load(f)
                    keys = [k.strip() for k in pool_data.get("keys", []) if k.strip()]
            except Exception as e:
                print(f"[!] Error leyendo pool JSON: {e}")
                
        # Fallback al string de variables de entorno si no hay keys en el JSON
        if not keys:
            pool_str = os.getenv("OPENROUTER_KEYS_POOL") or os.getenv("OPENROUTER_API_KEY")
            if pool_str:
                keys = [k.strip() for k in pool_str.split(",") if k.strip()]
                
        if not keys:
            return None

        if not hasattr(self, 'local_rate_limits'):
            self.local_rate_limits = {}
            
        try:
            # 1. Si se reportó un rate limit, registrar la clave como limitada
            if mark_rate_limited and current_key:
                import time
                expiry = time.time() + 43200 # 12 horas
                self.local_rate_limits[current_key] = expiry
                if self.redis_client:
                    try:
                        self.redis_client.set(f"scrum:rate_limit:{current_key}", "limited", ex=43200)
                        print(f"⚠️ [Balanceador]: Registrado rate limit para la clave ...{current_key[-8:]} en Redis.")
                    except Exception:
                        pass
                else:
                    print(f"⚠️ [Balanceador - Standalone]: Registrado rate limit para la clave ...{current_key[-8:]} en memoria local.")
                    
            # 2. Filtrar el pool obteniendo solo las claves saludables
            healthy_keys = []
            import time
            now = time.time()
            for k in keys:
                is_limited = False
                # Check local in-memory rate limit
                if k in self.local_rate_limits:
                    if now < self.local_rate_limits[k]:
                        is_limited = True
                    else:
                        del self.local_rate_limits[k] # Expirado
                
                # Check Redis rate limit
                if not is_limited and self.redis_client:
                    try:
                        res = self.redis_client.get(f"scrum:rate_limit:{k}")
                        if res:
                            is_limited = True
                    except Exception:
                        pass
                        
                if not is_limited:
                    healthy_keys.append(k)
                    
            if not healthy_keys:
                print("🚨 [Balanceador] ADVERTENCIA: Todas las claves del pool han alcanzado su límite. Reseteando límites locales para evitar bloqueo.")
                self.local_rate_limits.clear()
                return keys[0]
                
            # 3. Obtener el índice para balanceo
            try:
                if self.redis_client:
                    workers = list(self.redis_client.smembers("scrum:workers"))
                    active_workers = sorted([w for w in workers if self.redis_client.get(f"scrum:heartbeat:{w}")])
                    if self.instance_id not in active_workers:
                        active_workers.append(self.instance_id)
                        active_workers.sort()
                    index = active_workers.index(self.instance_id)
                else:
                    index = 0
            except Exception:
                index = 0
                
            # 4. Asignar clave saludable de forma balanceada o simplemente rotar secuencialmente si somos standalone
            if current_key in healthy_keys and len(healthy_keys) > 1:
                # Si la clave actual sigue siendo "saludable" (ej. no fue la que disparó el error), mantenerla
                return current_key
                
            assigned_key = healthy_keys[index % len(healthy_keys)]
            return assigned_key
        except Exception as e:
            print(f"[!] Error al obtener clave saludable: {e}")
            return keys[0]

