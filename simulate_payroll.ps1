$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:8080"
$loginPayload = '{"username":"edwing2022","password":"Edwin2025*"}'
$customerId = 1

Write-Host "=== SIMULACION DE NOMINA Y CONTABILIDAD ===" -ForegroundColor Magenta

# 1. Login
Write-Host "`n1. Autenticando..." -ForegroundColor Cyan
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
    Write-Host "Login OK." -ForegroundColor Green
}
catch {
    Write-Host "Error login: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 2. Activar Integración Contable y Configurar Cuentas (Por si acaso)
Write-Host "`n2. Configurando Integración Contable..." -ForegroundColor Cyan
$configUrl = "$baseUrl/api/hr/payroll/config?customerId=$customerId"
try {
    # Obtenemos config actual
    $currentConfig = Invoke-RestMethod -Uri "$baseUrl/api/hr/payroll/config?customerId=$customerId" -Method Get -Headers $headers
    
    # Preparamos update con integración activa (y cuentas por defecto implícitas en backend si estas van null)
    # Enviamos enableAccountingIntegration = true
    $currentConfig.enableAccountingIntegration = $true
    
    # OJO: No enviamos cuentas específicas para que use las automáticas, o mantenemos las que hay.
    # Convertimos a JSON y enviamos PUT
    $jsonConfig = $currentConfig | ConvertTo-Json -Depth 10
    
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/api/hr/payroll/config?customerId=$customerId" -Method Put -Body $jsonConfig -Headers $headers
    Write-Host "Integración activada en Backend." -ForegroundColor Green
}
catch {
    Write-Host "Error config: $($_.Exception.Message)" -ForegroundColor Red
}


# 3. Crear Periodo 4 (Siguiente Quincena Simulada)
Write-Host "`n3. Creando Periodo 4 (Simulación)..." -ForegroundColor Cyan
# Asumimos fechas ficticias para pruebas
$periodPayload = @{
    periodName   = "Quincena 2 Febrero 2025 (Simulada)"
    startDate    = "2025-02-16"
    endDate      = "2025-02-28"
    paymentDate  = "2025-02-28"
    year         = 2025
    periodNumber = 4
    status       = "OPEN"
    customerId   = $customerId
} | ConvertTo-Json

try {
    $periodResponse = Invoke-RestMethod -Uri "$baseUrl/api/hr/periods?customerId=$customerId" -Method Post -Body $periodPayload -Headers $headers
    $newPeriodId = $periodResponse.id
    Write-Host "Periodo creado ID: $newPeriodId" -ForegroundColor Green
}
catch {
    Write-Host "Error creando periodo (quizas ya existe): $($_.Exception.Message)" -ForegroundColor Yellow
    # Intentamos obtenerlo si falló
    # Por simplicidad, asumimos ID 4 o buscamos el ultimo
    $periods = Invoke-RestMethod -Uri "$baseUrl/api/hr/periods?customerId=$customerId&size=1" -Method Get -Headers $headers
    $newPeriodId = $periods.content[0].id
    Write-Host "Usando Periodo ID: $newPeriodId" -ForegroundColor Yellow
}

# 4. Liquidar Periodo
Write-Host "`n4. Liquidando Periodo $newPeriodId..." -ForegroundColor Cyan
$liquidateUrl = "$baseUrl/api/hr/payroll/periods/$newPeriodId/liquidate?customerId=$customerId"
try {
    $liqResponse = Invoke-RestMethod -Uri $liquidateUrl -Method Post -Headers $headers
    Write-Host "Liquidación completada." -ForegroundColor Green
    Write-Host "Recibos generados: $($liqResponse.receipts.Count)" -ForegroundColor Green
}
catch {
    Write-Host "Error liquidando: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body" -ForegroundColor Red
    }
    catch {}
}

# 5. Verificar Comprobante Contable
Write-Host "`n5. Verificando Comprobantes Contables..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
try {
    # NOTA: El controller no tiene prefijo /api en el RequestMapping
    $vouchers = Invoke-RestMethod -Uri "$baseUrl/accounting/vouchers?tenantId=$customerId" -Method Get -Headers $headers
    
    # Buscar voucher relacionado con la nómina reciente
    $payrollVoucher = $vouchers | Where-Object { $_.description -match "Nómina" } | Select-Object -Last 1
    
    if ($payrollVoucher) {
        Write-Host "¡EXITO! Comprobante encontrado:" -ForegroundColor Green
        Write-Host "ID: $($payrollVoucher.id)" 
        Write-Host "Numero: $($payrollVoucher.voucherNumber)"
        Write-Host "Descripcion: $($payrollVoucher.description)"
        Write-Host "Total Debito: $($payrollVoucher.totalDebit)"
        Write-Host "Total Credito: $($payrollVoucher.totalCredit)"
    }
    else {
        Write-Host "ADVERTENCIA: No se encontró comprobante de nómina reciente." -ForegroundColor Yellow
        Write-Host "Lista de últimos vouchers:"
        $vouchers | Select-Object id, description, totalDebit | Format-Table
    }

}
catch {
    Write-Host "Error consultando vouchers: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        Write-Host "Response Body: $body" -ForegroundColor Red
    }
    catch {}
}

Write-Host "`n*** FIN SIMULACION ***" -ForegroundColor Magenta
