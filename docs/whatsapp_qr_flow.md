# Flujo de Generación de QR WhatsApp ⚓🛳️

Este diagrama detalla la integración técnica con la **Evolution API v2**, incluyendo las validaciones de salud, verificación de número y gestión inteligente de instancias.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant FE as Frontend (Wizard Step 2)
    participant CTL as ChatbotController / EvolutionController
    participant SVC as EvolutionService
    participant EAPI as Evolution API (v2)

    Note over FE, EAPI: Fase 2: Vinculación de WhatsApp
    Usuario->>FE: Montaje del Componente (o F5)
    FE->>CTL: GET /api/evolution/status/{instance}
    CTL->>SVC: checkConnection(instance)
    SVC->>EAPI: GET /instance/connectionState/{instance}
    EAPI-->>SVC: 200 OK (state: "open")
    
    alt Si estado es "open" (Ya conectado)
        SVC-->>CTL: Map (status: "connected")
        CTL-->>FE: JSON (status: "connected")
        FE->>FE: Auto-skip al siguiente paso
    else Si no está conectado
        FE->>CTL: POST /api/evolution/instance/{instance}
        CTL->>SVC: createInstance(instance)
        SVC->>EAPI: POST /instance/create
        EAPI-->>SVC: 200 OK
        
        FE->>CTL: GET /api/evolution/qr/{instance}
        CTL->>SVC: getQR(instance)
        SVC->>EAPI: GET /instance/connect/{instance}
        EAPI-->>SVC: 200 OK (base64 QR)
        FE->>Usuario: Muestra Código QR
        Usuario->>Usuario: Escanea QR con Mobile
        Usuario->>FE: Clic en "Ya escaneé"
        FE->>CTL: GET /api/evolution/status/{instance}
        CTL-->>FE: Status: Connected
    end

    Note over FE, EAPI: El Wizard detecta la conexión
    FE->>FE: SET account_setup_step = 3 (LocalStorage)
    FE->>Usuario: Avanza a Categorías (Paso 3)
```

### Notas Técnicas Implementadas:
1. **Instancia Maestra:** Se utiliza una instancia global (`cloudfly_chatbot1`) para verificar si el número del cliente tiene WhatsApp antes de desperdiciar recursos creando una instancia nueva.
2. **Resiliencia de Conexión:** Si la instancia ya existe (ej. re-intento de onboarding), el sistema recupera el QR existente mediante `/instance/connect` en lugar de fallar por "already exists".
3. **Persistencia Dual:** La configuración se asocia tanto al `tenant_id` como al `company_id` en la tabla `chatbot_configs`, garantizando integridad de datos multi-tenant.
4. **Targeting E2E:** Selector `.whatsapp-qr-code` disponible para validación automatizada.
