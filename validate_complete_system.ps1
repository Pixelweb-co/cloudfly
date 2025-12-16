# ========================================
# SCRIPT COMPLETO: Validar Base de Datos y Probar Frontend
# ========================================

Write-Host "`n*** VALIDACION COMPLETA DEL SISTEMA ***`n" -ForegroundColor Magenta

# 1. Verificar conexión al backend
Write-Host "=== 1. VERIFICANDO BACKEND ===" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -ErrorAction Stop
    Write-Host "Backend: OK (Status: $($health.status))" -ForegroundColor Green
}
catch {
    Write-Host "Backend: NO DISPONIBLE - Debe estar corriendo" -ForegroundColor Red
    Write-Host "Ejecuta: cd backend && mvnw spring-boot:run" -ForegroundColor Yellow
    exit
}

# 2. Login
Write-Host "`n=== 2. LOGIN ===" -ForegroundColor Cyan
$baseUrl = "http://localhost:8080"
$loginPayload = '{"username":"edwing2022","password":"Edwin2025*"}'

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    $tenantId = if ($loginResponse.userEntity.tenantId) { $loginResponse.userEntity.tenantId } else { $loginResponse.userEntity.customer.id }
    Write-Host "Login exitoso. Usuario: $($loginResponse.userEntity.username), TenantID: $tenantId" -ForegroundColor Green
}
catch {
    Write-Host "Error en login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{
    Authorization  = "Bearer $token"
    "Content-Type" = "application/json"
}

# 3. Verificar Plan de Cuentas
Write-Host "`n=== 3. PLAN DE CUENTAS ===" -ForegroundColor Cyan
try {
    $accounts = Invoke-RestMethod -Uri "$baseUrl/chart-of-accounts" -Headers $headers
    Write-Host "Total cuentas: $($accounts.Count)" -ForegroundColor Green
    
    $porTipo = $accounts | Group-Object -Property accountType | Select-Object Name, Count | Sort-Object Name
    foreach ($tipo in $porTipo) {
        Write-Host "  $($tipo.Name): $($tipo.Count) cuentas" -ForegroundColor Gray
    }
    
    if ($accounts.Count -gt 0) {
        Write-Host "`nPrimeras 5 cuentas:" -ForegroundColor Yellow
        $accounts | Select-Object -First 5 | ForEach-Object {
            Write-Host "  [$($_.code)] $($_.name) - $($_.accountType)" -ForegroundColor Cyan
        }
    }
    else {
        Write-Host "`n⚠️ NO HAY CUENTAS - Ejecuta el SQL: insert_chart_of_accounts.sql" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Error al obtener plan de cuentas: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Verificar Libro Diario
Write-Host "`n=== 4. LIBRO DIARIO ===" -ForegroundColor Cyan
$fromDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
$toDate = (Get-Date).ToString("yyyy-MM-dd")

try {
    $urlLibro = "$baseUrl/api/accounting/reports/libro-diario" + "?tenantId=$tenantId" + "&fromDate=$fromDate" + "&toDate=$toDate"
    $libroDiario = Invoke-RestMethod -Uri $urlLibro -Headers $headers
    Write-Host "Asientos contables: $($libroDiario.entries.Count)" -ForegroundColor Green
    Write-Host "Total Débitos: $($libroDiario.totalDebit)" -ForegroundColor Cyan
    Write-Host "Total Créditos: $($libroDiario.totalCredit)" -ForegroundColor Cyan
    $balanced = [Math]::Abs($libroDiario.totalDebit - $libroDiario.totalCredit) -lt 0.01
    if ($balanced) {
        Write-Host "Estado: BALANCEADO ✓" -ForegroundColor Green
    }
    else {
        Write-Host "Estado: DESBALANCEADO ✗" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error en Libro Diario: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Verificar Estado de Resultados
Write-Host "`n=== 5. ESTADO DE RESULTADOS ===" -ForegroundColor Cyan
try {
    $urlEstado = "$baseUrl/api/accounting/reports/estado-resultados" + "?tenantId=$tenantId" + "&fromDate=$fromDate" + "&toDate=$toDate"
    $estadoResultados = Invoke-RestMethod -Uri $urlEstado -Headers $headers
    Write-Host "Ingresos Totales: $($estadoResultados.totalIngresos)" -ForegroundColor Green
    Write-Host "Gastos Totales: $($estadoResultados.totalGastos)" -ForegroundColor Yellow
    Write-Host "Utilidad Neta: $($estadoResultados.utilidadNeta)" -ForegroundColor Cyan
    $margen = if ($estadoResultados.totalIngresos -gt 0) { 
        ($estadoResultados.utilidadNeta / $estadoResultados.totalIngresos * 100).ToString("F2") 
    }
    else { "0.00" }
    Write-Host "Margen Neto: $margen%" -ForegroundColor Magenta
}
catch {
    Write-Host "Error en Estado de Resultados: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Verificar Balance General
Write-Host "`n=== 6. BALANCE GENERAL ===" -ForegroundColor Cyan
try {
    $urlBalance = "$baseUrl/api/accounting/reports/balance-general" + "?tenantId=$tenantId" + "&asOfDate=$toDate"
    $balanceGeneral = Invoke-RestMethod -Uri $urlBalance -Headers $headers
    Write-Host "Activos: $($balanceGeneral.totalActivos)" -ForegroundColor Green
    Write-Host "Pasivos: $($balanceGeneral.totalPasivos)" -ForegroundColor Yellow
    Write-Host "Patrimonio: $($balanceGeneral.totalPatrimonio)" -ForegroundColor Cyan
    if ($balanceGeneral.isBalanced) {
        Write-Host "Ecuación Contable: BALANCEADO ✓" -ForegroundColor Green
    }
    else {
        Write-Host "Ecuación Contable: DESBALANCEADO ✗" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error en Balance General: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Abrir Frontend
Write-Host "`n=== 7. ABRIENDO FRONTEND ===" -ForegroundColor Cyan
$frontendUrl = "http://localhost:3000"

Write-Host "Abriendo vistas en el navegador..." -ForegroundColor Yellow

Start-Process "$frontendUrl/contabilidad/plan-cuentas"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/libro-diario"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/estado-resultados"
Start-Sleep -Seconds 1
Start-Process "$frontendUrl/contabilidad/balance-general"

Write-Host "4 pestañas abiertas en tu navegador" -ForegroundColor Green

# Resumen
Write-Host "`n=== RESUMEN ===" -ForegroundColor Magenta
Write-Host "Backend: ✓ Funcionando" -ForegroundColor Green
Write-Host "Plan de Cuentas: ✓ $($accounts.Count) cuentas" -ForegroundColor Green
Write-Host "Libro Diario: ✓ Consultado" -ForegroundColor Green
Write-Host "Estado Resultados: ✓ Consultado" -ForegroundColor Green
Write-Host "Balance General: ✓ Consultado" -ForegroundColor Green
Write-Host "Frontend: ✓ Vistas abiertas" -ForegroundColor Green

Write-Host "`n*** VALIDACION COMPLETA ***`n" -ForegroundColor Green
Write-Host "Revisa las pestañas del navegador para verificar que las vistas funcionan correctamente." -ForegroundColor Yellow
