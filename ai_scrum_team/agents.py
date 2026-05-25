import os
import crewai.llms.cache as _crewai_cache
# Monkeypatch to prevent crewai from injecting unsupported 'cache_breakpoint' into Groq/OpenAI requests
_crewai_cache.mark_cache_breakpoint = lambda msg: msg

from crewai import Agent, LLM
from tools import get_jira_tools

# Initializing the LLMs using local Ollama model
local_llm = LLM(
    model="ollama/qwen2.5-coder:7b",
    base_url="http://localhost:11434",
    temperature=0.0
)

# Initializing OpenRouter LLM for the team agents using ZOO Owl Alpha (Stealth Model)
# Owl Alpha is 100% free on OpenRouter, has a massive 1M token context window, 
# and is specifically designed for agentic workloads and tool use, making it ideal for CrewAI!
openrouter_llm = LLM(
    model="openrouter/openrouter/owl-alpha",
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    temperature=0.2
)

# OpenAI is disabled as per user instruction

jira_tools = get_jira_tools()

# 1. Product Owner (Uses OpenRouter Owl Alpha for high-level requirement analysis and Jira task decomposition)
product_owner = Agent(
    role='Product Owner',
    goal='Define clear user stories, acceptance criteria, and prioritize the Jira backlog.',
    backstory='You are a highly experienced Agile Product Owner. You excel at translating business needs into technical requirements with high clarity and detail.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

# 2. Scrum Master (Manager)
scrum_master = Agent(
    role='Scrum Master / Agile Manager',
    goal='Facilitate the sprint, manage the team, remove blockers, and ensure the Scrum process is followed.',
    backstory='You are a servant-leader. You understand team dynamics, agile methodologies, and you are excellent at delegating tasks to the right developers based on their skills.',
    llm=local_llm,
    verbose=True,
    allow_delegation=True # Crucial for the manager in a hierarchical process
)

# 3. Software Developer (Uses OpenRouter Owl Alpha for fast, free, and robust code generation)
software_developer = Agent(
    role='Senior Software Developer',
    goal='Write clean, efficient, and robust code for any application layer, including configurations, scripts, and business logic.',
    backstory='You are a versatile polyglot developer. You can write frontend, backend, or system configuration files (like FreeSWITCH XML, Dockerfiles, etc). you work in docker windows enviroment. You always write reusable and well-documented code.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

# 4. System Architect / Researcher (Uses OpenRouter Owl Alpha for free and fast technical research and documentation)
system_architect = Agent(
    role='System Architect and Tech Researcher',
    goal='Search the web for tutorials and documentation to design scalable and correct technical architectures for the requested features.',
    backstory='You are an expert architect. You use the Web Search tool to read real-world tutorials and documentation. You provide clear technical blueprints to the developers.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

# 5. QA Engineer (Uses OpenRouter Owl Alpha for free and fast test verification and issue closure)
qa_engineer = Agent(
    role='Quality Assurance (QA) Engineer',
    goal='Test the code, write unit and E2E tests, and ensure no bugs reach production.',
    backstory='You have a keen eye for detail. Your job is to break things before the users do. You verify that all code meets the Acceptance Criteria defined by the PO.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

# 6. DevOps Engineer (Uses OpenRouter Owl Alpha for free and fast dockerization and deployment scripts)
devops_engineer = Agent(
    role='DevOps & Cloud Engineer',
    goal='Prepare CI/CD pipelines, Docker containers, and deployment scripts for the new features.',
    backstory='You automate everything. You ensure that the code written by the developers can be seamlessly deployed, monitored, and scaled in production.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

# 7. Technical Writer & Diagram Specialist (Uses OpenRouter Owl Alpha for high-quality writing and diagram generation)
technical_writer = Agent(
    role='Technical Writer and Diagram Specialist',
    goal='Create high-quality markdown documentation, system architectures, database schemas, and visual Mermaid.js diagrams of the application and its requirements.',
    backstory='You are an expert technical writer and diagramming specialist. You love clear and precise system designs, beautiful API contracts, and elegant visualizations. You write concise yet comprehensive documentation and map out flows with stunning Mermaid.js diagrams.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

# 8. Senior Frontend Developer (Uses OpenRouter Owl Alpha for premium Next.js UI development)
frontend_developer = Agent(
    role='Senior Frontend Developer',
    goal='Design and build beautiful, highly interactive, responsive, and state-of-the-art web user interfaces in Next.js, React, TypeScript, and CSS/Tailwind inside the frontend_new directory.',
    backstory='You are a master of UI/UX and modern frontend technologies. You specialize in Next.js 14, React, TypeScript, and premium responsive web design. You translate wireframes and user requirements into clean, reusable, and pixel-perfect UI components that WOW the user at first glance. You always adhere 100% to design specifications and multi-tenant context constraints.',
    llm=openrouter_llm,
    tools=jira_tools,
    verbose=True,
    allow_delegation=False
)

