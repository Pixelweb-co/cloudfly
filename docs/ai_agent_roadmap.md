# 🚀 Roadmap de Mejoras: AI Agent CloudFly

Este documento recopila las próximas funcionalidades y mejoras arquitectónicas planeadas para el Agente IA de CloudFly, transformándolo de un agente conversacional avanzado a un asistente de ventas empresarial 100% autónomo.

---

## 1. 🙋‍♂️ Transferencia a Humano (Human Handoff)

**Problema:** Si el cliente se molesta o pide explícitamente hablar con una persona real, la IA seguirá intentando responder infinitamente.  
**Solución Arquitectónica:**
- Crear una nueva herramienta (Tool) para el LLM: `transfer_to_human`.
- Cuando el usuario indique querer ayuda humana o si el análisis de sentimiento detecta frustración, el LLM llamará a la herramienta.
- La ejecución de la herramienta establecerá un flag en BD/Redis (ej: `is_bot_active = false` en la tabla de sesión) y emitirá un evento por WebSockets.
- En el Frontend, el chat del cliente aparecerá con una alerta roja o en una pestaña "Pendientes de Atención".
- El agente se despide: *"Entiendo, te transferiré con un asesor humano en un momento..."*.

## 2. ⏳ Seguimiento Proactivo (Autore-engagement)

**Problema:** El agente actual es reactivo; solo responde a los webhooks de entrada. Los clientes que cotizan y no compran se enfrían.  
**Solución Arquitectónica:**
- Crear un servicio Worker o CronJob en Node.js/Python.
- El Worker escaneará la tabla de contactos y su `conversation_pipeline_state`. Aquellos en etapa "Cotización" sin actualización en >24h serán seleccionados.
- Se envía un evento/mensaje a Kafka (ej: Topic `ai.proactive.triggers`) con el contexto: *"Pedir retroalimentación sobre la cotización"*.
- El Agente consume este topic y genera un mensaje natural (ej: *"Hola Andrés, ¿pudiste revisar los precios que te envié ayer?"*) de forma autónoma.

## 3. 🧠 Resumen de Contexto (Long-term Memory Summarization)

**Problema:** Redis guarda solo una ventana deslizante de los últimos N mensajes (actualmente 20). En chats recurrentes, el cliente asume que el bot recuerda detalles pasados, pero se pierden al salir de la ventana.  
**Solución Arquitectónica:**
- Implementar un resumen dinámico impulsado por un LLM rápido y barato (ej: GPT-4o-mini).
- Cuando el array temporal de Redis supera un límite (ej: 15 mensajes emparejados), se llama a una función asíncrona que consolida la historia antigua en "Hechos del Cliente" (*Client Facts*).
- Estos hechos (ej. "Tiene 2 tiendas", "Prefiere pagar con tarjeta", "Buscaba zapatos") se inyectan silenciosamente como viñetas adicionales en el `system_prompt` principal.

## 4. 🎙️ Soporte para Notas de Voz (OpenAI Whisper)

**Problema:** WhatsApp en su uso comercial real incluye un altísimo porcentaje de notas de voz. Ignorarlas reduce la retención y la experiencia UX.  
**Solución Arquitectónica:**
- En el `chat-socket-service` (o `evolutionClient`), detectar mensajes de tipo audio/ptt.
- Descargar el archivo `.ogg` a un almacenamiento temporal.
- Consumir la API de OpenAI Whisper para transcribir el audio.
- Construir el payload de Kafka hacia `messages.in` con el texto transcrito de forma transparente, inyectando un prefijo oculto (ej: `[Audio transcrito de WhatsApp]: "Qué valen los zapatos?"`).
- El Agente responde en texto con normalidad.

## 5. 🎯 Integración Interactiva con Campañas de Marketing

**Problema:** Tienes el módulo de marketing, pero su alimentación es manual o desconectada de las intenciones detectadas en chat natural.  
**Solución Arquitectónica:**
- Darle al Agente una Tool adicional: `add_contact_to_campaign(contact_id, campaign_tag_or_id)`.
- Si el usuario dice *"Avísame cuando lleguen las camisetas negras en talla L"*, la IA lo procesa y añade al usuario a la campaña correspondiente de manera autónoma.
- El agente informa al usuario que quedó registrado para recibir la notificación o descuento futuramente.
