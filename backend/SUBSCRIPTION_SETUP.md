# Guía de Instalación - Sistema de Suscripciones

## Pasos de Instalación

### 1. Crear las tablas en la base de datos

Ejecuta el script SQL en tu cliente MySQL:

```bash
mysql -u [usuario] -p [contraseña] [base_datos] < src/main/resources/subscription_schema.sql
```

O manualmente en tu gestor MySQL:

```sql
-- Copiar y ejecutar el contenido de: src/main/resources/subscription_schema.sql
```

### 2. Verificar la compilación

Asegúrate de que el proyecto compila correctamente:

```bash
mvn clean compile
```

### 3. Construir el proyecto

```bash
mvn clean package -DskipTests
```

### 4. Ejecutar la aplicación

```bash
java -jar target/starter1-0.0.1-SNAPSHOT.jar
```

O usando Maven:

```bash
mvn spring-boot:run
```

## Estructura de Archivos Creados

```
src/main/java/com/app/starter1/
├── controllers/
│   ├── PlanController.java                    # Endpoints para gestionar planes
│   └── SubscriptionController.java            # Endpoints para gestionar suscripciones
├── persistence/
│   ├── entity/
│   │   ├── Plan.java                         # Entidad Plan
│   │   ├── Subscription.java                 # Entidad Subscription
│   │   └── SubscriptionStatus.java           # Enum de estados
│   └── repository/
│       ├── PlanRepository.java               # Repositorio Plan
│       └── SubscriptionRepository.java       # Repositorio Subscription
├── dto/
│   ├── PlanCreateRequest.java                # DTO para crear plan
│   ├── PlanResponse.java                     # DTO respuesta plan
│   ├── SubscriptionCreateRequest.java        # DTO para suscribirse
│   └── SubscriptionResponse.java             # DTO respuesta suscripción
└── services/
    ├── PlanService.java                      # Lógica de negocio planes
    └── SubscriptionService.java              # Lógica de negocio suscripciones

src/main/resources/
└── subscription_schema.sql                   # Script SQL para crear tablas
```

## Prueba de Endpoints

### 1. Crear un plan
```bash
curl -X POST http://localhost:8080/api/v1/plans \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Plan Test",
    "description": "Plan de prueba",
    "price": 19.99,
    "durationDays": 30
  }'
```

### 2. Obtener planes activos
```bash
curl -X GET http://localhost:8080/api/v1/plans/active
```

### 3. Suscribir usuario a plan
```bash
curl -X POST http://localhost:8080/api/v1/subscriptions/users/1/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "planId": 1,
    "isAutoRenew": false
  }'
```

### 4. Obtener suscripción activa del usuario
```bash
curl -X GET http://localhost:8080/api/v1/subscriptions/users/1/active
```

### 5. Cancelar suscripción
```bash
curl -X PATCH http://localhost:8080/api/v1/subscriptions/1/cancel
```

## Notas Importantes

### Validaciones
- Todos los DTOs tienen validaciones (no nulos, valores positivos, etc.)
- Si enviás datos inválidos, recibirás un error 400 Bad Request

### Transaccionalidad
- Todas las operaciones de base de datos están dentro de transacciones
- Garantiza la consistencia de datos

### Manejo de Errores
Las excepciones se lanzan como `RuntimeException`. Para un manejo más robusto, considera agregar:

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponse> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(e.getMessage()));
    }
}
```

## Próximos Pasos

1. **Implementar Global Exception Handler** para un mejor manejo de errores
2. **Agregar Seguridad** - Solo administradores pueden crear/modificar planes
3. **Integrar Pagos** - Conectar con Stripe o PayPal
4. **Automatizar Renovación** - Crear tareas programadas con `@Scheduled`
5. **Notificaciones** - Enviar emails cuando la suscripción está por expirar
6. **Auditoría** - Registrar cambios en suscripciones

## Configuración de Seguridad Recomendada

Agrega estas anotaciones a los endpoints sensibles en los controladores:

```java
@PostMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<PlanResponse> createPlan(@Valid @RequestBody PlanCreateRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(planService.createPlan(request));
}
```

## Troubleshooting

### Error: "Table 'subscriptions' doesn't exist"
- Ejecuta el script SQL: `src/main/resources/subscription_schema.sql`
- Verifica que hayas ejecutado en la base de datos correcta

### Error: "Foreign key constraint fails"
- Asegúrate de que exista una tabla `users` con la estructura esperada
- Verifica que el `user_id` que estés usando exista en la tabla `users`

### Error de compilación
- Ejecuta: `mvn clean compile`
- Verifica que tengas Java 17 o superior

## Contacto y Soporte

Para preguntas o problemas con la implementación, revisa:
- `SUBSCRIPTION_API.md` - Documentación detallada de endpoints
- Código fuente en los controladores y servicios
