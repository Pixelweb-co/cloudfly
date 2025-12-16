# Test Completo de Contabilidad
$baseUrl = "http://localhost:8080"
$frontendUrl = "http://localhost:3000"

Write-Host "`n*** TEST COMPLETO DE CONTABILIDAD ***`n" -ForegroundColor Magenta

# Login
Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$loginPayload = '{"username":"edwing2022","password":"Edwin2025*"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    $tenantId = if ($loginResponse.userEntity.tenantId) { $loginResponse.userEntity.tenantId } else { $loginResponse.userEntity.customer.id }
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

# Plan de Cuentas
Write-Host "`n=== PLAN DE CUENTAS ===" -ForegroundColor Cyan
try {
    $accounts = Invoke-RestMethod -Uri "$baseUrl/chart-of-accounts" -Headers $headers
    Write-Host "Plan de Cuentas: $($accounts.Count) cuentas" -ForegroundColor Green
}
catch {
    Write-Host "Error en Plan de Cuentas: $($_.Exception.Message)" -ForegroundColor Red
}

# Libro Diario
Write-Host "`n=== LIBRO DIARIO ===" -ForegroundColor Cyan
$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")

try {
    $urlLibro = "$baseUrl/api/accounting/reports/libro-diario" + "?tenantId=$tenantId" + "&fromDate=$fromDate" + "&toDate=$toDate"
    $libroDiario = Invoke-RestMethod -Uri $urlLibro -Headers $headers
    Write-Host "Libro Diario: $($libroDiario.entries.Count) asientos" -ForegroundColor Green
}
catch {
    Write-Host "Error en Libro Diario: $($_.Exception.Message)" -ForegroundColor Red
}

# Estado de Resultados
Write-Host "`n=== ESTADO DE RESULTADOS ===" -ForegroundColor Cyan
try {
    $urlEstado = "$baseUrl/api/accounting/reports/estado-resultados" + "?tenantId=$tenantId" + "&fromDate=$fromDate" + "&toDate=$toDate"
    $estadoResultados = Invoke-RestMethod -Uri $urlEstado -Headers $headers
    Write-Host "Estado Resultados: Ingresos=$($estadoResultados.totalIngresos)" -ForegroundColor Green
}
catch {
    Write-Host "Error en Estado de Resultados: $($_.Exception.Message)" -ForegroundColor Red
}

# Balance General
Write-Host "`n=== BALANCE GENERAL ===" -ForegroundColor Cyan
try {
    $urlBalance = "$baseUrl/api/accounting/reports/balance-general" + "?tenantId=$tenantId" + "&asOfDate=$toDate"
    $balanceGeneral = Invoke-RestMethod -Uri $urlBalance -Headers $headers
    Write-Host "Balance General: Activos=$($balanceGeneral.totalActivos)" -ForegroundColor Green
}
catch {
    Write-Host "Error en Balance General: $($_.Exception.Message)" -ForegroundColor Red
}

# Abrir en navegador
Write-Host "`n=== ABRIENDO EN NAVEGADOR ===" -ForegroundColor Cyan
Start-Process "$frontendUrl/contabilidad/plan-cuentas"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/libro-diario"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/estado-resultados"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/balance-general"

Write-Host "`nLas 4 vistas se abrieron en tu navegador" -ForegroundColor Green
Write-Host "`n*** PRUEBA COMPLETA ***`n" -ForegroundColor Green
