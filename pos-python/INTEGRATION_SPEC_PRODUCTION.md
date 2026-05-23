# 📋 Documento de SDD - Plan de Integración con api.cloudfly.com.co (Producción)

Este documento de **Spec-Driven Development (SDD)** define las especificaciones técnicas para migrar el entorno de la aplicación de escritorio **CloudFly Point of Sale (POS) Python** desde el servidor de desarrollo local al entorno de producción oficial alojado en `https://api.cloudfly.com.co` (gestionado por el servicio reactivo Spring Boot `backend_new`).

---

## 1. 🎯 Objetivos de la Integración

1.  **Configurabilidad Total del Servidor:** Reemplazar el URL base codificado (`http://localhost:8080`) por un sistema de resolución dinámica de base URL (orden de prioridad: archivo de configuración local `config.json` -> Variable de entorno `CLOUDFLY_API_URL` -> Valor por defecto de producción `https://api.cloudfly.com.co`).
2.  **Mapeo de Rutas de Producción:** Alinear las llamadas REST con los endpoints correctos expuestos por el nuevo backend reactivo `backend_new`.
3.  **Seguridad y Robustez en HTTPS:** Asegurar la negociación SSL/TLS correcta y configurar timeouts preventivos en todas las solicitudes HTTP para evitar congelamientos en la UI del POS.
4.  **Preservación de la Resiliencia Offline-First:** Garantizar que la aplicación siga permitiendo ventas locales fluidas en SQLite aun si el servidor de producción tiene intermitencias o latencias altas.

---

## 2. 🔌 Arquitectura de Endpoints y Mapeo API

El backend `backend_new` expone la API en los siguientes sub-directorios. A continuación, el mapeo detallado entre las llamadas de la app POS y el servidor:

| Propósito | Ruta POS Local (Desarrollo) | Nueva Ruta Producción (`backend_new`) | Método HTTP | Detalles de Payload / Cabeceras |
| :--- | :--- | :--- | :--- | :--- |
| **Autenticación (JWT)** | `/auth/login` | `/auth/login` | `POST` | Cuerpo JSON: `{"username": "...", "password": "..."}`. Retorna token JWT en el campo `"jwt"`. |
| **Descarga de Catálogo** | `/productos/tenant/{id}` | `/api/v1/products/tenant/{id}` | `GET` | Cabecera: `Authorization: Bearer <token>`. Retorna lista de productos del tenant. |
| **Descarga de Clientes** | `/contacts/tenant/{id}` | `/api/v1/contacts` | `GET` | Cabecera: `Authorization: Bearer <token>`. Filtra automáticamente por tenant asociado en el token. |
| **Sincronización de Órdenes** | `/orders` | `/orders` | `POST` | Cabecera: `Authorization: Bearer <token>`. Cuerpo JSON estructurado con `tenantId`, `customerId`, `items`, `tax`, `discount`. |

---

## 3. ⚙️ Mecanismo de Configuración Dinámica (`config.json`)

Para evitar tener que modificar el código fuente si se desea alternar entre el servidor local y el de producción, se implementa una carga de configuración con el archivo `config.json` ubicado en el directorio principal de la aplicación:

### Ejemplo de `config.json` para Producción (Valor por defecto si no existe):
```json
{
  "api_url": "https://api.cloudfly.com.co",
  "tenant_id": 1
}
```

### Algoritmo de Carga en `api_client.py`:
1.  Comprueba la presencia de `pos-python/config.json`.
2.  Si existe, carga `api_url` y `tenant_id`.
3.  Si no existe o falla su lectura, consulta la variable de entorno `CLOUDFLY_API_URL`.
4.  Como último recurso (default), establece `https://api.cloudfly.com.co` y `tenant_id = 1`.

---

## 4. 🔒 Seguridad y Robustez de Red (SSL/TLS & Timeouts)

La integración con un entorno público exige altos estándares de tolerancia a fallos:
*   **SSL/TLS Activo:** Se utilizarán peticiones seguras sobre HTTPS. Se valida el certificado de `api.cloudfly.com.co` de forma nativa mediante la suite `requests` usando el almacén de CA del sistema.
*   **Timeouts Estrictos:** Ninguna petición HTTP podrá quedarse colgada indefinidamente esperando respuesta del servidor. Se definen timeouts específicos:
    *   *Ping/Health Check:* `3` segundos.
    *   *Login y Sincronización de Órdenes:* `5` segundos.
    *   *Descarga de Catálogos:* `5` segundos.
*   **Manejo Elegante de Excepciones:** Ante errores de red (`requests.exceptions.ConnectionError`, `requests.exceptions.Timeout`, etc.), el cliente de la API retornará el error en formato de texto amigable en lugar de arrojar una traza de pila, permitiendo al hilo `SyncService` marcar la app como **OFFLINE** de manera inmediata sin afectar el flujo del cajero.

---

## 🧪 Plan de Verificación de Integración

### 1. Pruebas Unitarias Automatizadas
*   Actualizar `tests/test_sync.py` para asegurar que las pruebas de mock utilicen los nuevos endpoints de producción `/api/v1/products/tenant/...` y `/api/v1/contacts`.
*   Ejecutar `python -m unittest discover tests/` y corroborar que todas las pruebas pasen con 100% de éxito.

### 2. Pruebas Manuales E2E (End-to-End)
*   Arrancar el POS de escritorio apuntando al host de producción.
*   Autenticar con un usuario de prueba en `api.cloudfly.com.co` y verificar que el token JWT sea almacenado localmente en `token.txt`.
*   Descargar el catálogo de productos y clientes en producción y validar que se visualicen correctamente en la grilla Tkinter.
*   Simular una desconexión apagando el internet o alterando temporalmente `config.json` a una URL inválida. Realizar una venta en el POS y confirmar que se guarda localmente en SQLite con estado pendiente (`is_synced = 0`).
*   Restaurar la conexión, forzar la sincronización manual (o esperar al hilo en segundo plano) y confirmar que la orden se sube a `https://api.cloudfly.com.co/orders` exitosamente, cambiando su estado local a `is_synced = 1`.
