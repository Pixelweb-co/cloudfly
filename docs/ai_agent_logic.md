# 🧠 Lógica Interna del AI Agent

Este documento describe el flujo de procesamiento del agente de IA desde que recibe un mensaje del usuario hasta que genera una respuesta final, incluyendo la orquestación de herramientas y la optimización de tokens.

## Diagrama de Secuencia

```mermaid
sequenceDiagram
    autonumber
    participant ORCH as AI Orchestrator (ai_service.py)
    participant CLAS as Mode Classifier
    participant LLM as OpenAI (GPT-4o/mini)
    participant TOOLS as Tool Executor
    participant DB as Backend Services (HTTP/DB)

    Note over ORCH, DB: 1. Inicialización y Contexto
    ORCH->>DB: Obtener Info Empresa + Estado del Pipeline
    DB-->>ORCH: {stage: "INTENT", company: "Cloudfly"}

    Note over ORCH, DB: 2. Estrategia de Prompt
    ORCH->>CLAS: classify_mode(message, pipeline_data)
    CLAS-->>ORCH: mode = "CLOSING"
    
    ORCH->>ORCH: _get_tools_for_context(message)
    Note right of ORCH: Filtra herramientas según palabras clave (Cita, Pedido, etc.) para ahorrar tokens.

    Note over ORCH, DB: 3. Bucle de Razonamiento (Tool Loop)
    loop Bucle de Ejecución (Max 5 turnos)
        ORCH->>LLM: Enviar System Prompt + History + Herramientas
        LLM-->>ORCH: Tool Call (ej: get_availability_slots)
        
        ORCH->>TOOLS: Ejecutar Herramienta
        TOOLS->>DB: Petición HTTP / Servicio Interno
        DB-->>TOOLS: Datos crudos
        TOOLS-->>ORCH: Respuesta formateada (JSON)
        
        ORCH->>LLM: Retroalimentar LLM con resultado
        LLM-->>ORCH: Texto final o siguiente Tool Call
    end

    Note over ORCH, DB: 4. Finalización
    ORCH->>ORCH: _format_output_for_whatsapp(text)
    Note right of ORCH: Limpia markdown y ajusta tono humano.
    
    ORCH-->>ORCH: Retorna Response Object (text, usage, requests)
```

## Componentes Críticos

### 1. Mode Classifier
Determina el `System Prompt` a utilizar.
- **EXPLORE**: Para saludos y dudas generales (Temp: 0.7).
- **INTENT**: Cuando hay interés en un producto (Temp: 0.5).
- **CLOSING**: Proceso de agendamiento o pago (Temp: 0.3 para mayor precisión).

### 2. Dynamic Tool Filtering
Para mantener el consumo de tokens bajo control, el agente no envía la definición de todas las herramientas si no son necesarias. Si el usuario no menciona palabras relacionadas con "agenda" o "cita", las herramientas del módulo de agendamiento se omiten del contexto inicial.

### 3. Tool Execution Loop
El agente soporta encadenamiento de tareas. Por ejemplo:
1. `get_availability_slots`: Ver qué hay libre.
2. `manage_contact`: Actualizar datos del cliente.
3. `book_appointment`: Realizar la reserva final.

### 4. WhatsApp Optimization
Convierte la salida técnica del LLM en mensajes aptos para chat:
- Elimina encabezados Markdown (`###`).
- Limpia artefactos de pensamiento interno.
- Ajusta la puntuación para un tono más cercano.

---
*Documentación generada automáticamente para CloudFly AI Architecture.*
