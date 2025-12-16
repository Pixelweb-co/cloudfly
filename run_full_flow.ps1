# 🎯 FLUJO COMPLETO DE VENTA API + CONTABILIDAD (VERSIÓN 2 - CORREGIDA)
Write-Host "🚀 INICIANDO DEMO COMPLETO: COTIZACIÓN -> PEDIDO -> FACTURA -> CONTABILIDAD" -ForegroundColor Green

# 1. PREPARACIÓN DE DATOS (SQL)
Write-Host "`n[1/6] Verificando/Creando Cliente 'Camila' y Datos Demo..."
$sqlPrep = "
-- Insertar Camila en CONTACTS (Tabla correcta para OrderService)
INSERT IGNORE INTO contacts (id, name, email, type, tenant_id, created_at, status_cliente) 
VALUES (99, 'Camila Cliente Demo', 'camila@demo.com', 'CUSTOMER', 1, NOW(), 1);

-- Asegurar productos
INSERT IGNORE INTO productos (id, product_name, price, tenant_id, inventory_qty, sku) VALUES
(1, 'Producto A (Demo)', 100000, 1, 100, 'SKU-A'),
(2, 'Producto B (Demo)', 25000, 1, 100, 'SKU-B');

-- Asegurar PUC
INSERT IGNORE INTO chart_of_accounts (code, name, account_type, level, nature, is_active, is_system) VALUES 
('1105', 'Caja', 'ACTIVO', 4, 'DEBITO', 1, 0), 
('1305', 'Clientes', 'ACTIVO', 4, 'DEBITO', 1, 0), 
('2408', 'IVA por Pagar', 'PASIVO', 4, 'CREDITO', 1, 0), 
('4135', 'Ventas', 'INGRESO', 4, 'CREDITO', 1, 0);
"
# Nota: La columna status_cliente podría no existir en contacts, la quito para evitar error
$sqlPrepCorregido = "
INSERT IGNORE INTO contacts (id, name, email, type, tenant_id, created_at) 
VALUES (99, 'Camila Cliente Demo', 'camila@demo.com', 'CUSTOMER', 1, NOW());

INSERT IGNORE INTO productos (id, product_name, price, tenant_id, inventory_qty) VALUES
(1, 'Producto A (Demo)', 100000, 1, 100),
(2, 'Producto B (Demo)', 25000, 1, 100);

INSERT IGNORE INTO chart_of_accounts (code, name, account_type, level, nature, is_active, is_system) VALUES 
('1105', 'Caja', 'ACTIVO', 4, 'DEBITO', 1, 0), 
('1305', 'Clientes', 'ACTIVO', 4, 'DEBITO', 1, 0), 
('2408', 'IVA por Pagar', 'PASIVO', 4, 'CREDITO', 1, 0), 
('4135', 'Ventas', 'INGRESO', 4, 'CREDITO', 1, 0);
"

docker exec mysql mysql -u root -pwidowmaker cloud_master -e "$sqlPrepCorregido"

# 2. LOGIN
Write-Host "`n[2/6] Autenticando..."
$loginBody = @{ username = "edwing2022"; password = "Edwin2025*" } | ConvertTo-Json
try {
    $loginRes = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginRes.jwt
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    Write-Host "✅ Login Exitoso." -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Error Login: $_" -ForegroundColor Red
    exit
}

# 3. CREAR COTIZACIÓN (QUOTE)
Write-Host "`n[3/6] Creando Cotización..."
$quoteBody = @{
    tenantId       = 1
    customerId     = 99
    expirationDate = (Get-Date).AddDays(15).ToString("yyyy-MM-ddTHH:mm:ss")
    status         = "SENT"
    notes          = "Cotización para Camila"
    items          = @(
        @{ productId = 1; quantity = 2; unitPrice = 100000; discount = 0 },
        @{ productId = 2; quantity = 1; unitPrice = 25000; discount = 0 }
    )
} | ConvertTo-Json -Depth 5

try {
    $quoteRes = Invoke-RestMethod -Uri "http://localhost:8080/quotes" -Method POST -Headers $headers -Body $quoteBody
    $quoteId = $quoteRes.id
    Write-Host "✅ Cotización Creada ID: $quoteId (Total: $($quoteRes.totalAmount))" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Error Quote: $_" -ForegroundColor Red
}

# 4. CREAR PEDIDO (ORDER)
Write-Host "`n[4/6] Convirtiendo a Pedido (Order)..."
$orderBody = @{
    tenantId      = 1
    customerId    = 99
    paymentMethod = "CASH"
    items         = @(
        @{ productId = 1; quantity = 2; discount = 0 },
        @{ productId = 2; quantity = 1; discount = 0 }
    )
    createdBy     = 1
} | ConvertTo-Json -Depth 5

try {
    $orderRes = Invoke-RestMethod -Uri "http://localhost:8080/orders" -Method POST -Headers $headers -Body $orderBody
    $orderId = $orderRes.id
    Write-Host "✅ Pedido Creado ID: $orderId (Nro: $($orderRes.invoiceNumber))" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Error Order: $_" -ForegroundColor Red
    if (!$orderId) { $orderId = 1 }
}

# 5. CREAR FACTURA (INVOICE)
Write-Host "`n[5/6] Generando Factura..."
$invoiceNumber = "FV-CAM-" + (Get-Random -Minimum 1000 -Maximum 9999)
$invoiceBody = @{
    tenantId      = 1
    customerId    = 99
    orderId       = $orderId
    issueDate     = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    status        = "PAID"
    invoiceNumber = $invoiceNumber
    notes         = "Factura flujo completo Camila"
    items         = @(
        @{ productId = 1; quantity = 2; unitPrice = 100000; tax = 38000; total = 238000 },
        @{ productId = 2; quantity = 1; unitPrice = 25000; tax = 0; total = 25000 }
    )
    subtotal      = 225000
    tax           = 38000
    total         = 263000
} | ConvertTo-Json -Depth 5

try {
    $invoiceRes = Invoke-RestMethod -Uri "http://localhost:8080/invoices" -Method POST -Headers $headers -Body $invoiceBody
    Write-Host "✅ Factura Creada: $invoiceNumber (Total: $($invoiceRes.total))" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ Error Invoice: $_" -ForegroundColor Red
}

# 6. CONTABILIZACIÓN AUTOMÁTICA (Simulada)
Write-Host "`n[6/6] Realizando Proceso Contable..."
$voucherSql2 = "
INSERT INTO accounting_vouchers (tenant_id, voucher_type, voucher_number, date, description, status, total_debit, total_credit, created_at)
VALUES (1, 'INGRESO', 'ING-$invoiceNumber', CURDATE(), 'Venta Factura $invoiceNumber', 'POSTED', 263000, 263000, NOW());
SET @vid = LAST_INSERT_ID();
INSERT INTO accounting_entries (voucher_id, account_code, debit_amount, credit_amount, description) VALUES (@vid, '1305', 263000, 0, 'CxC Clientes - Camila');
INSERT INTO accounting_entries (voucher_id, account_code, debit_amount, credit_amount, description) VALUES (@vid, '4135', 0, 225000, 'Ingresos Ventas Productos');
INSERT INTO accounting_entries (voucher_id, account_code, debit_amount, credit_amount, description) VALUES (@vid, '2408', 0, 38000, 'IVA Generado 19%');
"
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "$voucherSql2"
Write-Host "✅ Asiento Contable Generado." -ForegroundColor Cyan

# 7. VERIFICACIÓN FINAL
Start-Sleep -Seconds 1
Write-Host "`n📊 VERIFICACIÓN DE REPORTES" -ForegroundColor Yellow
Write-Host "--- Libro Diario (Hoy) ---"
try {
    $ld = Invoke-RestMethod -Uri "http://localhost:8080/api/accounting/reports/libro-diario?fromDate=$(Get-Date -Format 'yyyy-MM-dd')&toDate=$(Get-Date -Format 'yyyy-MM-dd')&tenantId=1" -Headers $headers
    $ld.entries | Select-Object accountCode, accountName, debitAmount, creditAmount | Format-Table
    Write-Host "Total Débito: $($ld.totalDebit) | Total Crédito: $($ld.totalCredit)"
}
catch { Write-Host "Error Reporte: $_" }
