# 🔐 Plan de Implementación - Sistema RBAC CloudFly

## Fecha: 2025-12-20

---

## 📋 Resumen Ejecutivo

Implementar un sistema completo de Control de Acceso Basado en Roles (RBAC) que permita:
- Roles dinámicos configurables por tenant
- Permisos granulares por módulo y acción
- Control de navegación/menú basado en permisos
- Auditoría de accesos

---

## 🎭 Nuevos Roles del Sistema

| Rol | Alcance | Descripción |
|-----|---------|-------------|
| **SUPERADMIN** | Global | Dueño de CloudFly - Acceso total a todos los tenants |
| **ADMIN** | Tenant | Usuario principal del tenant - Gestiona usuarios y configuración |
| **VENDEDOR** | Tenant | Acceso a POS, cotizaciones, facturas, clientes |
| **CONTABILIDAD** | Tenant | Acceso a módulo contable completo |
| **NOMINA** | Tenant | Acceso a recursos humanos y nómina |
| **MARKETING** | Tenant | Acceso a chatbot, contactos, campañas |

---

## 🏗️ Arquitectura de Base de Datos

### Nuevas Tablas

```sql
-- Módulos del sistema
CREATE TABLE modules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,      -- 'pos', 'accounting', 'hr', etc.
    name VARCHAR(100) NOT NULL,            -- 'Punto de Venta'
    description VARCHAR(255),
    icon VARCHAR(50),                      -- Icono para el menú
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Acciones disponibles por módulo
CREATE TABLE module_actions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    module_id BIGINT NOT NULL,
    code VARCHAR(50) NOT NULL,             -- 'read', 'create', 'update', 'delete', 'export', 'approve'
    name VARCHAR(100) NOT NULL,            -- 'Ver', 'Crear', 'Editar', 'Eliminar'
    description VARCHAR(255),
    FOREIGN KEY (module_id) REFERENCES modules(id),
    UNIQUE KEY uk_module_action (module_id, code)
);

-- Roles (ahora dinámicos, sin enum)
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,      -- 'SUPERADMIN', 'ADMIN', etc.
    name VARCHAR(100) NOT NULL,            -- 'Super Administrador'
    description VARCHAR(255),
    is_system BOOLEAN DEFAULT FALSE,       -- TRUE para roles del sistema (no editables)
    tenant_id INT,                         -- NULL para roles globales
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Permisos: Relación Role-Module-Action
CREATE TABLE role_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT NOT NULL,
    module_action_id BIGINT NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (module_action_id) REFERENCES module_actions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_role_permission (role_id, module_action_id)
);

-- Tabla intermedia user_roles (ya existe, la mantenemos)
-- user_roles: user_id, role_id

-- Auditoría de accesos (opcional pero recomendado)
CREATE TABLE access_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tenant_id INT,
    module_code VARCHAR(50),
    action_code VARCHAR(50),
    resource_type VARCHAR(100),            -- 'Order', 'Invoice', etc.
    resource_id BIGINT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    success BOOLEAN DEFAULT TRUE,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_access (user_id, created_at),
    INDEX idx_tenant_access (tenant_id, created_at)
);
```

---

## 🗂️ Módulos del Sistema

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `dashboard` | Dashboard | Resumen general |
| `pos` | Punto de Venta | Ventas, órdenes |
| `products` | Productos | Catálogo de productos |
| `customers` | Clientes | Gestión de clientes |
| `quotes` | Cotizaciones | Cotizaciones y propuestas |
| `invoices` | Facturación | Facturas electrónicas |
| `accounting` | Contabilidad | Plan de cuentas, vouchers, reportes |
| `hr` | Recursos Humanos | Empleados |
| `payroll` | Nómina | Períodos, liquidación, recibos |
| `marketing` | Marketing | Contactos, campañas |
| `chatbot` | Chatbot | Configuración de bots |
| `settings` | Configuración | Ajustes del sistema |
| `users` | Usuarios | Gestión de usuarios |
| `roles` | Roles | Gestión de roles y permisos |

---

## 📁 Estructura de Archivos (Backend)

```
backend/src/main/java/com/app/starter1/
├── persistence/
│   ├── entity/
│   │   ├── rbac/
│   │   │   ├── Module.java
│   │   │   ├── ModuleAction.java
│   │   │   ├── Role.java              # Nuevo (reemplaza RoleEntity)
│   │   │   └── RolePermission.java
│   │   └── AccessLog.java
│   └── repository/
│       ├── rbac/
│       │   ├── ModuleRepository.java
│       │   ├── ModuleActionRepository.java
│       │   ├── RoleRepository.java     # Actualizado
│       │   └── RolePermissionRepository.java
│       └── AccessLogRepository.java
├── services/
│   ├── rbac/
│   │   ├── RbacService.java           # Servicio principal RBAC
│   │   ├── PermissionService.java     # Verificación de permisos
│   │   └── AccessLogService.java      # Auditoría
├── controllers/
│   └── RbacController.java            # API para gestión de roles
├── security/
│   ├── RbacAuthorizationManager.java  # Evaluador de permisos
│   └── annotations/
│       └── RequirePermission.java     # Anotación personalizada
└── config/
    └── SecurityConfig.java            # Simplificado
```

---

## 📁 Estructura de Archivos (Frontend)

```
frontend/src/
├── types/
│   └── rbac/
│       └── index.ts                   # Tipos para RBAC
├── services/
│   └── rbac/
│       └── rbacService.ts             # API calls
├── contexts/
│   └── PermissionContext.tsx          # Context de permisos
├── hooks/
│   └── usePermission.ts               # Hook para verificar permisos
├── components/
│   └── rbac/
│       ├── PermissionGate.tsx         # Componente que oculta/muestra
│       └── RoleForm.tsx               # Formulario de roles
└── views/apps/
    └── settings/
        └── roles/
            ├── list/
            │   └── page.tsx           # Lista de roles
            └── form/
                └── page.tsx           # Crear/Editar rol
```

---

## 🔄 Fases de Implementación

### **Fase 1: Base de Datos** ✅ COMPLETADO
- [x] Crear script SQL para nuevas tablas
- [x] Script de inserción de módulos y acciones
- [x] Script de inserción de roles del sistema
- [ ] Ejecutar migración en BD (pendiente manual)

### **Fase 2: Backend - Entidades y Repositorios** ✅ COMPLETADO
- [x] Crear entidades RBAC (Module, ModuleAction, Role, RolePermission, AccessLog)
- [x] Crear repositorios (ModuleRepository, ModuleActionRepository, etc.)
- [x] DTOs para RBAC (RoleDTO, MenuItemDTO, UserPermissionsDTO, etc.)

### **Fase 3: Backend - Servicios y Seguridad** ✅ COMPLETADO
- [x] Crear RbacService con:
  - Verificación de permisos
  - Generación dinámica de menú
  - CRUD de roles
- [x] Actualizar SecurityConfig con endpoints RBAC

### **Fase 4: Backend - API** ✅ COMPLETADO
- [x] Crear RbacController con endpoints:
  - GET /api/rbac/menu - Menú dinámico según rol
  - GET /api/rbac/my-permissions - Permisos del usuario
  - GET /api/rbac/check - Verificar permiso específico
  - CRUD /api/rbac/roles - Gestión de roles
  - GET /api/rbac/modules - Matriz de permisos

### **Fase 5: Frontend - Infraestructura** ✅ COMPLETADO
- [x] Crear tipos TypeScript (types/rbac/index.ts)
- [x] Crear servicio RBAC (services/rbac/rbacService.ts)
- [x] Crear PermissionContext (contexts/PermissionContext.tsx)
- [x] Crear PermissionGate component (components/rbac/PermissionGate.tsx)

### **Fase 6: Frontend - UI de Administración** ✅ COMPLETADO
- [x] Vista de lista de roles (/settings/roles/list)
- [x] Formulario crear/editar rol con matriz de permisos (/settings/roles/form)

### **Fase 7: Integración** ✅ COMPLETADO
- [x] Actualizar VerticalMenu.tsx para cargar menú del backend
- [ ] Agregar guards en rutas (puede hacerse gradualmente)
- [ ] Migrar controladores existentes a usar permisos dinámicos (puede hacerse gradualmente)

---

## 📊 Matriz de Permisos por Defecto

| Módulo | SUPERADMIN | ADMIN | VENDEDOR | CONTABILIDAD | NOMINA | MARKETING |
|--------|------------|-------|----------|--------------|--------|-----------|
| Dashboard | ✅ All | ✅ All | ✅ Read | ✅ Read | ✅ Read | ✅ Read |
| POS | ✅ All | ✅ All | ✅ All | ❌ | ❌ | ❌ |
| Productos | ✅ All | ✅ All | ✅ Read | ❌ | ❌ | ❌ |
| Clientes | ✅ All | ✅ All | ✅ All | ✅ Read | ❌ | ✅ Read |
| Cotizaciones | ✅ All | ✅ All | ✅ All | ✅ Read | ❌ | ❌ |
| Facturación | ✅ All | ✅ All | ✅ Create/Read | ✅ All | ❌ | ❌ |
| Contabilidad | ✅ All | ✅ All | ❌ | ✅ All | ❌ | ❌ |
| RRHH | ✅ All | ✅ All | ❌ | ❌ | ✅ All | ❌ |
| Nómina | ✅ All | ✅ All | ❌ | ❌ | ✅ All | ❌ |
| Marketing | ✅ All | ✅ All | ❌ | ❌ | ❌ | ✅ All |
| Chatbot | ✅ All | ✅ All | ❌ | ❌ | ❌ | ✅ All |
| Configuración | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ |
| Usuarios | ✅ All | ✅ All | ❌ | ❌ | ❌ | ❌ |
| Roles | ✅ All | ✅ Read | ❌ | ❌ | ❌ | ❌ |

---

## ⏱️ Estimación de Tiempo

| Fase | Tiempo Estimado |
|------|-----------------|
| Fase 1: Base de Datos | 30 min |
| Fase 2: Entidades | 45 min |
| Fase 3: Servicios | 60 min |
| Fase 4: API Backend | 30 min |
| Fase 5: Frontend Infra | 45 min |
| Fase 6: UI Admin | 60 min |
| Fase 7: Integración | 60 min |
| **Total** | **~5.5 horas** |

---

## ✅ Criterios de Éxito

1. Los roles son dinámicos y persistidos en BD
2. Los permisos se pueden asignar granularmente por módulo/acción
3. El menú lateral muestra solo los módulos permitidos
4. Los endpoints verifican permisos automáticamente
5. Existe una UI para administrar roles
6. Los usuarios existentes migran sin perder acceso

