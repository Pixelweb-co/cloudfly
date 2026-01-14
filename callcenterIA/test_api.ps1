# Test Script para API de Llamadas Salientes

## 1. Verificar estado del servicio
Invoke-RestMethod -Uri http://localhost:5000/health

## 2. Iniciar llamada de cobranza
$callPayload = @{
    number = "1003"
    customer_name = "Edwin"
    agent_context = "Hola Edwin, te llamamos para recordarte que tienes una factura pendiente numero 2025 por valor de 25,000 pesos. El vencimiento es el 20 de enero. Podrias confirmar si realizaras el pago pronto?"
    tenant_id = "cobranzas_2025"
    subject = "Recordatorio factura 2025"
}

$response = Invoke-RestMethod -Uri http://localhost:5000/call -Method Post -Body ($callPayload | ConvertTo-Json) -ContentType "application/json"
Write-Host "Llamada iniciada:" -ForegroundColor Green
$response

## 3. Consultar estado de la llamada
$callId = $response.call_id
Start-Sleep -Seconds 5
$status = Invoke-RestMethod -Uri "http://localhost:5000/call/$callId"
Write-Host "`nEstado de la llamada:" -ForegroundColor Cyan
$status

## 4. Listar todas las llamadas activas
$allCalls = Invoke-RestMethod -Uri http://localhost:5000/calls
Write-Host "`nLlamadas activas:" -ForegroundColor Yellow
$allCalls

## 5. (Opcional) Colgar la llamada después de un tiempo
# Start-Sleep -Seconds 30
# Invoke-RestMethod -Uri "http://localhost:5000/call/$callId/hangup" -Method Post
