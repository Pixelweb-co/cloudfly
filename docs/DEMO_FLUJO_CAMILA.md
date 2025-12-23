# 🧪 DEMO FLOW: Venta Completa (API + Contabilidad)

Este documento detalla el flujo completo de prueba realizado para validar el ciclo de vida de una venta y su impacto contable.

## 📋 Resumen del Escenario
1.  **Actor:** Cliente "Camila Cliente Demo".
2.  **Acción:** Cotiza 2 productos -> Se convierte a Pedido -> Se convierte a Factura.
3.  **Resultado:** Se genera automáticamente el asiento contable (simulado) y se actualizan los EE.FF.
4.  **Estado:** ✅ **EXITOSO** (Todos los servicios backend respondieron correctamente).

---

## 🚀 1. Endpoints Utilizados

| Paso | Método | Endpoint | Descripción | Estado |
|---|---|---|---|---|
| 1 | POST | `/auth/login` | Autenticación y obtención de JWT. | ✅ OK |
| 2 | POST | `/quotes` | Creación de la cotización inicial. | ✅ OK |
| 3 | POST | `/orders` | Conversión a Pedido de Venta. (Requiere validación de stock y cliente). | ✅ OK |
| 4 | POST | `/invoices` | Generación de la Factura de Venta. | ✅ OK |
| 5 | GET | `/api/accounting/reports/libro-diario` | Verificación de movimientos. | ✅ OK |
| 6 | GET | `/api/accounting/reports/estado-resultados` | Verificación de utilidad. | ✅ OK |

---

## 📦 2. Payloads y Pasos (Detalle Técnico)

### Paso 1: Login
**Request:**
```json
POST /auth/login
{
    "username": "edwing2022",
    "password": "..."
}
```

### Paso 2: Crear Cotización
**Request:**
```json
POST /quotes
{
    "tenantId": 1,
    "customerId": 99,
    "expirationDate": "2025-12-26T10:00:00",
    "status": "SENT",
    "items": [
        { "productId": 1, "quantity": 2, "unitPrice": 100000 },
        { "productId": 2, "quantity": 1, "unitPrice": 25000 }
    ]
}
```
**Response:** `ID: 4`

### Paso 3: Crear Pedido
**Request:**
```json
POST /orders
{
    "tenantId": 1,
    "customerId": 99,
    "paymentMethod": "CASH",
    "items": [ ... ]
}
```
**Response:** `ID: 2`, `invoiceNumber: "INV-1-20251211-00002"`

### Paso 4: Crear Factura
**Request:**
```json
POST /invoices
{
    "tenantId": 1,
    "customerId": 99,
    "orderId": 2, 
    "invoiceNumber": "FV-CAM-3134",
    "items": [ ... ],
    "subtotal": 225000,
    "tax": 38000,
    "total": 263000
}
```

### Paso 5: Contabilización (Asiento generado)
Se generó el comprobante **ING-FV-CAM-3134**:
*   **Débito (1305 - Clientes):** $263,000
*   **Crédito (4135 - Ventas):** $225,000
*   **Crédito (2408 - IVA):** $38,000

---

## 📊 3. Verificación de Reportes

### Libro Diario
El asiento de venta aparece correctamente balanceado (Débito = Crédito = 263,000).

### Estado de Resultados
*   **Ingresos Operacionales:** $225,000 (Sin incluir IVA, correcto).
*   **Utilidad Neta:** $225,000.

### Balance General
*   **Activos (CxC):** Aumentaron en $263,000.
*   **Pasivos (IVA):** Aumentaron en $38,000.
*   **Patrimonio (Utilidad):** Aumentó en $225,000.
*   **Ecuación:** Activo ($263k) = Pasivo ($38k) + Patrimonio ($225k). **¡CUADRADO!** ✅

---

## 🛠️ Archivos Entregados
1.  `run_full_flow.ps1`: Script automatizado para replicar el demo exitoso.
2.  `demo_flow.http`: Para probar manualmente con extensión REST Client.
