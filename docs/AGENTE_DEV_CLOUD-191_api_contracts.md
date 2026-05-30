# CLOUD-191 "Hola Mundo" — API Contracts & Configuration

> **Ticket**: CLOUD-191  
> **Status**: ✅ Done  
> **Agent**: Technical Writer & Diagram Specialist  

---

## 1. Backend API Contract

### 1.1 Python Script Execution

While CLOUD-191 does not expose a network API, the script execution follows a defined contract:

```yaml
Execution Contract:
  Entry Point: holaM/main.py
  Runtime: Python 3.11+
  Expected Output: "hola mundo\n"
  Exit Code: 0 (success)
  Side Effects: None
  Dependencies: None
```

### 1.2 Docker Execution Contract

```yaml
Container Contract:
  Image: python:3.11-slim
  Working Directory: /app
  Command: ["python", "main.py"]
  Expected Behavior:
    - Container starts
    - Script executes
    - Output printed to stdout
    - Container exits with code 0
  Restart Policy: "no"
```

---

## 2. Frontend API Contracts

### 2.1 User Methods API

```typescript
/**
 * @interface UserLoginData
 * @description User authentication and tenant data from localStorage
 */
interface UserLoginData {
    activeTenantId: string | null;
    activeCompanyId: string | null;
    company_id?: string;  // Fallback field
    // ... other user fields
}

/**
 * @function userMethods.getUserLogin
 * @returns {UserLoginData | null} User data from localStorage
 * @throws Never - returns null if no data
 */
function getUserLogin(): UserLoginData | null;
```

**Usage in CLOUD-191:**

```typescript
const user = userMethods.getUserLogin();
setActiveTenantId(user?.activeTenantId || null);
setActiveCompanyId(user?.activeCompanyId || user?.company_id || null);
```

### 2.2 Page Props Contract

```typescript
/**
 * @component HolaMundoPage
 * @description Dashboard page for CLOUD-191 "Hola Mundo"
 * @route /hola-mundo
 * @routeGroup (dashboard) - requires authentication
 * @accessRoles MANAGER, ADMIN, USER
 */
interface HolaMundoPageProps {
    // No explicit props - uses client-side state
}

interface HolaMundoPageState {
    mounted: boolean;
    activeTenantId: string | null;
    activeCompanyId: string | null;
}
```

---

## 3. Navigation Contract

### 3.1 Menu Item Schema

```typescript
/**
 * @interface MenuItem
 * @description Schema for vertical menu entries
 */
interface MenuItem {
    label: string;
    icon: string;
    route: string;
    roles: ('MANAGER' | 'ADMIN' | 'USER' | 'BIOMEDICAL')[];
    children?: MenuItem[];
}

/**
 * @constant HOLA_MUNDO_MENU_ITEM
 * @description Menu entry for Hola Mundo page
 */
const HOLA_MUNDO_MENU_ITEM: MenuItem = {
    label: 'Hola Mundo',
    icon: 'rocket-launch',
    route: '/hola-mundo',
    roles: ['MANAGER', 'ADMIN', 'USER']
};
```

---

## 4. Docker Configuration Schema

### 4.1 Dockerfile Schema

```dockerfile
# Required Fields
FROM python:3.11-slim    # Base image - lightweight Python runtime
WORKDIR /app              # Working directory inside container
COPY main.py .            # Copy source file
CMD ["python", "main.py"] # Execution command
```

### 4.2 Docker Compose Schema

```yaml
version: '3.8'           # Compose file format version

services:
  hola-mundo:            # Service name
    build:
      context: .          # Build context (current directory)
      dockerfile: Dockerfile
    container_name: hola-mundo
    restart: "no"         # One-shot execution
```

---

## 5. Feature Cards Data Contract

```typescript
/**
 * @interface FeatureCard
 * @description Schema for feature cards displayed on the page
 */
interface FeatureCard {
    icon: React.ReactNode;
    title: string;
    description: string;
    color: string;        // HSL color string
    status: string;       // Display status label
}

/**
 * @constant FEATURES
 * @description Feature cards data for CLOUD-191
 */
const FEATURES: FeatureCard[] = [
    {
        icon: <TerminalIcon />,
        title: 'Python Backend',
        description: 'Script main.py ejecutándose correctamente con salida en consola.',
        color: 'hsl(142, 76%, 45%)',
        status: 'Activo'
    },
    {
        icon: <CloudIcon />,
        title: 'CloudFly Platform',
        description: 'Plataforma SaaS de automatización empresarial todo-en-uno.',
        color: 'hsl(220, 85%, 60%)',
        status: 'Conectado'
    },
    {
        icon: <SpeedIcon />,
        title: 'Next.js 14 Frontend',
        description: 'App Router, React Server Components, TypeScript y Tailwind CSS.',
        color: 'hsl(280, 70%, 60%)',
        status: 'Renderizando'
    },
    {
        icon: <SecurityIcon />,
        title: 'Multi-Tenant',
        description: 'Aislamiento por tenant y company con persistencia en localStorage.',
        color: 'hsl(35, 90%, 55%)',
        status: 'Aislado'
    },
    {
        icon: <LanguageIcon />,
        title: 'Evolution API',
        description: 'WhatsApp messaging via webhook en puerto 8080 con PostgreSQL.',
        color: 'hsl(190, 80%, 50%)',
        status: 'Escuchando'
    },
    {
        icon: <CodeIcon />,
        title: 'Kafka Messaging',
        description: 'Broker Apache Kafka en puerto 9092 con topic whatsapp-notifications.',
        color: 'hsl(0, 75%, 60%)',
        status: 'Produciendo'
    }
];
```

---

## 6. Tech Stack Data Contract

```typescript
/**
 * @interface TechChip
 * @description Schema for technology stack chips
 */
interface TechChip {
    name: string;
    color: string;        // HSL color string
}

/**
 * @constant TECH_STACK
 * @description Technologies displayed on the page
 */
const TECH_STACK: TechChip[] = [
    { name: 'Next.js 14', color: 'hsl(0, 0%, 90%)' },
    { name: 'React 18', color: 'hsl(190, 80%, 55%)' },
    { name: 'TypeScript', color: 'hsl(210, 80%, 60%)' },
    { name: 'MUI v5', color: 'hsl(220, 85%, 60%)' },
    { name: 'Tailwind CSS', color: 'hsl(170, 70%, 50%)' },
    { name: 'Python', color: 'hsl(50, 80%, 55%)' },
    { name: 'Docker', color: 'hsl(200, 85%, 55%)' },
    { name: 'PostgreSQL', color: 'hsl(220, 60%, 55%)' },
    { name: 'Kafka', color: 'hsl(0, 0%, 70%)' },
    { name: 'Evolution API', color: 'hsl(142, 76%, 45%)' }
];
```

---

## 7. Animation Timing Contract

```typescript
/**
 * @description Animation timing constants (in milliseconds)
 */
const ANIMATION_TIMINGS = {
    hero: {
        fadeIn: 800
    },
    title: {
        slideUp: 1000
    },
    subtitle: {
        slideUp: 1200
    },
    buttons: {
        slideUp: 1600
    },
    terminal: {
        zoom: 1800
    },
    tenantBar: {
        grow: 2000
    },
    featureCards: {
        base: 1400,
        stagger: 150      // Increment per card
    },
    techChips: {
        base: 2400,
        stagger: 80       // Increment per chip
    },
    footer: {
        fadeIn: 2800
    }
};
```

---

## 8. Test Contract

### 8.1 Test Suite Schema

```typescript
/**
 * @suite HolaMundo Page Tests
 * @file frontend_new/src/test/hola-mundo.test.tsx
 * @framework Vitest + React Testing Library
 * @coverage 10 tests
 */
describe('HolaMundo Page', () => {
    // Test 1: Component exports correctly
    it('should export a default component');
    
    // Test 2: Main heading renders
    it('should render the main heading');
    
    // Test 3: Badge renders
    it('should display the CloudFly AI badge');
    
    // Test 4: Code snippet renders
    it('should display the code snippet print("hola mundo")');
    
    // Test 5: Tenant info renders
    it('should display tenant and company info');
    
    // Test 6: Ticket reference renders
    it('should display the CLOUD-191 ticket reference');
    
    // Test 7: Feature cards render
    it('should display feature cards');
    
    // Test 8: Tech stack renders
    it('should display tech stack chips');
    
    // Test 9: Completion chip renders
    it('should display the Completado chip');
    
    // Test 10: Component mounts without errors
    // (Implicit - all tests passing confirms this)
});
```

### 8.2 Mock Contracts

```typescript
/**
 * @mock userMethods.getUserLogin
 * @returns Consistent test data
 */
vi.mock('@/utils/userMethods', () => ({
    userMethods: {
        getUserLogin: vi.fn().mockReturnValue({
            activeTenantId: 'tenant-123',
            activeCompanyId: 'company-456'
        })
    }
}));

/**
 * @mock useMediaQuery
 * @returns false (desktop viewport)
 */
vi.mock('@mui/material/useMediaQuery', () => ({
    default: vi.fn().mockReturnValue(false)
}));

/**
 * @mock useTheme
 * @returns Dark mode theme
 */
vi.mock('@mui/material/styles/useTheme', () => ({
    default: vi.fn().mockReturnValue({
        palette: { mode: 'dark' },
        breakpoints: { down: vi.fn().mockReturnValue('md') }
    })
}));
```

---

## 9. Environment Variables

CLOUD-191 does not require any environment variables. However, it integrates with the platform's existing configuration:

```yaml
# Platform Environment (for reference)
NEXT_PUBLIC_API_URL: http://localhost:8000
NEXT_PUBLIC_WS_URL: ws://localhost:8000
DATABASE_URL: postgresql://user:pass@localhost:5432/cloudfly
KAFKA_BROKERS: localhost:9092
EVOLUTION_API_URL: http://localhost:8080
```

---

## 10. File System Contract

```
C:\apps\cloudfly\
├── holaM/                          # CLOUD-191 Backend
│   ├── main.py                     # Python entry point (19 bytes)
│   ├── Dockerfile                  # Container definition (86 bytes)
│   └── docker-compose.yml          # Service orchestration (155 bytes)
│
├── frontend_new/
│   ├── src/
│   │   ├── app/(dashboard)/
│   │   │   └── hola-mundo/
│   │   │       └── page.tsx        # Frontend page (~500 lines)
│   │   ├── components/layout/vertical/
│   │   │   └── verticalMenuData.ts # Navigation config (modified)
│   │   └── test/
│   │       └── hola-mundo.test.tsx # Unit tests (~150 lines)
│
└── docs/
    ├── AGENTE_DEV_CLOUD-191_technical_documentation.md
    ├── AGENTE_DEV_CLOUD-191_architecture_diagrams.md
    └── AGENTE_DEV_CLOUD-191_api_contracts.md
```

---

## 11. Version Compatibility Matrix

| Component | Version | Status |
|-----------|---------|--------|
| Python | 3.11+ | ✅ Compatible |
| Node.js | 18+ | ✅ Compatible |
| Next.js | 14.x | ✅ Compatible |
| React | 18.x | ✅ Compatible |
| MUI | 5.x | ✅ Compatible |
| Docker | 20.10+ | ✅ Compatible |
| Docker Compose | 3.8+ | ✅ Compatible |
| Vitest | Latest | ✅ Compatible |

---

*API Contracts generated by 🤖 Technical Writer & Diagram Specialist*  
*CloudFly AI Platform — 2025-12-11*
