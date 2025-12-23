# Test Complete Sales Flow
$baseUrl = "http://localhost:8080"

# 1. LOGIN
Write-Host "`n========== 1. LOGIN ==========" -ForegroundColor Cyan
$loginPayload = @{
    username = "edwing2022"
    password = "Edwin2025*"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    $tenantId = $loginResponse.userEntity.tenantId
    if (!$tenantId) { $tenantId = $loginResponse.userEntity.customer.id }
    Write-Host "Login exitoso. TenantID: $tenantId" -ForegroundColor Green
}
catch {
    Write-Host "Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. CREAR COTIZACION
Write-Host "`n========== 2. CREAR COTIZACION ==========" -ForegroundColor Cyan
$customers = Invoke-RestMethod -Uri "$baseUrl/contacts/tenant/$tenantId" -Method Get -Headers $headers
$customer = $customers | Where-Object { $_.type -eq "CUSTOMER" } | Select-Object -First 1
$products = Invoke-RestMethod -Uri "$baseUrl/productos/tenant/$tenantId" -Method Get -Headers $headers
$product1 = $products[0]

$quotePayload = @{
    tenantId       = $tenantId
    customerId     = $customer.id
    expirationDate = (Get-Date).AddDays(15).ToString("yyyy-MM-ddTHH:mm:ss")
    status         = "DRAFT"
    notes          = "Cotizacion de prueba"
    discount       = 0
    tax            = 0
    items          = @(@{
            productId   = $product1.id
            productName = $product1.productName
            quantity    = 2
            unitPrice   = $product1.salePrice
            discount    = 0
        })
} | ConvertTo-Json -Depth 10

try {
    $quote = Invoke-RestMethod -Uri "$baseUrl/quotes" -Method Post -Headers $headers -Body $quotePayload
    Write-Host "Cotizacion creada: ID=$($quote.id), Total=$($quote.total)" -ForegroundColor Green
    $quoteId = $quote.id
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. CONVERTIR A PEDIDO
Write-Host "`n========== 3. CREAR PEDIDO ==========" -ForegroundColor Cyan
$quoteDetails = Invoke-RestMethod -Uri "$baseUrl/quotes/$quoteId" -Method Get -Headers $headers
$orderPayload = @{
    tenantId      = $tenantId
    customerId    = $quoteDetails.customerId
    paymentMethod = "EFECTIVO"
    discount      = 0
    tax           = 0
    items         = $quoteDetails.items | ForEach-Object {
        @{
            productId = $_.productId
            quantity  = $_.quantity
            unitPrice = $_.unitPrice
            discount  = $_.discount
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $order = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $headers -Body $orderPayload
    Write-Host "Pedido creado: ID=$($order.id), Total=$($order.total)" -ForegroundColor Green
    $orderId = $order.id
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 4. GENERAR FACTURA
Write-Host "`n========== 4. GENERAR FACTURA ==========" -ForegroundColor Cyan
$orderDetails = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId" -Method Get -Headers $headers
$invoicePayload = @{
    tenantId   = $tenantId
    customerId = $orderDetails.customerId
    orderId    = $orderDetails.id
    dueDate    = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss")
    status     = "ISSUED"
    notes      = "Factura desde pedido"
    discount   = 0
    tax        = 0
    items      = $orderDetails.items | ForEach-Object {
        @{
            productId = $_.productId
            quantity  = $_.quantity
            unitPrice = $_.unitPrice
            discount  = $_.discount
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $invoice = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $invoicePayload
    Write-Host "Factura creada: ID=$($invoice.id), Total=$($invoice.total)" -ForegroundColor Green
    $invoiceId = $invoice.id
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. VERIFICAR CONTABILIDAD
Write-Host "`n========== 5. VERIFICAR CONTABILIDAD ==========" -ForegroundColor Cyan

try {
    $libroDiario = Invoke-RestMethod -Uri "$baseUrl/api/accounting/libro-diario?tenantId=$tenantId" -Method Get -Headers $headers
    Write-Host "Libro Diario: $($libroDiario.entries.Count) asientos" -ForegroundColor Green
}
catch {
    Write-Host "Error en Libro Diario" -ForegroundColor Red
}

try {
    $estadoResultados = Invoke-RestMethod -Uri "$baseUrl/api/accounting/estado-resultados?tenantId=$tenantId" -Method Get -Headers $headers
    Write-Host "Estado Resultados: Ingresos=$($estadoResultados.totalIngresos), Gastos=$($estadoResultados.totalGastos)" -ForegroundColor Green
}
catch {
    Write-Host "Error en Estado Resultados" -ForegroundColor Red
}

try {
    $balanceGeneral = Invoke-RestMethod -Uri "$baseUrl/api/accounting/balance-general?tenantId=$tenantId" -Method Get -Headers $headers
    Write-Host "Balance General: Activos=$($balanceGeneral.totalActivos), Pasivos=$($balanceGeneral.totalPasivos)" -ForegroundColor Green
}
catch {
    Write-Host "Error en Balance General" -ForegroundColor Red
}

Write-Host "`n========== RESUMEN ==========" -ForegroundColor Cyan
Write-Host "Cotizacion ID: $quoteId" -ForegroundColor Green
Write-Host "Pedido ID: $orderId" -ForegroundColor Green
if ($invoiceId) {
    Write-Host "Factura ID: $invoiceId" -ForegroundColor Green
}
Write-Host "`nFlujo completo ejecutado!" -ForegroundColor Green
