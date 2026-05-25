from crewai import Task
from agents import product_owner, software_developer, system_architect, qa_engineer, devops_engineer, technical_writer, frontend_developer

# We define the core Scrum tasks dynamically.

sprint_planning = Task(
    description='''
    The user has requested the following for this sprint:
    "{feature}"
    
    Here is the CURRENT JIRA BACKLOG AND ISSUE HISTORY CONTEXT (including statuses and full comment history of active sprint issues):
    {jira_backlog_context}
    
    Here is the CURRENT CODEBASE CONTEXT from your workspace root (C:\\apps\\cloudfly):
    {codebase_context}
    
    1. Analyze the request.
    2. Check if the request is to complete EXISTING pending tasks in Jira, or to build a NEW feature from scratch.
    3. If it is a NEW feature:
       - Divide the feature into MULTIPLE logical sub-tasks (e.g. Research, Configuration, Development, Deployment).
       - You MUST use the 'Create Jira Issue' tool to create ONE primary 'Task' representing the entire feature.
       - Then, wait for the response to get the primary Task's Issue Key.
       - Finally, use the 'Create Jira Issue' tool again for each sub-part, setting issue_type to 'Sub-task' and passing the primary Task's ID as the `parent_key`.
       - When calling the tool, the 'description' MUST be extremely detailed. Include Acceptance Criteria, technical context, and what exactly the developer needs to do.
       - Start the issue description with "🤖 **Product Owner**: ".
    4. If it is to complete EXISTING pending tasks:
       - DO NOT use the 'Create Jira Issue' tool (they are already logged).
       - Analyze the context of the existing pending tasks passed in the instruction.
       - Summarize what needs to be done for each of them based on the CURRENT CODEBASE CONTEXT.
    5. In BOTH cases, record and output the list of ALL Jira Issue Keys (e.g., CLOUD-123, CLOUD-124) that must be processed in this sprint.
    
    CRITICAL: If you are confused about the feature or lack details, you MUST use the 'Ask Human Clarification' tool to ask Edwin.
    
    CRITICAL FOR SPEC-DRIVEN DEVELOPMENT: If the codebase context includes a specification document (like spec.md, openapi.yaml, etc.) or the user requests strict adherence to a spec, you MUST enforce that the generated Jira tasks strictly follow the specification exactly, without inventing extra features.
    ''',
    expected_output='A clear breakdown of the sub-tasks to process, along with a list of all relevant Jira Issue Keys for this sprint.',
    agent=product_owner
)

research_task = Task(
    description='''
    Based on the feature request "{feature}", the Jira issues from the Product Owner, the CURRENT JIRA BACKLOG AND ISSUE HISTORY CONTEXT:
    {jira_backlog_context}
    
    and the CURRENT CODEBASE CONTEXT:
    {codebase_context}
    
    1. CRITICAL STARTING REFERENCE: You MUST begin your architectural research by reading and analyzing the master docker-compose configuration file `C:\\apps\\cloudfly\\docker-compose-full-vps.yml` using the 'Read Code File' tool. This file is the absolute blueprint of the system's microservices, networks, ports, databases, and dependencies. Use it as your primary reference to understand how the new feature's services and variables are wired into the existing stack.
    2. Use the 'Web Search' tool to investigate tutorials, official documentation, or best practices for this specific technology (e.g., FreeSWITCH PBX, React, etc).
    3. Write a clear Architecture and Implementation Plan for the Developers.
    CRITICAL: You MUST use the 'Comment on Jira Issue' tool to post a summary of your research findings to the relevant Jira Issue Keys. 
    CRITICAL 2: You MUST start your comment with "🤖 **System Architect**: " to identify yourself.
    ''',
    expected_output='A technical architecture and implementation blueprint starting with docker-compose-full-vps.yml analysis. A Jira comment must be added.',
    agent=system_architect
)

development_task = Task(
    description='''
    Based on the technical blueprint provided by the System Architect, the CURRENT JIRA BACKLOG AND ISSUE HISTORY CONTEXT:
    {jira_backlog_context}
    
    and the CURRENT CODEBASE CONTEXT:
    {codebase_context}
    
    CRITICAL 0: Before writing any code, you MUST use the 'Transition Jira Issue' tool to change the status of all processed Jira Issue Keys to 'In Progress'. If a ticket is already 'In Progress' or further advanced in the status context, acknowledge it and build upon the existing work.
    
    Write all the necessary code, scripts, or configuration files (XML, JSON, YAML, Python, JS, etc) to build/complete "{feature}".
    You should build upon the existing code if it exists. DO NOT overwrite existing working files unless requested or necessary to extend them.
    CRITICAL 1: You must use the 'Write Code To File' tool to save all your generated code. Your root is C:\\apps\\cloudfly. Use relative paths carefully. If the user specified a specific folder, you MUST work inside that folder.
    CRITICAL 2: You MUST use the 'Comment on Jira Issue' tool to post an update to the relevant Jira Issue Keys with a summary of the code/configs you developed.
    CRITICAL 3: You MUST start your comment with "🤖 **Software Developer**: " to identify yourself.
    CRITICAL 4 (SPEC-DRIVEN DEVELOPMENT): If the codebase context includes a specification document (like spec.md, openapi.yaml, etc.), you MUST ensure your generated code complies 100% with that specification. Do not invent endpoints, fields, or features not present in the spec.
    CRITICAL 5: You have access to the 'Execute Console Command' tool. Use it to install dependencies, run scripts, or compile code to verify your work before finishing.
    CRITICAL 6: STRICT TDD. You MUST write an automated unit test script (e.g. test_*.py or *.test.js) for your code and use 'Execute Console Command' to run it. Do not finish until tests pass.
    CRITICAL 7: Before passing the code to QA, you MUST use the 'Commit Code' tool to save your changes to Git.
    CRITICAL 8: If the sprint goal contains a LATEST COMMENT from the user, your Jira comment MUST explicitly address the user's feedback and explain how you fixed their specific concern.
    CRITICAL 9: If you are stuck or need a password/key, use the 'Ask Human Clarification' tool.
    ''',
    expected_output='All source code and configuration files written to disk. A Jira comment must be added.',
    agent=software_developer
)

deployment_prep = Task(
    description='''
    Take the generated code/configs and the CURRENT CODEBASE CONTEXT:
    {codebase_context}
    
    Write a Dockerfile and docker-compose.yml to containerize the solution if they don't already exist or need updating.
    Ensure any necessary ports (like 5060 for SIP or 8000 for web) are exposed based on the application type.
    CRITICAL 1: You must use the 'Write Code To File' tool to save the Dockerfile and docker-compose.yml files into the correct directory. If the user specified a folder, work there.
    CRITICAL 2: You MUST use the 'Docker Management Tool' to run 'up' and start the containers.
    CRITICAL 3: You MUST use the 'Comment on Jira Issue' tool to post an update to the Jira Issue Keys stating that containers are running.
    CRITICAL 4: You MUST start your comment with "🤖 **DevOps Engineer**: " to identify yourself.
    CRITICAL 5: You have access to the 'Execute Console Command' tool. Use it to run 'docker-compose logs' to verify the containers are actually healthy and fixing any errors before passing to QA.
    CRITICAL 6: After verifying the containers are running, you MUST use the 'Transition Jira Issue' tool to change the status of the Jira Issue Keys to 'In Review'.
    CRITICAL 7: If the sprint goal contains a LATEST COMMENT from the user, your Jira comment MUST acknowledge their feedback.
    ''',
    expected_output='Dockerfile and docker-compose.yml saved. Containers running. A Jira comment must be added.',
    agent=devops_engineer
)

quality_assurance = Task(
    description='''
    Verify that the deployment was successful and that all changes comply with the specifications.
    CRITICAL MANDATE: You MUST perform comprehensive E2E Integration testing across the ENTIRE PROJECT ECOSYSTEM. You are responsible for verifying the complete system health, including the Backend APIs, Databases, Messaging layers (Evolution API/FreeSWITCH), and Frontend UIs.
    
    Here is the CURRENT JIRA BACKLOG AND ISSUE HISTORY CONTEXT:
    {jira_backlog_context}
    
    Use the CURRENT CODEBASE CONTEXT to inspect what has been built:
    {codebase_context}
    
    1. BACKEND & INTEGRATION TESTING:
       - Validate Spring Boot WebFlux API endpoints. Ensure that controllers and services are fully responsive on port 8080 (or appropriate mapped ports).
       - Verify database consistency (MySQL and PostgreSQL). Ensure that tables, columns, indexes, and multi-tenant constraints are correctly configured and data is properly isolated.
       - Verify messaging and telephony integrations (Evolution API, FreeSWITCH configurations, Kafka brokers). Ensure queues are active and telephony registrars are registered.
       - Use the 'Execute Console Command' tool to run backend tests (e.g. pytest scripts, JUnit tests, or curl commands) to assert endpoint success and correct JSON response formats.
       
    2. FRONTEND TESTING:
       - If the sprint feature involves frontend changes in the active Next.js/React workspace (frontend_new), you MUST write automated E2E tests using Playwright or Cypress to verify UI layouts, interactive flows, forms, and client-side multi-tenant session storage.
       - Use the 'Write Code To File' tool to save the new automated test script strictly inside the active "frontend_new/tests" or "frontend_new/e2e" directory, ending in ".spec.js" or ".spec.ts", and starting with the prefix "AGENTE_DEV_" (e.g. "C:\\apps\\cloudfly\\frontend_new\\tests\\AGENTE_DEV_login.spec.js").
       - Use the 'Execute Console Command' tool to run the newly created frontend tests (e.g. "cd frontend_new && npx playwright test").
       
    3. E2E INTEGRATION & SPEC COMPLIANCE:
       - You must verify that the full, multi-tiered data flow behaves perfectly (e.g., frontend action triggers backend api -> backend persists in DB -> pushes to Kafka -> worker processes campaign -> Evolution API sends message).
       - The task should ONLY be considered a SUCCESS if all E2E integration, backend, database, and frontend tests run successfully with 0 failures. If any test fails, it is a FAILURE.
       
    CRITICAL INSTRUCTIONS based on the verification result:
    
    SCENARIO A - SUCCESS (The entire project behaves perfectly, all tests pass, and all specs are met):
    1. You MUST use the 'Transition Jira Issue' tool to change the status of ALL the original Jira Issue Keys to 'Done'.
    2. You MUST use the 'Comment on Jira Issue' tool to post the final QA sign-off report summarizing all backend, database, messaging, and frontend tests run.
    
    SCENARIO B - FAILURE (Any endpoint failure, database inconsistency, automated test failure, or bug detected):
    1. DO NOT transition the original issues to 'Done'. You MUST use the 'Transition Jira Issue' tool to change the original issue status back to 'To Do'.
    2. You MUST use the 'Create Jira Issue' tool to create a NEW Bug/Task ticket detailing the exact failure, the specific automated test that failed, and what the developers need to fix in the next sprint.
    3. You MUST use the 'Comment on Jira Issue' tool to notify on the original issues that validation failed and a new Bug ticket was created.
    
    In BOTH scenarios, ALWAYS start your comments with "🤖 **QA Engineer**: " to identify yourself.
    CRITICAL: If the sprint goal contains a LATEST COMMENT from the user reporting a bug, your Jira comment MUST explicitly confirm to the user whether their specific bug was successfully fixed or if it still fails.
    
    CRITICAL FOR SPEC-DRIVEN DEVELOPMENT: If a specification file is present in the codebase context (such as spec.md), you MUST validate the endpoints and configurations strictly against that specification. Any deviation from the spec MUST be reported as a BUG.
    ''',
    expected_output='QA E2E sign-off report covering the entire project (Backend, Frontend, DB, Messaging), and Jira issues transitioned to Done (if success), OR a new Bug ticket created in Jira (if failure).',
    agent=qa_engineer
)

documentation_task = Task(
    description='''
    Based on the developed features for "{feature}" and the CURRENT CODEBASE CONTEXT:
    {codebase_context}
    
    Your role is to document the final system implementation, update specs, and draw clear visual diagrams.
    1. Check if the project documentation (such as README.md, spec.md, or system docs) needs to be updated with the newly developed feature.
    2. Write or update clean, elegant Markdown files containing technical documentation of the module, API contracts, database schemas, or configurations.
    3. Generate beautiful, professional Mermaid.js diagrams to visualize the architecture, sequence flows, or database ERDs of the new system features.
    4. Post a summary of your documentation updates and embed your Mermaid.js diagrams as code blocks in a detailed Jira comment on the relevant Jira Issue Keys.
    5. CRITICAL: You must use the 'Write Code To File' tool to save all your generated documentation to disk. Everything MUST be delivered strictly in Markdown (.md) format. Any visual diagrams (Mermaid.js flowcharts, sequence diagrams, or ERDs) MUST be embedded directly inside these Markdown files as fenced code blocks (using ```mermaid) rather than as standalone files.
    6. CRITICAL 2: All newly created documentation files MUST be saved in the directory "C:\\apps\\cloudfly\\docs" and their filenames MUST end in ".md" and start with the prefix "AGENTE_DEV_" (e.g. "C:\\apps\\cloudfly\\docs\\AGENTE_DEV_technical_architecture.md") to clearly distinguish them as being generated by the AI Scrum Team agent.
    7. Always start your comments with "🤖 **Technical Writer**: " to identify yourself.
    ''',
    expected_output='Comprehensive technical documentation and Mermaid.js diagrams saved strictly as .md files to the docs folder with the AGENTE_DEV_ prefix, and a detailed summary commented on Jira.',
    agent=technical_writer
)

frontend_development_task = Task(
    description='''
    Based on the technical blueprint provided by the System Architect, the specifications in spec.md, the CURRENT JIRA BACKLOG AND ISSUE HISTORY CONTEXT:
    {jira_backlog_context}
    
    and the CURRENT CODEBASE CONTEXT:
    {codebase_context}
    
    CRITICAL 0: Before writing any frontend code, you MUST use the 'Transition Jira Issue' tool to change the status of the processed Jira Issue Keys to 'In Progress'. If a ticket is already 'In Progress' or further advanced in the status context, acknowledge it and build upon the existing work.
    
    Design and implement the necessary React/Next.js components, pages, services, or styling files in the active "frontend_new" directory to fulfill the frontend requirements of "{feature}".
    1. Focus on high visual quality: use sleek dark modes, HSL tailored color palettes, smooth hover micro-animations, and modern typography (Google Fonts Outfit/Inter).
    2. Write modern TypeScript and clean Next.js 14 code (App Router structure). Avoid ad-hoc styling; utilize the established global CSS and design system.
    3. Ensure proper multi-tenant isolation by persistency and retrieval of \'activeTenantId\' and \'activeCompanyId\' from localStorage or routing.
    4. You MUST use the 'Write Code To File' tool to save all your frontend files strictly inside the "C:\\apps\\cloudfly\\frontend_new" directory structure.
    5. Write an automated unit or integration test script for your UI files if required.
    6. Post a summary of your frontend changes in a Jira comment on the relevant Jira Issue Keys, starting with "🤖 **Frontend Developer**: " to identify yourself.
    7. Before passing to DevOps/QA, use the 'Commit Code' tool to save your changes to Git.
    ''',
    expected_output='All React/Next.js files and UI components written to frontend_new. A Jira comment must be added.',
    agent=frontend_developer
)

