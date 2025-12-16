# Script de Validacion Completa
Write-Host "`n*** VALIDACION COMPLETA ***`n" -ForegroundColor Magenta

# Backend health check
Write-Host "=== BACKEND ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -ErrorAction Stop | Out-Null
    Write-Host "Backend: OK" -ForegroundColor Green
}
catch {
    Write-Host "Backend: NO DISPONIBLE" -ForegroundColor Red
    exit
}

# Login
Write-Host "`n=== LOGIN ===" -ForegroundColor Cyan
$baseUrl = "http://localhost:8080"
$loginPayload = '{"username":"edwing2022","password":"Edwin2025*"}'

$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$token = $login.jwt
$tenantId = if ($login.userEntity.tenantId) { $login.userEntity.tenantId } else { $login.userEntity.customer.id }
Write-Host "Usuario: $($login.userEntity.username), Tenant: $tenantId" -ForegroundColor Green

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Plan de Cuentas
Write-Host "`n=== PLAN DE CUENTAS ===" -ForegroundColor Cyan
$accounts = Invoke-RestMethod -Uri "$baseUrl/chart-of-accounts" -Headers $headers
Write-Host "Total: $($accounts.Count) cuentas" -ForegroundColor Green

$accountsByType = $accounts | Group-Object accountType | ForEach-Object { "$($_.Name): $($_.Count)" }
Write-Host ($accountsByType -join ", ") -ForegroundColor Cyan

# Libro Diario
Write-Host "`n=== LIBRO DIARIO ===" -ForegroundColor Cyan
$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")
$urlLibro = "$baseUrl/api/accounting/reports/libro-diario?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate"
$libroDiario = Invoke-RestMethod -Uri $urlLibro -Headers $headers
Write-Host "Asientos: $($libroDiario.entries.Count)" -ForegroundColor Green
Write-Host "Debitos: $($libroDiario.totalDebit), Creditos: $($libroDiario.totalCredit)" -ForegroundColor Cyan

# Estado de Resultados
Write-Host "`n=== ESTADO DE RESULTADOS ===" -ForegroundColor Cyan
$urlEstado = "$baseUrl/api/accounting/reports/estado-resultados?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate"
$estado = Invoke-RestMethod -Uri $urlEstado -Headers $headers
Write-Host "Ingresos: $($estado.totalIngresos)" -ForegroundColor Green
Write-Host "Gastos: $($estado.totalGastos)" -ForegroundColor Yellow
Write-Host "Utilidad: $($estado.utilidadNeta)" -ForegroundColor Cyan

# Balance General
Write-Host "`n=== BALANCE GENERAL ===" -ForegroundColor Cyan
$urlBalance = "$baseUrl/api/accounting/reports/balance-general?tenantId=$tenantId&asOfDate=$toDate"
$balance = Invoke-RestMethod -Uri $urlBalance -Headers $headers
Write-Host "Activos: $($balance.totalActivos)" -ForegroundColor Green
Write-Host "Pasivos: $($balance.totalPasivos)" -ForegroundColor Yellow
Write-Host "Patrimonio: $($balance.totalPatrimonio)" -ForegroundColor Cyan

# Abrir frontend
Write-Host "`n=== ABRIENDO FRONTEND ===" -ForegroundColor Cyan
Start-Process "http://localhost:3000/contabilidad/plan-cuentas"
Start-Sleep -Seconds 1
Start-Process "http://localhost:3000/contabilidad/libro-diario"
Start-Sleep -Seconds 1
Start-Process "http://localhost:3000/contabilidad/estado-resultados"
Start-Sleep -Seconds 1
Start-Process "http://localhost:3000/contabilidad/balance-general"

Write-Host "`n*** VALIDACION COMPLETA ***" -ForegroundColor Green
Write-Host "Verifica las pestañas del navegador`n" -ForegroundColor Yellow
