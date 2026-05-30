"""
Hola Mundo CrewAI - AI Marketing Team 2026

Un agente CrewAI simple que dice "Hola Mundo Desde CrewAI!".

Uso:
    python hola_mundo_crew.py

Modelo: openrouter/owl-alpha (vía OpenRouter, gratis)
"""

import os
import sys
import time
from dotenv import load_dotenv

# ── Cargar variables de entorno ──────────────────────────────────────────────
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
load_dotenv(dotenv_path=_env_path)

OPENROUTER_KEY = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY") or ""
OPENROUTER_BASE = "https://openrouter.ai/api/v1"

if not OPENROUTER_KEY:
    print("❌ ERROR: OPENROUTER_API_KEY no configurada en .env")
    sys.exit(1)

# ── CrewAI imports ───────────────────────────────────────────────────────────
from crewai import Agent, Task, Crew, Process, LLM

# ── Configurar LLM via OpenRouter (owl-alpha) ───────────────────────────────
llm = LLM(
    model="openrouter/owl-alpha",
    base_url=OPENROUTER_BASE,
    api_key=OPENROUTER_KEY,
    temperature=0.3,
)

# ── Definir el Agente ───────────────────────────────────────────────────────
marketing_agent = Agent(
    role="Marketing AI Assistant",
    goal="Crear mensajes de bienvenida y contenido básico de marketing.",
    backstory=(
        "Eres un asistente de marketing inteligente. Tu especialidad es "
        "crear mensajes atractivos, contenido de bienvenida y textos "
        "promocionales para campañas de marketing digital."
    ),
    llm=llm,
    verbose=True,
)

# ── Definir la Tarea ────────────────────────────────────────────────────────
tarea_hola_mundo = Task(
    description=(
        "Di 'Hola Mundo Desde CrewAI!' de forma creativa y entusiasta. "
        "Añade un mensaje motivacional para el equipo de marketing AI 2026."
    ),
    expected_output="Un saludo 'Hola Mundo Desde CrewAI!' con un mensaje motivacional.",
    agent=marketing_agent,
)

# ── Crear el Crew ───────────────────────────────────────────────────────────
crew = Crew(
    agents=[marketing_agent],
    tasks=[tarea_hola_mundo],
    process=Process.sequential,
    memory=False,
    cache=False,
    verbose=True,
)

# ── Ejecutar ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print("🚀 AI MARKETING TEAM 2026")
    print("🤖 Hola Mundo CrewAI")
    print("=" * 60)

    start = time.time()
    print(f"\n⏱️  Iniciando a las {time.strftime('%H:%M:%S')}...")

    try:
        resultado = crew.kickoff()
        elapsed = round(time.time() - start, 2)

        print(f"\n{'=' * 60}")
        print(f"✅ RESULTADO ({elapsed}s):")
        print(f"{'=' * 60}")
        print(str(resultado))
        print(f"{'=' * 60}")

    except KeyboardInterrupt:
        print("\n\n⚠️  Ejecución cancelada por el usuario.")
        sys.exit(0)
    except Exception as e:
        elapsed = round(time.time() - start, 2)
        print(f"\n❌ Error después de {elapsed}s: {e}")
        sys.exit(1)
