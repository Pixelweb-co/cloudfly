# Validaciones del Sistema POS - OrderService

## ✅ Validaciones Implementadas en `createOrder()`

### Nivel de Orden

#### 1. Validación de TenantId
- **Campo**: `tenantId`
- **Regla**: Obligatorio, no puede ser null
- **Error**: "El tenantId es obligatorio"

#### 2. Validación de Items
- **Campo**: `items`
- **Regla**: La lista debe tener al menos un item
- **Error**: "La orden debe tener al menos un item"

#### 3. Validación de Cliente (CustomerId)
- **Campo**: `customerId` (opcional)
- **Reglas**:
  - Si se proporciona, el cliente debe existir en la BD
  - El cliente debe pertenecer al mismo tenant
- **Errores**:
  - "Cliente no encontrado con id {id}"
  - "El cliente no pertenece al tenant {tenantId}"

#### 4. Validación de Método de Pago
- **Campo**: `paymentMethod`
- **Regla**: Obligatorio, no puede estar vacío
- **Error**: "El método de pago es obligatorio"

#### 5. Validación de Descuento de Orden
- **Campo**: `discount`
- **Regla**: Si se proporciona, debe ser >= 0
- **Error**: "El descuento de la orden no puede ser negativo"

#### 6. Validación de Impuesto
- **Campo**: `tax`
- **Regla**: Si se proporciona, debe ser >= 0
- **Error**: "El impuesto no puede ser negativo"

### Nivel de Items (Por cada producto)

#### 7. Validación de Cantidad
- **Campo**: `quantity`
- **Regla**: Debe ser > 0
- **Error**: "La cantidad debe ser mayor a 0 para el producto {productId}"

#### 8. Validación de Existencia de Producto
- **Campo**: `productId`
- **Regla**: El producto debe existir en la BD
- **Error**: "Producto no encontrado con id {productId}"

#### 9. Validación de Tenant del Producto
- **Campo**: `productId`
- **Regla**: El producto debe pertenecer al tenant de la orden
- **Error**: "El producto {productName} no pertenece al tenant {tenantId}"

#### 10. Validación de Stock
- **Campo**: `quantity` vs `inventoryQty`
- **Regla**: Debe haber suficiente stock disponible
- **Error**: "Stock insuficiente para el producto: {productName} (disponible: {inventoryQty})"

#### 11. Validación de Descuento del Item
- **Campo**: `discount`
- **Reglas**:
  - No puede ser negativo
  - No puede exceder el precio total del item (precio × cantidad)
- **Errores**:
  - "El descuento no puede ser negativo para el producto {productName}"
  - "El descuento no puede ser mayor al precio total del producto {productName}"

## 📋 Flujo de Validación

```
1. Validar TenantId
2. Validar que hay Items
3. Validar CustomerId (si existe)
4. Validar Método de Pago
5. Para cada Item:
   a. Validar Cantidad
   b. Validar que el Producto existe
   c. Validar que el Producto pertenece al Tenant
   d. Validar Stock disponible
   e. Validar Descuento del Item
6. Validar Descuento de la Orden
7. Validar Impuesto
8. ✅ Crear la Orden
9. Procesar Items y reducir Stock
10. Calcular Total
11. Guardar en BD
```

## 🔒 Seguridad Multi-Tenant

El sistema garantiza que:
- Los productos pertenecen al tenant correcto
- Los clientes pertenecen al tenant correcto
- No se pueden mezclar datos de diferentes tenants en una orden

## 🧪 Ejemplos de Requests

### Request Válido
```json
{
  "tenantId": 1,
  "customerId": 5,
  "items": [
    {
      "productId": 10,
      "quantity": 2,
      "discount": 5.00
    }
  ],
  "paymentMethod": "CASH",
  "tax": 1.50,
  "discount": 2.00
}
```

### Errores Comunes

#### Error: TenantId Faltante
```json
{
  "customerId": 5,
  "items": [...]
}
```
**Respuesta**: `400 Bad Request - "El tenantId es obligatorio"`

#### Error: Cliente de Otro Tenant
```json
{
  "tenantId": 1,
  "customerId": 999,  // Cliente del tenant 2
  "items": [...]
}
```
**Respuesta**: `400 Bad Request - "El cliente no pertenece al tenant 1"`

#### Error: Stock Insuficiente
```json
{
  "tenantId": 1,
  "items": [
    {
      "productId": 10,
      "quantity": 100  // Solo hay 5 en stock
    }
  ]
}
```
**Respuesta**: `400 Bad Request - "Stock insuficiente para el producto: Laptop HP (disponible: 5)"`

#### Error: Cantidad Negativa
```json
{
  "tenantId": 1,
  "items": [
    {
      "productId": 10,
      "quantity": -2
    }
  ]
}
```
**Respuesta**: `400 Bad Request - "La cantidad debe ser mayor a 0 para el producto 10"`

#### Error: Descuento Excesivo
```json
{
  "tenantId": 1,
  "items": [
    {
      "productId": 10,    // Precio: $100
      "quantity": 1,
      "discount": 150.00  // Mayor al total
    }
  ]
}
```
**Respuesta**: `400 Bad Request - "El descuento no puede ser mayor al precio total del producto Laptop HP"`

## 🎯 Próximos Pasos

Para probar las validaciones:

1. **Usar Postman/Insomnia** con el archivo `pos-contacts-orders-tests.http`
2. **Probar desde el Frontend** en `http://localhost:3000`
3. **Verificar en la BD** que las órdenes se crean correctamente

## 📊 Estadísticas de Validación

- **Total de validaciones**: 11
- **Validaciones a nivel de orden**: 6
- **Validaciones por item**: 5
- **Validaciones de seguridad multi-tenant**: 2

---

**Estado**: ✅ Todas las validaciones implementadas
**Última actualización**: 2025-01-30
