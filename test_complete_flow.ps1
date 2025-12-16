# ========================================
# PRUEBA COMPLETA DE FLUJO: VENTA + CONTABILIDAD
# ========================================

$baseUrl = "http://localhost:8080"

# Colores para output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Error { param($msg) Write-Host $msg -ForegroundColor Red }

# ========================================
# 1. LOGIN
# ========================================
Write-Info "`n========== 1. LOGIN =========="
$loginPayload = @{
    username = "edwing2022"
    password = "Edwin2025*"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    $tenantId = $loginResponse.userEntity.tenantId
    if (!$tenantId) {
        $tenantId = $loginResponse.userEntity.customer.id
    }
    Write-Success "✓ Login exitoso. Token obtenido, TenantID: $tenantId"
}
catch {
    Write-Error "✗ Error en login: $($_.Exception.Message)"
    exit
}

$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

# ========================================
# 2. CREAR COTIZACIÓN
# ========================================
Write-Info "`n========== 2. CREAR COTIZACIÓN =========="

# Obtener cliente
$customers = Invoke-RestMethod -Uri "$baseUrl/contacts/tenant/$tenantId" -Method Get -Headers $headers
$customer = $customers | Where-Object { $_.type -eq "CUSTOMER" } | Select-Object -First 1

# Obtener productos
$products = Invoke-RestMethod -Uri "$baseUrl/productos/tenant/$tenantId" -Method Get -Headers $headers
$product1 = $products[0]
$product2 = if ($products.Count -gt 1) { $products[1] } else { $products[0] }

# Crear cotización
$quotePayload = @{
    tenantId       = $tenantId
    customerId     = $customer.id
    expirationDate = (Get-Date).AddDays(15).ToString("yyyy-MM-ddTHH:mm:ss")
    status         = "DRAFT"
    notes          = "Cotización de prueba - Flujo completo"
    terms          = ""
    discount       = 0
    tax            = 0
    items          = @(
        @{
            productId   = $product1.id
            productName = $product1.productName
            quantity    = 2
            unitPrice   = $product1.salePrice
            discount    = 0
        },
        @{
            productId   = $product2.id
            productName = $product2.productName
            quantity    = 1
            unitPrice   = $product2.salePrice
            discount    = 0
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $quote = Invoke-RestMethod -Uri "$baseUrl/quotes" -Method Post -Headers $headers -Body $quotePayload
    Write-Success "✓ Cotización creada: ID=$($quote.id), Número=$($quote.quoteNumber), Total=$($quote.total)"
    $quoteId = $quote.id
}
catch {
    Write-Error "✗ Error creando cotización: $($_.Exception.Message)"
    exit
}

# ========================================
# 3. CONVERTIR COTIZACIÓN A PEDIDO
# ========================================
Write-Info "`n========== 3. CONVERTIR A PEDIDO =========="

# Obtener detalles de la cotización
$quoteDetails = Invoke-RestMethod -Uri "$baseUrl/quotes/$quoteId" -Method Get -Headers $headers

# Crear pedido con los items de la cotización
$orderPayload = @{
    tenantId      = $tenantId
    customerId    = $quoteDetails.customerId
    paymentMethod = "EFECTIVO"
    status        = "COMPLETED"
    discount      = 0
    tax           = 0
    items         = $quoteDetails.items | ForEach-Object {
        @{
            productId   = $_.productId
            productName = $_.productName
            quantity    = $_.quantity
            unitPrice   = $_.unitPrice
            discount    = $_.discount
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $order = Invoke-RestMethod -Uri "$baseUrl/orders" -Method Post -Headers $headers -Body $orderPayload
    Write-Success "✓ Pedido creado: ID=$($order.id), Número=$($order.invoiceNumber), Total=$($order.total)"
    $orderId = $order.id
}
catch {
    Write-Error "✗ Error creando pedido: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Error $reader.ReadToEnd()
    }
    exit
}

# ========================================
# 4. GENERAR FACTURA DESDE PEDIDO
# ========================================
Write-Info "`n========== 4. GENERAR FACTURA =========="

# Obtener detalles del pedido
$orderDetails = Invoke-RestMethod -Uri "$baseUrl/orders/$orderId" -Method Get -Headers $headers

# Crear factura con los items del pedido
$invoicePayload = @{
    tenantId   = $tenantId
    customerId = $orderDetails.customerId
    orderId    = $orderDetails.id
    dueDate    = (Get-Date).AddDays(30).ToString("yyyy-MM-ddTHH:mm:ss")
    status     = "ISSUED"
    notes      = "Factura generada desde Pedido #$($orderDetails.invoiceNumber)"
    discount   = 0
    tax        = 0
    items      = $orderDetails.items | ForEach-Object {
        @{
            productId   = $_.productId
            productName = $_.productName
            quantity    = $_.quantity
            unitPrice   = $_.unitPrice
            discount    = $_.discount
        }
    }
} | ConvertTo-Json -Depth 10

try {
    $invoice = Invoke-RestMethod -Uri "$baseUrl/invoices" -Method Post -Headers $headers -Body $invoicePayload
    Write-Success "✓ Factura creada: ID=$($invoice.id), Número=$($invoice.invoiceNumber), Total=$($invoice.total)"
    $invoiceId = $invoice.id
}
catch {
    Write-Error "✗ Error creando factura: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Error $reader.ReadToEnd()
    }
}

# ========================================
# 5. VERIFICAR CONTABILIDAD
# ========================================
Write-Info "`n========== 5. VERIFICAR REPORTES CONTABLES =========="

# Libro Diario
Write-Info "`nConsultando Libro Diario..."
try {
    $libroDiario = Invoke-RestMethod -Uri "$baseUrl/api/accounting/libro-diario?tenantId=$tenantId" -Method Get -Headers $headers
    Write-Success "✓ Libro Diario obtenido: $($libroDiario.entries.Count) asientos encontrados"
    if ($libroDiario.entries.Count -gt 0) {
        Write-Info "   Último asiento:"
        $lastEntry = $libroDiario.entries | Select -Last 1
        Write-Info "   - Fecha: $($lastEntry.date)"
        Write-Info "   - Descripción: $($lastEntry.description)"
        Write-Info "   - Total Débito: $($lastEntry.totalDebit)"
        Write-Info "   - Total Crédito: $($lastEntry.totalCredit)"
    }
}
catch {
    Write-Error "✗ Error consultando Libro Diario"
}

# Estado de Resultados
Write-Info "`nConsultando Estado de Resultados..."
try {
    $estadoResultados = Invoke-RestMethod -Uri "$baseUrl/api/accounting/estado-resultados?tenantId=$tenantId" -Method Get -Headers $headers
    Write-Success "✓ Estado de Resultados obtenido"
    Write-Info "   - Ingresos Totales: $($estadoResultados.totalIngresos)"
    Write-Info "   - Gastos Totales: $($estadoResultados.totalGastos)"
    Write-Info "   - Utilidad Neta: $($estadoResultados.utilidadNeta)"
}
catch {
    Write-Error "✗ Error consultando Estado de Resultados"
}

# Balance General
Write-Info "`nConsultando Balance General..."
try {
    $balanceGeneral = Invoke-RestMethod -Uri "$baseUrl/api/accounting/balance-general?tenantId=$tenantId" -Method Get -Headers $headers
    Write-Success "✓ Balance General obtenido"
    Write-Info "   - Total Activos: $($balanceGeneral.totalActivos)"
    Write-Info "   - Total Pasivos: $($balanceGeneral.totalPasivos)"
    Write-Info "   - Total Patrimonio: $($balanceGeneral.totalPatrimonio)"
}
catch {
    Write-Error "✗ Error consultando Balance General"
}

# ========================================
# RESUMEN FINAL
# ========================================
Write-Info "`n========== RESUMEN DEL FLUJO =========="
Write-Success "✓ Cotización ID: $quoteId"
Write-Success "✓ Pedido ID: $orderId"
if ($invoiceId) {
    Write-Success "✓ Factura ID: $invoiceId"
}
Write-Info "`n¡Flujo completo ejecutado exitosamente!"
