# Sistema de Configuración de Tipos de Chatbot

## Descripción General

Este sistema permite gestionar tipos de chatbot con sus respectivas URLs de webhook de n8n de manera centralizada. Los administradores (SUPERADMIN) pueden configurar diferentes tipos de chatbot, y cuando un tenant selecciona un tipo, automáticamente se le asigna la URL del webhook correspondiente.

## Estructura del Sistema

### Backend

#### Entidades
- **ChatbotTypeConfig** (`chatbot_type_configs`): Almacena los tipos de chatbot disponibles y sus URLs de webhook
  - `id`: Identificador único
  - `typeName`: Nombre del tipo (ej: SALES, SUPPORT, SCHEDULING)
  - `description`: Descripción del tipo de chatbot
  - `webhookUrl`: URL del webhook de n8n (oculta para usuarios finales)
  - `status`: Estado activo/inactivo
  - `createdAt`, `updatedAt`: Timestamps

#### Componentes Backend
1. **Entity**: `ChatbotTypeConfig.java`
2. **Repository**: `ChatbotTypeConfigRepository.java`
3. **Service**: `ChatbotTypeConfigService.java`
4. **Controller**: `ChatbotTypeConfigController.java`
5. **DTOs**: 
   - `ChatbotTypeConfigCreateRequest.java`
   - `ChatbotTypeConfigResponse.java`

#### Endpoints API
- `GET /chatbot-types` - Lista todos los tipos
- `GET /chatbot-types/active` - Lista solo los tipos activos
- `GET /chatbot-types/{id}` - Obtiene un tipo por ID
- `GET /chatbot-types/by-name/{typeName}` - Obtiene un tipo por nombre
- `POST /chatbot-types` - Crea un nuevo tipo
- `PUT /chatbot-types/{id}` - Actualiza un tipo
- `DELETE /chatbot-types/{id}` - Elimina un tipo
- `PATCH /chatbot-types/{id}/toggle-status` - Cambia el estado

#### Seguridad
Los endpoints están protegidos y solo accesibles para roles `SUPERADMIN` y `ADMIN`.

### Frontend

#### Componentes
1. **Gestión de Tipos de Chatbot**:
   - Ruta: `/settings/chatbot-types/list`
   - Componentes:
     - `ChatbotTypesListTable.tsx`: Tabla con CRUD completo
     - `ChatbotTypeForm` (Dialog): Formulario de creación/edición
   - Solo accesible para SUPERADMIN

2. **Configuración de Chatbot por Tenant**:
   - Ruta: `/settings/chatbot`
   - Modificaciones:
     - Select dinámico de tipos de chatbot
     - URL de webhook oculta (se asigna automáticamente)
     - Al seleccionar un tipo, se actualiza `n8nWebhookUrl` en el estado

#### Flujo de Uso

1. **SUPERADMIN configura tipos** (una sola vez):
   - Navega a "Comunicaciones" → "Tipos de Chatbot"
   - Crea/edita tipos con sus URLs de webhook de n8n
   - Activa/desactiva tipos según necesidad

2. **Tenant configura su chatbot**:
   - Navega a "Comunicaciones" → "Chatbot IA WhatsApp"
   - Selecciona el tipo de chatbot deseado
   - El sistema automáticamente asigna la URL del webhook configurada
   - El usuario NO ve la URL del webhook (está oculta)

### Base de Datos

#### Migración
Archivo: `V8__create_chatbot_type_configs_table.sql`

La migración crea la tabla e inserta tres tipos predeterminados:
- SALES: Para ventas y e-commerce
- SUPPORT: Para soporte al cliente
- SCHEDULING: Para agendamiento

**Nota**: Las URLs de webhook insertadas son placeholders y deben actualizarse con las URLs reales de n8n después del deployment.

## Configuración Inicial

### 1. Ejecutar Migración
La migración se ejecuta automáticamente con Flyway al iniciar la aplicación.

### 2. Actualizar URLs de Webhook
Después del deployment, un SUPERADMIN debe:
1. Ir a `/settings/chatbot-types/list`
2. Editar cada tipo de chatbot
3. Actualizar el campo "URL del Webhook n8n" con la URL real de n8n

Ejemplo de URLs reales:
```
SALES: https://autobot.cloudfly.com.co/webhook/ai-sales-assistant
SUPPORT: https://autobot.cloudfly.com.co/webhook/ai-support-assistant
SCHEDULING: https://autobot.cloudfly.com.co/webhook/ai-scheduling-assistant
```

### 3. Activar Tipos
Asegurarse de que los tipos que se desean ofrecer estén en estado "Activo".

## Estructura de Archivos

### Backend
```
backend/src/main/java/com/app/starter1/
├── persistence/
│   ├── entity/
│   │   └── ChatbotTypeConfig.java
│   ├── repository/
│   │   └── ChatbotTypeConfigRepository.java
│   └── services/
│       └── ChatbotTypeConfigService.java
├── controllers/
│   └── ChatbotTypeConfigController.java
├── dto/
│   ├── ChatbotTypeConfigCreateRequest.java
│   └── ChatbotTypeConfigResponse.java
└── config/
    └── SecurityConfig.java (actualizado)

backend/src/main/resources/db/migration/
└── V8__create_chatbot_type_configs_table.sql
```

### Frontend
```
frontend/src/
├── app/(dashboard)/settings/chatbot-types/list/
│   └── page.tsx
├── views/apps/settings/
│   ├── chatbot/
│   │   └── index.tsx (actualizado)
│   └── chatbot-types/list/
│       ├── index.tsx
│       └── ChatbotTypesListTable.tsx
├── components/dialogs/
│   └── form-chatbot-type/
│       └── index.tsx
├── types/apps/
│   └── chatbotTypes.ts (actualizado)
└── components/layout/vertical/
    └── verticalMenuData.json (actualizado)
```

## Seguridad

### Roles y Permisos
- **SUPERADMIN**: 
  - Gestión completa de tipos de chatbot
  - Configuración de chatbots
- **ADMIN**: 
  - Configuración de chatbots
  - NO puede gestionar tipos de chatbot

### URLs Ocultas
Las URLs de webhook están ocultas para los usuarios finales por seguridad. Solo se muestran en el panel de administración de tipos de chatbot.

## Ventajas del Sistema

1. **Centralización**: Un solo lugar para gestionar URLs de webhook
2. **Seguridad**: URLs ocultas para usuarios finales
3. **Flexibilidad**: Fácil agregar nuevos tipos de chatbot
4. **Escalabilidad**: Soporta múltiples tipos y fácil mantenimiento
5. **Multi-tenant**: Cada tenant puede seleccionar el tipo que necesite

## Mantenimiento

### Agregar un Nuevo Tipo
1. Crear el workflow en n8n
2. Obtener la URL del webhook
3. En el panel admin, crear nuevo tipo con nombre, descripción y URL
4. Activar el tipo

### Actualizar URL de Webhook
1. Ir a "Tipos de Chatbot"
2. Editar el tipo correspondiente
3. Actualizar la URL
4. Guardar

### Desactivar un Tipo
1. Ir a "Tipos de Chatbot"
2. Click en el chip de estado del tipo
3. Automáticamente cambia a inactivo
4. Ya no aparecerá en el selector para nuevos chatbots

## Troubleshooting

### Los tipos no aparecen en el selector
- Verificar que estén en estado "Activo"
- Verificar permisos de seguridad en el backend
- Revisar console del navegador por errores

### Error al guardar configuración
- Verificar que la migración se haya ejecutado correctamente
- Verificar que el tipo seleccionado exista en la base de datos
- Revisar logs del backend

### URLs de webhook no funcionan
- Verificar que las URLs estén correctamente configuradas en n8n
- Verificar que las URLs en la BD coincidan con las de n8n
- Verificar que los workflows en n8n estén activos
