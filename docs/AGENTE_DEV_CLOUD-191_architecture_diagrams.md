# CLOUD-191 "Hola Mundo" — Architecture Diagrams

> **Ticket**: CLOUD-191  
> **Status**: ✅ Done  
> **Agent**: Technical Writer & Diagram Specialist  

---

## 1. System Context Diagram

```mermaid
graph TB
    subgraph Users["👥 Users"]
        DEV[Developer]
        ADMIN[Admin User]
        MANAGER[Manager]
    end

    subgraph CloudFly["CloudFly AI Platform"]
        WEB[Next.js 14 Frontend<br/>Port 3000]
        API[Backend Services<br/>Python + Java]
        DB[(PostgreSQL<br/>Port 5432)]
        KAFKA[Apache Kafka<br/>Port 9092]
        EVOLUTION[Evolution API<br/>Port 8080]
    end

    subgraph External["External Services"]
        WA[WhatsApp Business API]
        FB[Facebook Messenger]
    end

    subgraph CLOUD191["🆕 CLOUD-191 Feature"]
        HOLAM[holaM/main.py]
        DOCKER[Docker Container<br/>hola-mundo]
        PAGE[/hola-mundo Page]
    end

    DEV --> WEB
    ADMIN --> WEB
    MANAGER --> WEB
    
    WEB --> API
    API --> DB
    API --> KAFKA
    API --> EVOLUTION
    
    EVOLUTION --> WA
    EVOLUTION --> FB
    
    HOLAM --> DOCKER
    DOCKER -.->|Future Integration| API
    PAGE --> WEB

    style CLOUD191 fill:#e8f5e9,stroke:#4caf50,stroke-width:3px
    style CloudFly fill:#e3f2fd,stroke:#2196f3
    style Users fill:#fce4ec,stroke:#e91e63
    style External fill:#fff3e0,stroke:#ff9800
```

---

## 2. Component Architecture

```mermaid
graph LR
    subgraph Frontend["Frontend Layer (Next.js 14)"]
        direction TB
        PAGE[hola-mundo/page.tsx]
        MENU[verticalMenuData.ts]
        THEME[MUI Theme Provider]
        AUTH[Auth Context]
        
        PAGE --> MENU
        PAGE --> THEME
        PAGE --> AUTH
    end

    subgraph Backend["Backend Layer"]
        direction TB
        MAIN[holaM/main.py]
        DOCKERFILE[holaM/Dockerfile]
        COMPOSE[holaM/docker-compose.yml]
        
        DOCKERFILE --> MAIN
        COMPOSE --> DOCKERFILE
    end

    subgraph Storage["Storage Layer"]
        LOCAL[(localStorage)]
        POSTGRES[(PostgreSQL)]
    end

    Frontend -->|userMethods.getUserLogin| LOCAL
    Backend -.->|Future| POSTGRES

    style Frontend fill:#fce4ec,stroke:#e91e63
    style Backend fill:#e8f5e9,stroke:#4caf50
    style Storage fill:#fff3e0,stroke:#ff9800
```

---

## 3. Docker Deployment Flow

```mermaid
flowchart TD
    START([Developer runs<br/>docker-compose up]) --> BUILD[Build Docker Image]
    BUILD --> COPY[Copy main.py to /app]
    COPY --> RUN[Execute python main.py]
    RUN --> OUTPUT[Output: hola mundo]
    OUTPUT --> EXIT[Container exits<br/>restart: no]
    
    subgraph Dockerfile["Dockerfile Configuration"]
        BASE[FROM python:3.11-slim]
        WORK[WORKDIR /app]
        COPY_CMD[COPY main.py .]
        CMD[CMD python main.py]
    end

    BASE --> WORK --> COPY_CMD --> CMD

    style START fill:#4caf50,color:#fff
    style EXIT fill:#ff9800,color:#fff
    style Dockerfile fill:#e3f2fd,stroke:#2196f3
```

---

## 4. Frontend Page Render Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant R as React Component
    participant LS as localStorage
    participant MUI as MUI Animations
    
    U->>B: Navigate to /hola-mundo
    B->>R: Mount HolaMundoPage
    R->>R: useState(mounted: false)
    R-->>B: Return null (SSR hydration)
    
    Note over R: useEffect fires
    R->>R: setMounted(true)
    R->>LS: userMethods.getUserLogin()
    LS-->>R: { activeTenantId, activeCompanyId }
    R->>R: setActiveTenantId(), setActiveCompanyId()
    
    Note over MUI: Staggered animations begin
    R->>MUI: Fade in Hero (800ms)
    R->>MUI: Slide up Title (1000ms)
    R->>MUI: Slide up Subtitle (1200ms)
    R->>MUI: Slide up Buttons (1600ms)
    R->>MUI: Zoom Terminal (1800ms)
    R->>MUI: Grow Tenant Bar (2000ms)
    R->>MUI: Grow Feature Cards (1400-2150ms)
    R->>MUI: Grow Tech Chips (2400-3120ms)
    R->>MUI: Fade Footer (2800ms)
    
    MUI-->>B: Fully rendered animated page
    B-->>U: Display Hola Mundo dashboard
```

---

## 5. Navigation Integration

```mermaid
graph TD
    subgraph Menu["Vertical Menu Data"]
        HOLA[Hola Mundo<br/>🚀 rocket-launch<br/>Roles: MANAGER, ADMIN, USER]
        COM[Comunicaciones]
        MKT[Marketing]
        CAL[Calendario]
        USR[Usuarios y Roles]
        VEN[Ventas]
        ADM[Administracion]
        
        HOLA --> COM --> MKT --> CAL --> USR --> VEN --> ADM
    end

    subgraph Routes["Route Mapping"]
        R1[/hola-mundo]
        R2[/comunicaciones/*]
        R3[/marketing/*]
        R4[/calendar/*]
        R5[/accounts/*]
        R6[/ventas/*]
        R7[/administracion/*]
    end

    HOLA --> R1
    COM --> R2
    MKT --> R3
    CAL --> R4
    USR --> R5
    VEN --> R6
    ADM --> R7

    style HOLA fill:#4caf50,color:#fff,stroke-width:3px
    style R1 fill:#e8f5e9,stroke:#4caf50
```

---

## 6. Test Coverage Map

```mermaid
graph TB
    subgraph Tests["10 Unit Tests (Vitest)"]
        T1[Test 1: Default export exists]
        T2[Test 2: Main heading renders]
        T3[Test 3: CloudFly AI badge renders]
        T4[Test 4: Code snippet renders]
        T5[Test 5: Tenant info renders]
        T6[Test 6: Ticket reference renders]
        T7[Test 7: Feature cards render]
        T8[Test 8: Tech stack chips render]
        T9[Test 9: Completion chip renders]
        T10[Test 10: Component mounts without errors]
    end

    subgraph Mocks["Mocked Dependencies"]
        M1[userMethods.getUserLogin]
        M2[useMediaQuery]
        M3[useTheme]
        M4[SocketContext]
        M5[Redux hooks]
        M6[next/navigation]
    end

    T1 --> Mocks
    T2 --> Mocks
    T3 --> Mocks
    T4 --> Mocks
    T5 --> M1
    T6 --> Mocks
    T7 --> Mocks
    T8 --> Mocks
    T9 --> Mocks
    T10 --> Mocks

    style Tests fill:#e8f5e9,stroke:#4caf50
    style Mocks fill:#fff3e0,stroke:#ff9800
```

---

## 7. Data Flow Diagram

```mermaid
flowchart LR
    subgraph Input["Input Sources"]
        DEV[Developer Code]
        USER[User Login Data]
    end

    subgraph Processing["Processing"]
        PYTHON[Python Interpreter]
        DOCKER[Docker Engine]
        REACT[React Runtime]
    end

    subgraph Output["Output"]
        CONSOLE[Console: hola mundo]
        UI[UI: Hola Mundo Page]
        TESTS[Test Results: 10/10 pass]
    end

    DEV --> PYTHON --> CONSOLE
    DEV --> DOCKER --> CONSOLE
    USER --> REACT --> UI
    REACT --> TESTS

    style Input fill:#fce4ec,stroke:#e91e63
    style Processing fill:#e3f2fd,stroke:#2196f3
    style Output fill:#e8f5e9,stroke:#4caf50
```

---

## 8. Feature Cards Entity Relationship

```mermaid
erDiagram
    PAGE ||--o{ FEATURE_CARD : contains
    PAGE ||--o{ TECH_CHIP : contains
    PAGE ||--|| TENANT_BAR : displays
    PAGE ||--|| HERO_SECTION : includes
    PAGE ||--|| TERMINAL_PREVIEW : includes
    
    FEATURE_CARD {
        string title
        string description
        string icon
        string color
        string status
    }
    
    TECH_CHIP {
        string name
        string color
    }
    
    TENANT_BAR {
        string tenantId
        string companyId
        string ticketRef
    }
    
    HERO_SECTION {
        string title
        string subtitle
        string gradientColors
    }
    
    TERMINAL_PREVIEW {
        string codeSnippet
        string output
    }
```

---

## 9. Animation Timing Diagram

```mermaid
gantt
    title Animation Stagger Timeline
    dateFormat X
    axisFormat %L ms
    
    section Hero
    Fade In           :0, 800
    
    section Title
    Slide Up (Title)  :200, 1000
    Slide Up (Subtitle):400, 1200
    Slide Up (Buttons):600, 1600
    
    section Preview
    Zoom Terminal     :800, 1800
    
    section Info
    Grow Tenant Bar   :1000, 2000
    
    section Features
    Grow Card 1       :400, 1400
    Grow Card 2       :550, 1550
    Grow Card 3       :700, 1700
    Grow Card 4       :850, 1850
    Grow Card 5       :1000, 2000
    Grow Card 6       :1150, 2150
    
    section Tech
    Grow Chip 1       :1400, 2400
    Grow Chip 2       :1480, 2480
    Grow Chip 3       :1560, 2560
    Grow Chip 4       :1640, 2640
    Grow Chip 5       :1720, 2720
    Grow Chip 6       :1800, 2800
    Grow Chip 7       :1880, 2880
    Grow Chip 8       :1960, 2960
    Grow Chip 9       :2040, 3040
    Grow Chip 10      :2120, 3120
    
    section Footer
    Fade Footer       :1800, 2800
```

---

## 10. Git Commit History

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "CLOUD-150: Evolution API"
    commit id: "CLOUD-145: Kafka messaging"
    branch feature/CLOUD-191
    checkout feature/CLOUD-191
    commit id: "CLOUD-191: Create holaM/main.py"
    commit id: "CLOUD-191: Add Dockerfile"
    commit id: "CLOUD-191: Add docker-compose.yml"
    commit id: "CLOUD-191: Create /hola-mundo page"
    commit id: "CLOUD-191: Add menu entry"
    commit id: "CLOUD-191: Add unit tests"
    commit id: "CLOUD-191: Documentation"
    checkout main
    merge feature/CLOUD-191
    commit id: "Release: CLOUD-191 complete"
```

---

## 11. Platform Integration Map

```mermaid
graph TB
    subgraph CLOUD191["CLOUD-191 Feature"]
        MAIN[holaM/main.py]
        PAGE[/hola-mundo Page]
    end
    
    subgraph Platform["CloudFly Platform Services"]
        AUTH[Auth Service<br/>userMethods]
        TENANT[Tenant Service<br/>Multi-tenant isolation]
        MSG[Messaging Service<br/>Kafka + Evolution API]
        CRM[CRM Service<br/>Pipelines + Contacts]
        BILL[Billing Service<br/>Invoicing + Payments]
        HR[HR Service<br/>Payroll + Employees]
    end
    
    PAGE --> AUTH
    PAGE --> TENANT
    PAGE -.->|Future| MSG
    PAGE -.->|Future| CRM
    PAGE -.->|Future| BILL
    PAGE -.->|Future| HR
    
    MAIN -.->|Future| MSG

    style CLOUD191 fill:#e8f5e9,stroke:#4caf50,stroke-width:3px
    style Platform fill:#e3f2fd,stroke:#2196f3
```

---

## 12. Environment Architecture

```mermaid
graph TB
    subgraph Local["Local Development"]
        CODE[Source Code<br/>C:\apps\cloudfly]
        DOCKER_LOCAL[Docker Desktop]
        BROWSER[Browser<br/>localhost:3000]
    end
    
    subgraph VPS["CloudFly VPS (api.cloudfly.com.co)"]
        NGINX[Nginx Reverse Proxy]
        NEXT_VPS[Next.js Server<br/>Port 3000]
        JAVA_VPS[Java Services<br/>Notification Service]
        EVOLUTION_VPS[Evolution API<br/>Port 8080]
        KAFKA_VPS[Kafka Broker<br/>Port 9092]
        POSTGRES_VPS[(PostgreSQL<br/>Port 5432)]
    end
    
    subgraph External["External"]
        WHATSAPP[WhatsApp Business API]
        FACEBOOK[Facebook Graph API]
    end
    
    CODE --> DOCKER_LOCAL
    DOCKER_LOCAL --> BROWSER
    
    CODE -.->|Deploy| NGINX
    NGINX --> NEXT_VPS
    NGINX --> JAVA_VPS
    JAVA_VPS --> KAFKA_VPS
    JAVA_VPS --> EVOLUTION_VPS
    JAVA_VPS --> POSTGRES_VPS
    EVOLUTION_VPS --> WHATSAPP
    EVOLUTION_VPS --> FACEBOOK

    style Local fill:#e8f5e9,stroke:#4caf50
    style VPS fill:#e3f2fd,stroke:#2196f3
    style External fill:#fff3e0,stroke:#ff9800
```

---

*Diagrams generated by 🤖 Technical Writer & Diagram Specialist*  
*CloudFly AI Platform — 2025-12-11*
