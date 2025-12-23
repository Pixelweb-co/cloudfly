# Validacion Sistema Contabilidad
Write-Host "`n*** VALIDACION SISTEMA ***`n" -ForegroundColor Magenta

$baseUrl = "http://localhost:8080"

# Login
Write-Host "=== LOGIN ===" -ForegroundColor Cyan
$loginPayload = '{"username":"edwing2022","password":"Edwin2025*"}'

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $login.jwt
    $tenantId = if ($login.userEntity.tenantId) { $login.userEntity.tenantId } else { $login.userEntity.customer.id }
    Write-Host "Login OK - Usuario: $($login.userEntity.username), Tenant: $tenantId" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Backend NO disponible o credenciales invalidas" -ForegroundColor Red
    exit
}

$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

# Plan de Cuentas
Write-Host "`n=== PLAN DE CUENTAS ===" -ForegroundColor Cyan
try {
    $accounts = Invoke-RestMethod -Uri "$baseUrl/chart-of-accounts" -Headers $headers    
    Write-Host "Total cuentas: $($accounts.Count)" -ForegroundColor Green
    
    $tipos = $accounts | Group-Object accountType | Select Name, Count
    foreach ($t in $tipos) {
        Write-Host "  $($t.Name): $($t.Count)" -ForegroundColor Cyan
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Libro Diario
Write-Host "`n=== LIBRO DIARIO ===" -ForegroundColor Cyan
$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")

try {
    $urlLibro = "$baseUrl/api/accounting/reports/libro-diario?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate"
    $libr = Invoke-RestMethod -Uri $urlLibro -Headers $headers
    Write-Host "Asientos: $($libr.entries.Count), Debitos: $($libr.totalDebit), Creditos: $($libr.totalCredit)" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Estado de Resultados
Write-Host "`n=== ESTADO DE RESULTADOS ===" -ForegroundColor Cyan
try {
    $urlEstado = "$baseUrl/api/accounting/reports/estado-resultados?tenantId=$tenantId&fromDate=$fromDate&toDate=$toDate"
    $est = Invoke-RestMethod -Uri $urlEstado -Headers $headers
    Write-Host "Ingresos: $($est.totalIngresos), Gastos: $($est.totalGastos), Utilidad: $($est.utilidadNeta)" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Balance General
Write-Host "`n=== BALANCE GENERAL ===" -ForegroundColor Cyan
try {
    $urlBalance = "$baseUrl/api/accounting/reports/balance-general?tenantId=$tenantId&asOfDate=$toDate"
    $bal = Invoke-RestMethod -Uri $urlBalance -Headers $headers
    Write-Host "Activos: $($bal.totalActivos), Pasivos: $($bal.totalPasivos), Patrimonio: $($bal.totalPatrimonio)" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Abrir vistas
Write-Host "`n=== ABRIENDO VISTAS ===" -ForegroundColor Cyan
Start-Process "http://localhost:3000/contabilidad/plan-cuentas"
Start-Sleep 1
Start-Process "http://localhost:3000/contabilidad/libro-diario"
Start-Sleep 1
Start-Process "http://localhost:3000/contabilidad/estado-resultados"
Start-Sleep 1
Start-Process "http://localhost:3000/contabilidad/balance-general"

Write-Host "`nVistas abiertas en el navegador" -ForegroundColor Green
Write-Host "`n*** VALIDACION COMPLETA ***`n" -ForegroundColor Green
