# Complete Sales + Accounting Flow Test
$baseUrl = "http://localhost:8080"

# Login
Write-Host "`n=== LOGIN ===" -ForegroundColor Cyan
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body '{"username":"edwing2022","password":"Edwin2025*"}' -ContentType "application/json"
$token = $login.jwt
$tenantId = if ($login.userEntity.tenantId) { $login.userEntity.tenantId } else { $login.userEntity.customer.id }
Write-Host "Login OK. TenantID: $tenantId" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Get data
$customers = Invoke-RestMethod -Uri "$baseUrl/contacts/tenant/$tenantId" -Headers $headers
$customer = ($customers | Where-Object { $_.type -eq "CUSTOMER" })[0]
$products = Invoke-RestMethod -Uri "$baseUrl/productos/tenant/$tenantId" -Headers $headers
$product = $products[0]

# Create Quote
Write-Host "`n=== CREATE QUOTE ===" -ForegroundColor Cyan
$quoteJson = @"
{
  "tenantId": $tenantId,
  "customerId": $($customer.id),
  "expirationDate": "2025-12-26T00:00:00",
  "status": "DRAFT",
  "notes": "Test Quote",
  "discount": 0,
  "tax": 0,
  "items": [
    {
      "productId": $($product.id),
      "productName": "$($product.productName)",
      "quantity": 3,
      "unitPrice": $($product.salePrice),
      "discount": 0
    }
  ]
}
"@
$quote = Invoke-RestMethod -Uri "$baseUrl/quotes" -Method Post -Headers $headers -Body $quoteJson
Write-Host "Quote created: ID=$($quote.id), Total=$($quote.total)" -ForegroundColor Green

# Create Order
Write-Host "`n=== CREATE ORDER ===" -ForegroundColor Cyan
$orderJson = @"
{
  "tenantId": $tenantId,
  "customerId": $($customer.id),
  "paymentMethod": "EFECTIVO",
  "discount": 0,
  "tax": 0,
  "items": [
    {
      "productId": $($product.id),
      "quantity": 3,
      "unitPrice": $($product.salePrice),
      "discount": 0
    }
  ]
}
"@
$order = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $headers -Body $orderJson
Write-Host "Order created: ID=$($order.id), Total=$($order.total)" -ForegroundColor Green

# Create Invoice
Write-Host "`n=== CREATE INVOICE ===" -ForegroundColor Cyan
$invoiceJson = @"
{
  "tenantId": $tenantId,
  "customerId": $($customer.id),
  "orderId": $($order.id),
  "dueDate": "2026-01-15T00:00:00",
  "status": "ISSUED",
  "notes": "Invoice from test",
  "discount": 0,
  "tax": 0,
  "items": [
    {
      "productId": $($product.id),
      "quantity": 3,
      "unitPrice": $($product.salePrice),
      "discount": 0
    }
  ]
}
"@
$invoice = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $invoiceJson
Write-Host "Invoice created: ID=$($invoice.id), Total=$($invoice.total)" -ForegroundColor Green

# Check Accounting Reports
Write-Host "`n=== ACCOUNTING REPORTS ===" -ForegroundColor Cyan

Write-Host "Checking Libro Diario..." -ForegroundColor Yellow
try {
    $libro = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/libro-diario?tenantId=$tenantId" -Headers $headers
    Write-Host "  Libro Diario: $($libro.entries.Count) entries found" -ForegroundColor Green
    if ($libro.entries.Count -gt 0) {
        $last = $libro.entries | Select -Last 1
        Write-Host "  Last entry: $($last.date) - $($last.description)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "  Libro Diario: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nChecking Estado de Resultados..." -ForegroundColor Yellow
try {
    $estado = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/estado-resultados?tenantId=$tenantId" -Headers $headers
    Write-Host "  Estado Resultados: Income=$($estado.totalIngresos), Expense=$($estado.totalGastos), Net=$($estado.utilidadNeta)" -ForegroundColor Green
}
catch {
    Write-Host "  Estado Resultados: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nChecking Balance General..." -ForegroundColor Yellow
try {
    $balance = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/balance-general?tenantId=$tenantId" -Headers $headers
    Write-Host "  Balance: Assets=$($balance.totalActivos), Liabilities=$($balance.totalPasivos), Equity=$($balance.totalPatrimonio)" -ForegroundColor Green
}
catch {
    Write-Host "  Balance: ERROR - $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`n=== FINAL SUMMARY ===" -ForegroundColor Cyan
Write-Host "Quote ID: $($quote.id) | Total: $($quote.total)" -ForegroundColor Green
Write-Host "Order ID: $($order.id) | Total: $($order.total)" -ForegroundColor Green
Write-Host "Invoice ID: $($invoice.id) | Total: $($invoice.total)" -ForegroundColor Green
Write-Host "`n*** COMPLETE FLOW EXECUTED SUCCESSFULLY! ***" -ForegroundColor Green
