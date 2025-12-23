# ===================================================
# COMPLETE SALES + ACCOUNTING WORKFLOW TEST
# ===================================================
$baseUrl = "http://localhost:8080"

Write-Host "`n*** COMPLETE SALES & ACCOUNTING FLOW TEST ***`n" -ForegroundColor Magenta

# 1. LOGIN
Write-Host "=== 1. LOGIN ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"username":"edwing2022","password":"Edwin2025*"}' -ContentType "application/json"
$token = $login.jwt
$tenantId = if ($login.userEntity.tenantId) { $login.userEntity.tenantId } else { $login.userEntity.customer.id }
Write-Host "Login successful. TenantID: $tenantId`n" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Get initial data
$customers = Invoke-RestMethod -Uri "$baseUrl/contacts/tenant/$tenantId" -Headers $headers
$customer = ($customers | Where-Object { $_.type -eq "CUSTOMER" })[0]
$products = Invoke-RestMethod -Uri "$baseUrl/productos/tenant/$tenantId" -Headers $headers
$product = $products[0]

# 2. CREATE QUOTE
Write-Host "=== 2. CREATE QUOTE ===" -ForegroundColor Cyan
$quoteJson = @"
{
  "tenantId": $tenantId,
  "customerId": $($customer.id),
  "expirationDate": "2025-12-26T00:00:00",
  "status": "DRAFT",
  "notes": "Test Quote - Sales Flow",
  "discount": 0,
  "tax": 0,
  "items": [{
    "productId": $($product.id),
    "productName": "$($product.productName)",
    "quantity": 5,
    "unitPrice": $($product.salePrice),
    "discount": 0
  }]
}
"@
$quote = Invoke-RestMethod -Uri "$baseUrl/quotes" -Method Post -Headers $headers -Body $quoteJson
Write-Host "Quote created: ID=$($quote.id), Total=$($quote.total)`n" -ForegroundColor Green

# 3. CREATE ORDER
Write-Host "=== 3. CREATE ORDER ===" -ForegroundColor Cyan
$orderJson = @"
{
  "tenantId": $tenantId,
  "customerId": $($customer.id),
  "paymentMethod": "EFECTIVO",
  "discount": 0,
  "tax": 0,
  "items": [{
    "productId": $($product.id),
    "quantity": 5,
    "unitPrice": $($product.salePrice),
    "discount": 0
  }]
}
"@
$order = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $headers -Body $orderJson
Write-Host "Order created: ID=$($order.id), Total=$($order.total)`n" -ForegroundColor Green

# 4. CREATE INVOICE
Write-Host "=== 4. CREATE INVOICE ===" -ForegroundColor Cyan
$invoiceJson = @"
{
  "tenantId": $tenantId,
  "customerId": $($customer.id),
  "orderId": $($order.id),
  "dueDate": "2026-01-15T00:00:00",
  "status": "ISSUED",
  "notes": "Invoice - Sales Flow Test",
  "discount": 0,
  "tax": 0,
  "items": [{
    "productId": $($product.id),
    "quantity": 5,
    "unitPrice": $($product.salePrice),
    "discount": 0
  }]
}
"@
$invoice = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $invoiceJson
Write-Host "Invoice created: ID=$($invoice.id), Total=$($invoice.total)`n" -ForegroundColor Green

# 5. CHECK ACCOUNTING REPORTS
Write-Host "=== 5. ACCOUNTING REPORTS ===" -ForegroundColor Cyan

$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")

Write-Host "Date range: $fromDate to $toDate`n" -ForegroundColor Yellow

# Libro Diario
try {
    $libro = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/libro-diario?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate" -Headers $headers
    Write-Host "Libro Diario: $($libro.entries.Count) accounting entries" -ForegroundColor Green
    if ($libro.entries.Count -gt 0) {
        $last = $libro.entries | Select -Last 1
        Write-Host "  Last entry: $($last.date) - $($last.description)" -ForegroundColor Gray
    }
}
catch {
    Write-Host "Libro Diario: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Estado de Resultados
try {
    $estado = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/estado-resultados?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate" -Headers $headers
    Write-Host "Estado de Resultados: Income=$($estado.totalIngresos), Expense=$($estado.totalGastos), Net=$($estado.utilidadNeta)" -ForegroundColor Green
}
catch {
    Write-Host "Estado de Resultados: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Balance General
try {
    $balance = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/balance-general?tenantId=$tenantId&asOfDate=$toDate" -Headers $headers
    Write-Host "Balance General: Assets=$($balance.totalActivos), Liabilities=$($balance.totalPasivos), Equity=$($balance.totalPatrimonio)" -ForegroundColor Green
}
catch {
    Write-Host "Balance General: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# 6. SUMMARY
Write-Host "`n=== FINAL SUMMARY ===" -ForegroundColor Magenta
Write-Host "Quote:   ID=$($quote.id)   | Total: $($quote.total)" -ForegroundColor Cyan
Write-Host "Order:   ID=$($order.id)   | Total: $($order.total)" -ForegroundColor Cyan
Write-Host "Invoice: ID=$($invoice.id) | Total: $($invoice.total)" -ForegroundColor Cyan
Write-Host "`n*** COMPLETE FLOW EXECUTED SUCCESSFULLY! ***`n" -ForegroundColor Green
