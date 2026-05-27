# Arquitectura Multi-Tenant en CloudFly

Este documento describe cómo CloudFly maneja el aislamiento de datos entre diferentes clientes (Tenants) y sus respectivas sedes (Companies).

## Conceptos Clave

1.  **Tenant (Cliente/Cuenta)**: La entidad principal que contrata el servicio. Representa una organización completa (ej. "Pixelweb").
2.  **Company (Sede/Compañía)**: Una subdivisión lógica dentro de un Tenant. Permite categorizar la información (ej. "Sede Medellín", "Sede Bogotá").

## Aislamiento de Datos

El aislamiento se garantiza mediante dos niveles de filtrado en cada consulta de base de datos:

*   `tenant_id`: Todas las tablas principales (contacts, pipelines, products, orders) incluyen esta columna.
*   `company_id`: Permite el filtrado granular dentro del mismo tenant.

## Flujo de Contexto (Headers)

El Frontend propaga el contexto seleccionado por el usuario mediante encabezados HTTP personalizados en cada petición procesada por `axiosInstance`:

*   `X-Tenant-Id`: El ID del Tenant activo.
*   `X-Company-Id`: El ID de la Compañía seleccionada.

### Prioridad de Resolución en Backend

Los controladores (especialmente `DashboardController`) siguen esta lógica:

1.  **MANAGER / SUPERADMIN**: 
    *   Pueden cambiar de contexto dinámicamente. 
    *   Si se envía `X-Tenant-Id` o `X-Company-Id` en los headers, el backend usa esos valores (previa validación de roles).
2.  **ADMIN / USER**:
    *   Están anclados a su `tenant_id` base definido en su perfil de usuario (`customerId`).
    *   Pueden filtrar por `company_id` si su rol lo permite.

## Sincronización de Autenticación

CloudFly utiliza **NextAuth** para el manejo de sesiones en el frontend, pero mantiene compatibilidad con servicios legados mediante el componente `AuthSync.tsx`.

*   `AuthSync` monitorea la sesión de NextAuth y replica el JWT y los datos del usuario en el `localStorage`.
*   Esto asegura que `axiosInstance` tenga siempre el token más reciente para incluirlo en el header `Authorization: Bearer <token>`.

## Recomendaciones para Desarrolladores

1.  **Siempre usar `axiosInstance`**: No usar el `axios` global, ya que `axiosInstance` inyecta automáticamente los headers de multi-tenencia.
2.  **Verificar Logs del Backend**: El backend está instrumentado con logs detallados (marcardos con `📊 [DASHBOARD]`) para rastrear qué Tenant y Company se están consultando.
3.  **Manejo de Estados**: Al añadir nuevos módulos, asegúrese de que las entidades tengan relación con `Tenant` y, si aplica, con `Company`.
