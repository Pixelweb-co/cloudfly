# 🎯 DEMO: PROCESO CONTABLE DE UNA VENTA

**Fecha:** 2025-12-11  
**Objetivo:** Demostrar flujo completo desde venta hasta visualización en reportes contables

---

## 🔐 PASO 1: AUTENTICACIÓN

### **Método A: cURL**
```bash
# Login para obtener token JWT
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cloudfly.com",
    "password": "admin123"
  }'

# Respuesta esperada:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@cloudfly.com",
    "roles": ["ADMIN"]
  }
}

# Guardar el token en variable
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **Método B: PowerShell**
```powershell
# Login
$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@cloudfly.com","password":"admin123"}'

# Guardar token
$token = $response.token
echo "Token obtenido: $token"
```

---

## 💰 PASO 2: CREAR UNA VENTA

### **Escenario:**
- Cliente: Juan Pérez (NIT: 900123456-7)
- Producto: Laptop Dell (código: LAPTOP001)
- Cantidad: 1
- Precio: $2,500,000
- IVA 19%: $475,000
- **Total: $2,975,000**

### **cURL - Crear Factura:**
```bash
curl -X POST http://localhost:8080/api/ventas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 123,
    "customerName": "Juan Pérez",
    "customerNit": "900123456-7",
    "date": "2025-12-11",
    "items": [
      {
        "productId": 45,
        "productCode": "LAPTOP001",
        "productName": "Laptop Dell Inspiron",
        "quantity": 1,
        "unitPrice": 2500000,
        "subtotal": 2500000,
        "taxRate": 19,
        "taxAmount": 475000,
        "total": 2975000
      }
    ],
    "subtotal": 2500000,
    "taxAmount": 475000,
    "total": 2975000,
    "paymentMethod": "CASH"
  }'

# Respuesta:
{
  "id": 1001,
  "invoiceNumber": "FV-00001001",
  "date": "2025-12-11",
  "total": 2975000,
  "status": "PAID",
  "accountingVoucherId": 2001  // ← ID del comprobante contable generado
}
```

---

## 📊 PASO 3: CONTABILIZACIÓN AUTOMÁTICA

### **Lo que sucede internamente:**

Cuando se crea la venta, el sistema **automáticamente** genera un comprobante contable:

```java
// VentaContableService.contabilizarVenta()

Comprobante INGRESO #2001
Fecha: 2025-12-11
Descripción: "Venta FV-00001001 - Juan Pérez"

DÉBITO:  1305 Clientes                   $2,975,000
CRÉDITO: 4135 Ventas                     $2,500,000
CRÉDITO: 2408 IVA por Pagar              $  475,000
                                         ----------
         TOTAL                           $2,975,000

// Si el producto maneja inventario:
DÉBITO:  6135 Costo de Ventas            $1,800,000
CRÉDITO: 1435 Mercancías (Inventario)    $1,800,000
```

---

## 🔍 PASO 4: VERIFICAR COMPROBANTE GENERADO

### **Consultar el comprobante:**
```bash
curl -X GET "http://localhost:8080/api/accounting/vouchers/2001" \
  -H "Authorization: Bearer $TOKEN"

# Respuesta:
{
  "id": 2001,
  "voucherType": "INGRESO",
  "voucherNumber": "ING-00002001",
  "date": "2025-12-11",
  "description": "Venta FV-00001001 - Juan Pérez",
  "status": "POSTED",
  "totalDebit": 2975000,
  "totalCredit": 2975000,
  "entries": [
    {
      "accountCode": "1305",
      "accountName": "Clientes",
      "debitAmount": 2975000,
      "creditAmount": 0,
      "thirdPartyName": "Juan Pérez"
    },
    {
      "accountCode": "4135",
      "accountName": "Ventas",
      "debitAmount": 0,
      "creditAmount": 2500000
    },
    {
      "accountCode": "2408",
      "accountName": "IVA por Pagar",
      "debitAmount": 0,
      "creditAmount": 475000
    }
  ],
  "isBalanced": true
}
```

---

## 📖 PASO 5: VER EN LIBRO DIARIO

### **Consultar Libro Diario del día:**
```bash
curl -X GET "http://localhost:8080/api/accounting/reports/libro-diario?fromDate=2025-12-11&toDate=2025-12-11" \
  -H "Authorization: Bearer $TOKEN"

# Respuesta:
{
  "fromDate": "2025-12-11",
  "toDate": "2025-12-11",
  "totalDebit": 2975000,
  "totalCredit": 2975000,
  "totalEntries": 3,
  "entries": [
    {
      "date": "2025-12-11",
      "voucherType": "INGRESO",
      "voucherNumber": "ING-00002001",
      "accountCode": "1305",
      "accountName": "Clientes",
      "description": "Venta FV-00001001 - Juan Pérez",
      "thirdPartyName": "Juan Pérez",
      "debitAmount": 2975000,
      "creditAmount": 0
    },
    {
      "date": "2025-12-11",
      "voucherType": "INGRESO",
      "voucherNumber": "ING-00002001",
      "accountCode": "4135",
      "accountName": "Ventas",
      "description": "Venta FV-00001001 - Juan Pérez",
      "debitAmount": 0,
      "creditAmount": 2500000
    },
    {
      "date": "2025-12-11",
      "voucherType": "INGRESO",
      "voucherNumber": "ING-00002001",
      "accountCode": "2408",
      "accountName": "IVA por Pagar",
      "description": "Venta FV-00001001 - Juan Pérez",
      "debitAmount": 0,
      "creditAmount": 475000
    }
  ]
}
```

---

## 📊 PASO 6: VER EN LIBRO MAYOR (Cuenta Ventas)

### **Consultar Libro Mayor de Ventas:**
```bash
curl -X GET "http://localhost:8080/api/accounting/reports/libro-mayor?accountCode=4135&fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"

# Respuesta:
{
  "accountCode": "4135",
  "accountName": "Ventas",
  "nature": "CREDITO",
  "fromDate": "2025-12-01",
  "toDate": "2025-12-31",
  "initialBalance": 15000000,  // Ventas acumuladas del mes
  "finalBalance": 17500000,     // + 2,500,000 de esta venta
  "totalDebit": 0,
  "totalCredit": 2500000,
  "totalEntries": 1,
  "entries": [
    {
      "date": "2025-12-11",
      "voucherNumber": "ING-00002001",
      "description": "Venta FV-00001001 - Juan Pérez",
      "debitAmount": 0,
      "creditAmount": 2500000,
      "balance": 17500000  // Saldo acumulado
    }
  ]
}
```

---

## 💰 PASO 7: VER EN ESTADO DE RESULTADOS

### **Consultar Estado de Resultados del mes:**
```bash
curl -X GET "http://localhost:8080/api/accounting/reports/estado-resultados?fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN"

# Respuesta:
{
  "fromDate": "2025-12-01",
  "toDate": "2025-12-31",
  "ingresosOperacionales": 17500000,    // ← Incluye nuestra venta
  "ingresosNoOperacionales": 0,
  "totalIngresos": 17500000,
  "costoVentas": 10500000,
  "utilidadBruta": 7000000,
  "gastosOperacionales": 3500000,
  "gastosNoOperacionales": 0,
  "totalGastos": 3500000,
  "utilidadNeta": 3500000               // ← Utilidad final
}
```

---

## 💼 PASO 8: VER EN BALANCE GENERAL

### **Consultar Balance General:**
```bash
curl -X GET "http://localhost:8080/api/accounting/reports/balance-general?asOfDate=2025-12-11" \
  -H "Authorization: Bearer $TOKEN"

# Respuesta (extracto):
{
  "asOfDate": "2025-12-11",
  "activosCorrientes": {
    "accounts": [
      {
        "code": "1105",
        "name": "Caja",
        "balance": 5000000
      },
      {
        "code": "1305",
        "name": "Clientes",
        "balance": 8975000  // ← +2,975,000 de nuestra venta
      },
      {
        "code": "1435",
        "name": "Mercancías",
        "balance": 12000000
      }
    ],
    "total": 25975000
  },
  "pasivosCorrientes": {
    "accounts": [
      {
        "code": "2408",
        "name": "IVA por Pagar",
        "balance": 1475000  // ← +475,000 de IVA de esta venta
      }
    ],
    "total": 1475000
  },
  "totalActivos": 45975000,
  "totalPasivos": 8475000,
  "totalPatrimonio": 37500000
}
```

---

## 🎯 RESUMEN DEL FLUJO COMPLETO

```
1. VENTA
   ↓
2. AUTO-CONTABILIZACIÓN (Comprobante INGRESO)
   ↓
3. LIBRO DIARIO (Registros cronológicos)
   ↓
4. LIBRO MAYOR (Movimientos por cuenta)
   ↓
5. ESTADO DE RESULTADOS (Utilidad/Pérdida)
   ↓
6. BALANCE GENERAL (Situación financiera)
```

---

## 🔄 SCRIPT COMPLETO DE PRUEBA

```bash
#!/bin/bash

echo "=== DEMO PROCESO CONTABLE DE VENTA ==="

# 1. Login
echo "\n1. Obteniendo token..."
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cloudfly.com","password":"admin123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Crear Venta
echo "\n2. Creando venta..."
VENTA=$(curl -s -X POST http://localhost:8080/api/ventas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": 123,
    "items": [{"productId": 45, "quantity": 1, "unitPrice": 2500000}],
    "total": 2975000
  }')

echo "Venta creada: $(echo $VENTA | jq '.invoiceNumber')"
VOUCHER_ID=$(echo $VENTA | jq '.accountingVoucherId')

# 3. Ver Comprobante
echo "\n3. Consultando comprobante contable..."
curl -s -X GET "http://localhost:8080/api/accounting/vouchers/$VOUCHER_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Ver Libro Diario
echo "\n4. Consultando Libro Diario..."
curl -s -X GET "http://localhost:8080/api/accounting/reports/libro-diario?fromDate=2025-12-11&toDate=2025-12-11" \
  -H "Authorization: Bearer $TOKEN" | jq '.totalEntries, .totalDebit, .totalCredit'

# 5. Ver Estado de Resultados
echo "\n5. Consultando Estado de Resultados..."
curl -s -X GET "http://localhost:8080/api/accounting/reports/estado-resultados?fromDate=2025-12-01&toDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" | jq '.totalIngresos, .utilidadNeta'

echo "\n=== DEMO COMPLETADO ==="
```

---

## 📋 REQUISITOS PREVIOS

1. **Backend corriendo:** `http://localhost:8080`
2. **Usuario de prueba:** `admin@cloudfly.com` / `admin123`
3. **Datos iniciales:**
   - Cliente ID 123
   - Producto ID 45
   - Cuentas PUC cargadas

---

## 🎬 ALTERNATIVA: DEMO EN FRONTEND

Si prefieres ver el proceso visualmente:

1. Login en `/login`
2. Ir a POS → Crear venta
3. Al finalizar venta, ir a:
   - `/contabilidad/libro-diario` → Ver movimiento
   - `/contabilidad/libro-mayor` → Ver cuenta 4135 (Ventas)
   - `/contabilidad/estado-resultados` → Ver utilidad
   - `/contabilidad/balance-general` → Ver situación financiera

---

**¿Quieres que ejecute alguno de estos comandos para hacer el demo real?** 🚀
