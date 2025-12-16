# Solución: Datos no cargaban en Frontend (Tablas Vacías)

## Problema Identificado
El usuario reportó que las tablas del frontend (Cotizaciones, Pedidos, Facturas) no mostraban datos a pesar de que la base de datos tenía registros y el login funcionaba correctamente.

### Diagnóstico Técnico
Al depurar el endpoint `/quotes/tenant/1` directamente contra el backend, se obtuvo un error `500 Internal Server Error` con el mensaje:
`failed to lazily initialize a collection of role: com.app.starter1.persistence.entity.Quote.items: could not initialize proxy - no Session`

Esto indica una **`LazyInitializationException`** de Hibernate.
**Causa:** Los servicios (`QuoteService`, `InvoiceService`) estaban intentando acceder a colecciones perezosas (`items`) dentro de métodos de mapeo (`mapToDTO`) fuera de una transacción activa. Al finalizar la consulta al repositorio, la sesión de Hibernate se cerraba, impidiendo la carga de los items relacionados.

## Solución Aplicada

Se agregó la anotación `@Transactional` a los métodos de lectura en los servicios afectados para mantener la sesión de base de datos activa durante todo el proceso de recuperación y mapeo de datos.

### 1. Backend: QuoteService.java
**Archivo:** `backend/src/main/java/com/app/starter1/persistence/services/QuoteService.java`
- Se agregó `@Transactional` a:
    - `getQuotesByTenant(Long tenantId)`
    - `getQuoteById(Long id)`

### 2. Backend: InvoiceService.java
**Archivo:** `backend/src/main/java/com/app/starter1/persistence/services/InvoiceService.java`
- Se agregó `@Transactional` a:
    - `getInvoicesByTenant(Long tenantId)`
    - `getInvoiceById(Long id)`

### 3. Verificación
- Se ejecutó un script de prueba (`debug_quotes.ps1`) que confirmó que la API ahora devuelve el JSON completo de las cotizaciones, incluyendo sus items.
- Se realizó una prueba de flujo en el frontend (Browser Subagent) confirmando:
    1.  Carga de lista de Cotizaciones.
    2.  Conversión exitosa de Cotización a Pedido (frontend -> backend).
    3.  Carga de lista de Pedidos.
    4.  Generación de Factura desde Pedido.

## Estado Final
El frontend ahora se comunica correctamente con el backend, mostrando todos los datos en las tablas y permitiendo el flujo completo comercial.
