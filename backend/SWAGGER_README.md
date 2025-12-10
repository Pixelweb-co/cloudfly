# Swagger UI - Documentación API CloudFly

## 📚 Acceso a la Documentación

Una vez que la aplicación esté ejecutándose, puedes acceder a Swagger UI en:

### Desarrollo Local:
```
http://localhost:8080/swagger-ui.html
```

### Producción:
```
https://api.cloudfly.com.co/swagger-ui.html  
```

## 🔑 Autenticación JWT

La mayoría de los endpoints requieren autenticación con JWT. Para probar los endpoints protegidos:

1. **Obtener Token JWT:**
   - Ve al endpoint `POST /auth/log-in`
   - Ingresa las credenciales:
     ```json
     {
       "username": "tu_usuario",
       "password": "tu_contraseña"
     }
     ```
   - Copia el token JWT de la respuesta (campo `jwt`)

2. **Autorizar en Swagger:**
   - Haz clic en el botón **"Authorize"** (🔒) en la parte superior derecha
   - Ingresa: `Bearer TU_TOKEN_JWT`
   - Haz clic en **"Authorize"**
   - Cierra el modal

3. **Probar Endpoints:**
   - Ahora todos los requests incluirán automáticamente el header de autorización
   - Puedes probar cualquier endpoint haciendo clic en "Try it out"

## 📖 Documentación JSON

La especificación OpenAPI 3.0 en formato JSON está disponible en:

```
http://localhost:8080/v3/api-docs
```

## 🏷️ Grupos de Endpoints

Los endpoints están organizados por funcionalidad:

- **Auth** - Autenticación y autorización
- **Users** - Gestión de usuarios
- **Customers** - Gestión de clientes
- **Products** - Gestión de productos/inventario  
- **Orders** - Ventas y órdenes del POS
- **Quotes** - Cotizaciones
- **Invoices** - Facturas
- **Chatbot** - Configuración de chatbots con IA
- **Chat** - Conversaciones y mensajes
- **Dashboard** - Métricas y estadísticas
- **Media** - Gestión de archivos y medios

## ⚙️ Configuración

La configuración de Swagger se encuentra en:

- **`SwaggerConfig.java`** - Configuración programática de OpenAPI
- **`SecurityConfig.java`** - Rutas públicas de Swagger (no requieren auth)
- **`swagger.properties`** - Propiedades de personalización

## 🎨 Personalización

Para cambiar la información de la API, edita `SwaggerConfig.java`:

```java
@Bean
public OpenAPI cloudFlyOpenAPI() {
    return new OpenAPI()
            .info(new Info()
                    .title("CloudFly Marketing AI Pro API")
                    .description("API REST para CloudFly...")
                    .version("v1.0.0")
                    // ... más configuración
            );
}
```

## 📝 Documenting Endpoints

Para documentar mejor tus endpoints, usa anotaciones de OpenAPI:

```java
@Operation(summary = "Obtener todos los productos", 
          description = "Devuelve la lista completa de productos del inventario")
@ApiResponses(value = {
    @ApiResponse(responseCode = "200", description = "Lista de productos"),
    @ApiResponse(responseCode = "401", description = "No autorizado"),
    @ApiResponse(responseCode = "403", description = "Sin permisos")
})
@GetMapping("/productos")
public ResponseEntity<List<Product>> getProducts() {
    // ...
}
```

## 🚀 Ventajas de Swagger UI

- ✅ **Documentación automática** de todos los endpoints
- ✅ **Testing interactivo** directo desde el navegador
- ✅ **Validación de esquemas** JSON
- ✅ **Generación de código cliente** en múltiples lenguajes
- ✅ **Especificación estándar** OpenAPI 3.0
- ✅ **Integración con JWT** Bearer Token

## 📚 Recursos Adicionales

- [Springdoc OpenAPI](https://springdoc.org/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)

---

**CloudFly Marketing AI Pro** © 2025
