# Diagrama Maestro: Account Setup Orchestrator ⚓🛳️

Este diagrama actúa como el orquestador central, referenciando los sub-diagramas detallados para cada paso del wizard de onboarding.

```mermaid
sequenceDiagram
    autonumber
    actor Usuario
    participant FE as Frontend (Wizard)
    participant LS as LocalStorage
    participant CTL as CustomerController
    participant RBAC as RbacController
    
    Note over FE, LS: Inicialización (Resiliencia F5)
    FE->>LS: GET account_setup_step
    LS-->>FE: activeStep o 0
    FE->>LS: GET userData
    LS-->>FE: userId & customerId (si existe)
    Note over FE: Si tiene customerId, salta al Paso 2 (WhatsApp)

    Note over Usuario, SVC: Paso 1: Tu Negocio (Tenant & Company)
    Usuario->>FE: Envía Datos de Negocio
    FE->>CTL: Orquestación e Infraestructura
    Note right of CTL: Ver business_setup_flow.md
    CTL-->>FE: Setup OK (Suscripción + WA creada)
    FE->>LS: SET account_setup_step = 2
    FE->>LS: UPDATE userData (add customerId)
    
    Note over Usuario, SVC: Paso 2: Chatbot IA (Vinculación QR)
    FE->>CTL: GET /api/evolution/status/{instance} (F5 Resilience)
    alt Si "open"
        FE->>FE: Auto-skip a Paso 3
    else No conectado
        FE->>CTL: Solicita QR de vinculación
        Note right of CTL: Ver whatsapp_qr_flow.md
        CTL-->>FE: QR Code (Base64)
    end
    FE->>LS: SET account_setup_step = 3
    
    Note over Usuario, SVC: Paso 3: Catálogo (Categorías)
    Usuario->>FE: Crea Categoría
    FE->>CTL: Persistencia Categoría
    Note right of CTL: Ver category_setup_flow.md
    FE->>LS: SET account_setup_step = 4
    
    Note over Usuario, SVC: Paso 4: Inventario (Productos)
    Usuario->>FE: Crea Producto
    FE->>CTL: Persistencia Producto
    Note right of CTL: Ver product_setup_flow.md
    FE->>LS: REMOVE account_setup_step (Completo)
    
    Note over Usuario, RBAC: Finalización y Activación de Menú
    FE->>RBAC: GET /my-permissions (Post-Setup)
    RBAC->>RBAC: Carga Módulos de Suscripción Activa
    RBAC-->>FE: Menú Dinámico Actualizado
    FE->>Usuario: Redirección a Dashboard con Menú Activo
```

### Mapa de Referencias Técnicas:
- **Datos de Negocio:** [business_setup_flow.md](file:///C:/Users/Edwin/.gemini/antigravity/brain/7c4f4fd6-4517-4cd6-9cb9-ce5112c7abe1/business_setup_flow.md)
- **Activación WhatsApp:** [whatsapp_qr_flow.md](file:///C:/Users/Edwin/.gemini/antigravity/brain/7c4f4fd6-4517-4cd6-9cb9-ce5112c7abe1/whatsapp_qr_flow.md)
- **Categorías:** [category_setup_flow.md](file:///C:/Users/Edwin/.gemini/antigravity/brain/7c4f4fd6-4517-4cd6-9cb9-ce5112c7abe1/category_setup_flow.md)
- **Productos:** [product_setup_flow.md](file:///C:/Users/Edwin/.gemini/antigravity/brain/7c4f4fd6-4517-4cd6-9cb9-ce5112c7abe1/product_setup_flow.md)
