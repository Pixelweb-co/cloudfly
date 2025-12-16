# ========================================
# PRUEBA COMPLETA DE TODAS LAS VISTAS DE CONTABILIDAD
# ========================================

$baseUrl = "http://localhost:8080"
$frontendUrl = "http://localhost:3000"

Write-Host "`n*** TEST COMPLETO DE CONTABILIDAD ***`n" -ForegroundColor Magenta

# 1. LOGIN
Write-Host "=== 1. LOGIN ===" -ForegroundColor Cyan
$loginPayload = '{"username":"edwing2022","password":"Edwin2025*"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    $tenantId = if ($loginResponse.userEntity.tenantId) { $loginResponse.userEntity.tenantId } else { $loginResponse.userEntity.customer.id }
    Write-Host "✓ Login exitoso. TenantID: $tenantId" -ForegroundColor Green
}
catch {
    Write-Host "✗ Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

# 2. PLAN DE CUENTAS
Write-Host "`n=== 2. PLAN DE CUENTAS ===" -ForegroundColor Cyan
try {
    $accounts = Invoke-RestMethod -Uri "$baseUrl/chart-of-accounts" -Method Get -Headers $headers
    Write-Host "✓ Plan de Cuentas: $($accounts.Count) cuentas encontradas" -ForegroundColor Green
    Write-Host "  URL Frontend: $frontendUrl/contabilidad/plan-cuentas" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Error en Plan de Cuentas: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. LIBRO DIARIO
Write-Host "`n=== 3. LIBRO DIARIO ===" -ForegroundColor Cyan
$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")

try {
    $libroDiario = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/libro-diario?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate" -Headers $headers
    Write-Host "✓ Libro Diario: $($libroDiario.entries.Count) asientos, Débitos=$($libroDiario.totalDebit), Créditos=$($libroDiario.totalCredit)" -ForegroundColor Green
    Write-Host "  URL Frontend: $frontendUrl/contabilidad/libro-diario" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Error en Libro Diario: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. ESTADO DE RESULTADOS
Write-Host "`n=== 4. ESTADO DE RESULTADOS ===" -ForegroundColor Cyan
try {
    $estadoResultados = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/estado-resultados?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate" -Headers $headers
    Write-Host "✓ Estado Resultados: Ingresos=$($estadoResultados.totalIngresos), Gastos=$($estadoResultados.totalGastos), Utilidad=$($estadoResultados.utilidadNeta)" -ForegroundColor Green
    Write-Host "  URL Frontend: $frontendUrl/contabilidad/estado-resultados" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Error en Estado de Resultados: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. BALANCE GENERAL
Write-Host "`n=== 5. BALANCE GENERAL ===" -ForegroundColor Cyan
try {
    $balanceGeneral = Invoke-RestMethod -Uri "$baseUrl/api/accounting/reports/balance-general?tenantId=$tenantId&asOfDate=$toDate" -Headers $headers
    Write-Host "✓ Balance General: Activos=$($balanceGeneral.totalActivos), Pasivos=$($balanceGeneral.totalPasivos), Patrimonio=$($balanceGeneral.totalPatrimonio)" -ForegroundColor Green
    Write-Host "  URL Frontend: $frontendUrl/contabilidad/balance-general" -ForegroundColor Gray
}
catch {
    Write-Host "✗ Error en Balance General: $($_.Exception.Message)" -ForegroundColor Red
}

# ABRIR VISTAS EN EL NAVEGADOR
Write-Host "`n=== ABRIENDO VISTAS EN NAVEGADOR ===" -ForegroundColor Cyan
Write-Host "Abriendo 4 pestañas..." -ForegroundColor Yellow

Start-Process "$frontendUrl/contabilidad/plan-cuentas"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/libro-diario"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/estado-resultados"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/balance-general"

Write-Host "`n✅ Las 4 vistas deberían abrirse en tu navegador" -ForegroundColor Green

Write-Host "`n=== RESUMEN ===" -ForegroundColor Magenta
Write-Host "1. Plan de Cuentas: Gestión completa del PUC" -ForegroundColor Cyan
Write-Host "2. Libro Diario: Registros contables cronológicos" -ForegroundColor Cyan
Write-Host "3. Estado Resultados: P&L con ingresos y gastos" -ForegroundColor Cyan
Write-Host "4. Balance General: Activos, Pasivos y Patrimonio" -ForegroundColor Cyan
Write-Host "`n*** PRUEBA COMPLETA EJECUTADA ***`n" -ForegroundColor Green
