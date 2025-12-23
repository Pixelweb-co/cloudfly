# 1. Insertar Cuentas PUC
Write-Host "Inserting Chart of Accounts..."
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "INSERT IGNORE INTO chart_of_accounts (code, name, account_type, level, nature, is_active, is_system) VALUES ('1105', 'Caja', 'ACTIVO', 4, 'DEBITO', 1, 0), ('1305', 'Clientes', 'ACTIVO', 4, 'DEBITO', 1, 0), ('1435', 'Mercancías', 'ACTIVO', 4, 'DEBITO', 1, 0), ('2408', 'IVA por Pagar', 'PASIVO', 4, 'CREDITO', 1, 0), ('4135', 'Ventas', 'INGRESO', 4, 'CREDITO', 1, 0), ('6135', 'Costo de Ventas', 'COSTO', 4, 'DEBITO', 1, 0);"

# 2. Login
Write-Host "Logging in..."
$loginBody = @{ username = "edwing2022"; password = "Edwin2025*" } | ConvertTo-Json
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
$token = $loginResponse.jwt
Write-Host "Token obtained."

# 3. Crear Factura
Write-Host "Creating Invoice..."
$invoiceNumber = "FV-" + (Get-Random)
$invoiceBody = @{
    tenantId      = 1
    customerId    = 1
    issueDate     = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    status        = "PAID"
    invoiceNumber = $invoiceNumber
    items         = @(
        @{
            productId = 1
            quantity  = 1
            unitPrice = 100000
            tax       = 19000
            total     = 119000
        }
    )
    subtotal      = 100000
    tax           = 19000
    total         = 119000
} | ConvertTo-Json -Depth 5

$headers = @{ Authorization = "Bearer $token" }

try {
    $invoiceResponse = Invoke-RestMethod -Uri "http://localhost:8080/invoices" -Method POST -ContentType "application/json" -Headers $headers -Body $invoiceBody
    Write-Host "Invoice Created: $($invoiceResponse.invoiceNumber)"
}
catch {
    Write-Host "Error creating invoice: $_"
}

# 4. SIMULAR CONTABILIZACIÓN (Insertar Voucher)
Write-Host "`nSimulating Accounting Voucher..."
$voucherSql = "
INSERT INTO accounting_vouchers (tenant_id, voucher_type, voucher_number, date, description, status, total_debit, total_credit, created_at)
VALUES (1, 'INGRESO', 'ING-$invoiceNumber', '2025-12-11', 'Venta $invoiceNumber', 'POSTED', 119000, 119000, NOW());
SET @voucher_id = LAST_INSERT_ID();
INSERT INTO accounting_entries (voucher_id, account_code, debit_amount, credit_amount, description) VALUES
(@voucher_id, '1305', 119000, 0, 'CxC Clientes - Venta'),
(@voucher_id, '4135', 0, 100000, 'Ingresos Ventas'),
(@voucher_id, '2408', 0, 19000, 'IVA Generado');
"
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "$voucherSql"
Write-Host "Voucher inserted."

# 5. Verificar Reportes
Start-Sleep -Seconds 2

Write-Host "`nChecking Libro Diario (2025-12-11)..."
try {
    $diario = Invoke-RestMethod -Uri "http://localhost:8080/api/accounting/reports/libro-diario?fromDate=2025-12-11&toDate=2025-12-11&tenantId=1" -Method GET -Headers $headers
    $diario | ConvertTo-Json -Depth 5
}
catch { Write-Host "Error Libro Diario: $_" }

Write-Host "`nChecking Estado Resultados (Full 2025)..."
try {
    $er = Invoke-RestMethod -Uri "http://localhost:8080/api/accounting/reports/estado-resultados?fromDate=2025-01-01&toDate=2025-12-31&tenantId=1" -Method GET -Headers $headers
    $er | ConvertTo-Json -Depth 5
}
catch { Write-Host "Error Estado Resultados: $_" }

Write-Host "`nChecking Balance General (2025-12-11)..."
try {
    $bg = Invoke-RestMethod -Uri "http://localhost:8080/api/accounting/reports/balance-general?asOfDate=2025-12-11&tenantId=1" -Method GET -Headers $headers
    $bg | ConvertTo-Json -Depth 5
}
catch { Write-Host "Error Balance General: $_" }
