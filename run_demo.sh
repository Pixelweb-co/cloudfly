#!/bin/bash

# 1. Insertar Cuentas PUC (si no existen)
echo "Inserting Chart of Accounts..."
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "
INSERT IGNORE INTO chart_of_accounts (code, name, account_type, level, nature, is_active, is_system) VALUES
('1105', 'Caja', 'ACTIVO', 4, 'DEBITO', 1, 0),
('1305', 'Clientes', 'ACTIVO', 4, 'DEBITO', 1, 0),
('1435', 'Mercancías', 'ACTIVO', 4, 'DEBITO', 1, 0),
('2408', 'IVA por Pagar', 'PASIVO', 4, 'CREDITO', 1, 0),
('4135', 'Ventas', 'INGRESO', 4, 'CREDITO', 1, 0),
('6135', 'Costo de Ventas', 'COSTO', 4, 'DEBITO', 1, 0);"

# 2. Login
echo "Logging in..."
LOGIN_RES=$(curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"edwing2022","password":"Edwin2025*"}')

TOKEN=$(echo $LOGIN_RES | grep -o '"jwt":"[^"]*' | cut -d'"' -f4)
TENANT_ID=1

echo "Token: $TOKEN"

# 3. Crear Factura
echo "Creating Invoice..."
INVOICE_RES=$(curl -s -X POST http://localhost:8080/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": 1,
    "customerId": 1,
    "issueDate": "2025-12-11T12:00:00",
    "status": "PAID",
    "invoiceNumber": "FV-DEMO-001",
    "items": [
      {
        "productId": 1,
        "quantity": 1,
        "unitPrice": 100000,
        "tax": 19000,
        "total": 119000
      }
    ],
    "subtotal": 100000,
    "tax": 19000,
    "total": 119000
  }')

echo "Invoice Response: $INVOICE_RES"

# 4. Verificar Reportes
echo "Checking Libro Diario..."
curl -s -X GET "http://localhost:8080/api/accounting/reports/libro-diario?fromDate=2025-12-11&toDate=2025-12-11&tenantId=1" \
  -H "Authorization: Bearer $TOKEN"

echo "\nChecking Balance General..."
curl -s -X GET "http://localhost:8080/api/accounting/reports/balance-general?asOfDate=2025-12-11&tenantId=1" \
  -H "Authorization: Bearer $TOKEN"

echo "\nChecking Estado Resultados..."
curl -s -X GET "http://localhost:8080/api/accounting/reports/estado-resultados?fromDate=2025-01-01&toDate=2025-12-31&tenantId=1" \
  -H "Authorization: Bearer $TOKEN"
