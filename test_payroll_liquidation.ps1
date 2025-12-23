# Script de Prueba - Sistema de Liquidación y Pago de Nómina
# Asegúrate de tener un período creado y empleados asignados

$baseUrl = "http://localhost:8080/api/hr/payroll"
$customerId = 1

Write-Host "=== PRUEBA DE LIQUIDACIÓN Y PAGO DE NÓMINA ===" -ForegroundColor Cyan

# 1. Liquidar Período
Write-Host "`n1. Liquidando período..." -ForegroundColor Yellow
$periodId = Read-Host "Ingresa el ID del período a liquidar"

try {
    $liquidateResponse = Invoke-RestMethod -Uri "$baseUrl/periods/$periodId/liquidate?customerId=$customerId" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{ "Authorization" = "Bearer YOUR_TOKEN_HERE" }
    
    Write-Host "✅ Liquidación exitosa:" -ForegroundColor Green
    $liquidateResponse | ConvertTo-Json -Depth 3
    
    Write-Host "`nDetalles:" -ForegroundColor Cyan
    Write-Host "  - Período ID: $($liquidateResponse.periodId)"
    Write-Host "  - Estado: $($liquidateResponse.status)"
    Write-Host "  - Empleados: $($liquidateResponse.totalEmployees)"
    Write-Host "  - Recibos generados: $($liquidateResponse.receiptsGenerated)"
    Write-Host "  - Total neto: $($liquidateResponse.totalNetPay)"
    Write-Host "  - Novedades procesadas: $($liquidateResponse.noveltiesProcessed)"
    
}
catch {
    Write-Host "❌ Error en liquidación: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Obtener recibos del período
Write-Host "`n2. Obteniendo recibos del período..." -ForegroundColor Yellow
try {
    $receiptsResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/hr/payroll/periods/$periodId/receipts?customerId=$customerId" `
        -Method GET `
        -ContentType "application/json"
    
    Write-Host "✅ Recibos obtenidos: $($receiptsResponse.Count)" -ForegroundColor Green
    
    if ($receiptsResponse.Count -gt 0) {
        Write-Host "`nRecibos pendientes de pago:" -ForegroundColor Cyan
        foreach ($receipt in $receiptsResponse) {
            if ($receipt.status -eq "PENDING") {
                Write-Host "  - ID: $($receipt.id) | Empleado: $($receipt.employeeName) | Neto: $($receipt.netPay)"
            }
        }
    }
    
}
catch {
    Write-Host "⚠️  No se pudieron obtener recibos" -ForegroundColor Yellow
}

# 3. Pagar un recibo individual
Write-Host "`n3. Pagando recibo individual..." -ForegroundColor Yellow
$receiptId = Read-Host "Ingresa el ID del recibo a pagar"

$paymentData = @{
    paymentReference = "TRX-$(Get-Date -Format 'yyyyMMddHHmmss')"
    paymentMethod    = "TRANSFER"
    notes            = "Pago de nómina realizado vía transferencia bancaria"
} | ConvertTo-Json

try {
    $payResponse = Invoke-RestMethod -Uri "$baseUrl/receipts/$receiptId/pay?customerId=$customerId" `
        -Method POST `
        -ContentType "application/json" `
        -Body $paymentData `
        -Headers @{ "Authorization" = "Bearer YOUR_TOKEN_HERE" }
    
    Write-Host "✅ Pago exitoso:" -ForegroundColor Green
    $payResponse | ConvertTo-Json -Depth 3
    
    Write-Host "`nDetalles del pago:" -ForegroundColor Cyan
    Write-Host "  - Recibo ID: $($payResponse.receiptId)"
    Write-Host "  - Empleado: $($payResponse.employeeName)"
    Write-Host "  - Neto pagado: $($payResponse.netPay)"
    Write-Host "  - Estado: $($payResponse.status)"
    Write-Host "  - PDF: $($payResponse.pdfUrl)"
    Write-Host "  - Email enviado: $($payResponse.emailSent)"
    Write-Host "  - Estado del período: $($payResponse.periodStatus)"
    
}
catch {
    Write-Host "❌ Error en pago: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PRUEBA COMPLETADA ===" -ForegroundColor Cyan
