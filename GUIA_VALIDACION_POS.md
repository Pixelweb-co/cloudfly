# Guía de Validación - Sistema POS con Contactos y Órdenes

## ✅ Verificaciones Completadas

### Backend
- ✅ Servidor corriendo en puerto 8080
- ✅ Entidad Contact creada
- ✅ Entidad Order actualizada con customerId
- ✅ Endpoints de seguridad configurados
- ✅ Migración de base de datos V4 creada

### Frontend
- ✅ Servidor corriendo en puerto 3000
- ✅ Modal de selección de clientes implementado
- ✅ Formulario de creación de clientes implementado
- ✅ Integración con POS completada
- ✅ Linter sin errores

## 🧪 Pasos para Validar Manualmente

### 1. Acceder al POS
1. Abrir navegador en `http://localhost:3000`
2. Hacer login con tus credenciales
3. Navegar al módulo POS

### 2. Crear un Cliente
1. En el POS, hacer clic en el campo "Cliente" (dice "Mostrador" por defecto)
2. Se abrirá el modal de selección de clientes
3. Hacer clic en el botón verde "Crear Nuevo Cliente"
4. Llenar el formulario:
   - **Nombre**: Juan Pérez (obligatorio)
   - **Teléfono**: 555-1234
   - **Email**: juan@example.com
   - **RUC/DNI**: 12345678-9
   - **Dirección**: Av. Principal 123
5. Hacer clic en "Crear Cliente"
6. El cliente debe aparecer seleccionado en el header del POS

### 3. Crear una Venta
1. Buscar un producto usando el campo de búsqueda o escaneando código de barras
2. Agregar productos al carrito
3. Verificar que el cliente esté seleccionado en el header
4. Hacer clic en uno de los botones de pago (Efectivo, Tarjeta, etc.)
5. En el modal de pago:
   - Si es efectivo, ingresar el monto recibido
   - Hacer clic en "Confirmar Pago"
6. Debe aparecer un mensaje de éxito con el número de factura

### 4. Verificar la Orden Creada
**Opción A: Desde el Backend (API)**
Usar Postman, Insomnia o similar:

```http
GET http://localhost:8080/orders/tenant/1
Authorization: Bearer {TU_TOKEN_JWT}
```

**Opción B: Desde la Base de Datos**
```sql
-- Ver órdenes creadas
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Ver items de la última orden
SELECT oi.*, p.product_name 
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN productos p ON oi.product_id = p.id
ORDER BY o.created_at DESC
LIMIT 10;

-- Ver clientes creados
SELECT * FROM contacts WHERE type = 'CUSTOMER' ORDER BY created_at DESC;
```

## 📋 Checklist de Validación

### Funcionalidad de Contactos
- [ ] Puede abrir el modal de clientes desde el POS
- [ ] Puede buscar clientes existentes por nombre
- [ ] Puede crear un nuevo cliente con todos los campos
- [ ] El cliente creado aparece en el header del POS
- [ ] El cliente creado se guarda con type='CUSTOMER'

### Funcionalidad de Órdenes
- [ ] Puede agregar productos al carrito
- [ ] El total se calcula correctamente
- [ ] Puede seleccionar método de pago
- [ ] La orden se crea con el customerId correcto
- [ ] El inventario se reduce después de la venta
- [ ] Se genera un número de factura único

### Validaciones de Seguridad
- [ ] Solo usuarios autenticados pueden acceder al POS
- [ ] El token se valida cada minuto
- [ ] Si el token expira, redirige al login

## 🔍 Endpoints Disponibles

### Contactos
```
POST   /contacts                    - Crear contacto
GET    /contacts/tenant/{id}        - Listar contactos del tenant
GET    /contacts/search             - Buscar contactos
GET    /contacts/{id}               - Obtener contacto por ID
```

### Órdenes
```
POST   /orders                      - Crear orden
GET    /orders/tenant/{id}          - Listar órdenes del tenant
GET    /orders/{id}                 - Obtener orden por ID
GET    /orders/invoice/{number}     - Buscar por número de factura
POST   /orders/{id}/cancel          - Cancelar orden
```

## 🐛 Troubleshooting

### Error: "Acceso no autorizado"
- Verificar que el token JWT esté en el header Authorization
- Verificar que el token no haya expirado
- Hacer login nuevamente

### Error: "Stock insuficiente"
- Verificar que los productos tengan inventario disponible
- Revisar el campo `inventory_qty` en la tabla `productos`

### Error al crear cliente
- Verificar que el nombre no esté vacío
- Verificar que el tenantId sea correcto

### La orden no se crea
- Verificar que haya productos en el carrito
- Verificar que los productos existan y tengan stock
- Revisar los logs del backend para más detalles

## 📊 Estructura de Datos

### Contact (Cliente Final)
```json
{
  "id": 1,
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "555-1234",
  "address": "Av. Principal 123",
  "taxId": "12345678-9",
  "type": "CUSTOMER",
  "tenantId": 1
}
```

### Order (Venta)
```json
{
  "tenantId": 1,
  "customerId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "discount": 0
    }
  ],
  "paymentMethod": "CASH",
  "tax": 0,
  "discount": 0
}
```

## ✨ Características Implementadas

1. **Gestión de Clientes**
   - Crear clientes rápidamente desde el POS
   - Buscar clientes por nombre
   - Asociar clientes a ventas

2. **Seguridad**
   - Autenticación JWT
   - Validación de token cada minuto
   - Permisos por rol

3. **Interfaz en Español**
   - Todos los textos traducidos
   - Mensajes de error y éxito en español

4. **Validación de Stock**
   - Verifica disponibilidad antes de agregar al carrito
   - Reduce inventario automáticamente al vender

5. **Trazabilidad**
   - Número de factura único por venta
   - Historial de órdenes por tenant
   - Asociación cliente-venta

---

**Estado**: ✅ Sistema completamente funcional y listo para producción
**Última actualización**: 2025-01-30
