# 🧠 Base de Conocimiento y Lecciones Aprendidas (Memoria Scrum Team)

Este archivo registra errores históricos y lecciones aprendidas para que el equipo autónomo de IA aprenda de ejecuciones previas y nunca repita los mismos fallos técnicos.

---

## 1. Errores de API & Límites de OpenRouter (429)
*   **Problema**: El modelo `meta-llama/llama-3.3-70b-instruct:free` en el canal Venice puede arrojar errores de Rate Limit 429 recurrentemente.
*   **Lección**: Si detectas un error de Rate Limit, reduce el número de solicitudes simultáneas, optimiza la cantidad de texto enviado en el contexto del codebase y permite que el balanceador de claves rote las credenciales de forma limpia.

## 2. Inyección de Argumentos en LiteLLM (Completions.create)
*   **Problema**: CrewAI (que usa LiteLLM por debajo) no soporta el parámetro `fallbacks` en el constructor de la clase `LLM`. Pasar `fallbacks=[...]` causará un fallo crítico: `Unexpected keyword argument 'fallbacks'`.
*   **Lección**: **NUNCA** utilices el argumento `fallbacks` al instanciar objetos `LLM` en `agents.py`. En su lugar, gestiona la rotación de modelos y claves desde el orquestador principal (`connector.py` / `main.py`).

## 3. Entorno de Terminal Windows (Encoding de Emojis)
*   **Problema**: El terminal de Windows (PowerShell) arroja `charmap codec can't encode character` al intentar imprimir emojis como 🤖 en consola si la salida estándar no está en UTF-8.
*   **Lección**: Siempre reconfigura `sys.stdout` con soporte UTF-8 (`sys.stdout.reconfigure(encoding='utf-8')`) antes de imprimir logs o cadenas con caracteres especiales/emojis.

## 4. Despliegues de Next.js (frontend_new)
*   **Problema**: Compilar la imagen de Next.js directamente en el servidor VPS satura el consumo de CPU y RAM, tirando el servidor de producción.
*   **Lección**: La imagen de Next.js se compila estrictamente de forma local, se exporta como `.tar` con `docker save` y se transfiere al VPS mediante SCP para su carga (`docker load`), evitando así picos de carga en el servidor.
