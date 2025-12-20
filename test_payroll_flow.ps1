$ErrorActionPreference = "Stop"

# Configuración
$BaseUrl = "http://localhost:8080/api"
$AuthUrl = "http://localhost:8080/auth/login"
$Username = "edwing2022"
$Password = "Edwin2025*"

Write-Host "=== INICIANDO PRUEBA DE FLUJO DE NÓMINA COLOMBIANA ===" -ForegroundColor Cyan

# 1. Autenticación
Write-Host "`n1. Autenticando..." -NoNewline
try {
    $LoginBody = @{
        username = $Username
        password = $Password
    } | ConvertTo-Json

    $LoginResponse = Invoke-RestMethod -Uri $AuthUrl -Method Post -Body $LoginBody -ContentType "application/json"
    $Token = $LoginResponse.accessToken
    Write-Host " [OK]" -ForegroundColor Green
}
catch {
    Write-Host " [ERROR]" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

$Headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type"  = "application/json"
}

# 2. Listar Periodos
Write-Host "`n2. Listando Periodos de Nómina..." -NoNewline
try {
    $Periods = Invoke-RestMethod -Uri "$BaseUrl/hr/periods?customerId=1" -Method Get -Headers $Headers
    $PeriodCount = $Periods.content.Count
    Write-Host " [OK] Encontrados: $PeriodCount periodos" -ForegroundColor Green
    
    if ($PeriodCount -eq 0) {
        Write-Host "No hay periodos para probar liquidación. Crea uno en la interfaz." -ForegroundColor Yellow
        exit
    }

    # Tomar el primer periodo disponible
    $PeriodId = $Periods.content[0].id
    $PeriodName = $Periods.content[0].periodName
    Write-Host "   -> Usando Periodo: $PeriodName (ID: $PeriodId)" -ForegroundColor Gray

}
catch {
    Write-Host " [ERROR]" -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

# 3. Listar Recibos (Validar estructura JSON)
Write-Host "`n3. Obteniendo Recibos del Periodo $PeriodId..." -NoNewline
try {
    $Receipts = Invoke-RestMethod -Uri "$BaseUrl/hr/payroll/receipts?periodId=$PeriodId&customerId=1" -Method Get -Headers $Headers
    $ReceiptCount = $Receipts.Count
    Write-Host " [OK] Recibos encontrados: $ReceiptCount" -ForegroundColor Green

    if ($ReceiptCount -gt 0) {
        $SampleReceipt = $Receipts[0]
        Write-Host "`n--- Detalle del Primer Recibo (Validación de Estructura) ---" -ForegroundColor Cyan
        Write-Host "Empleado: $($SampleReceipt.employeeName)"
        Write-Host "Neto a Pagar: $($SampleReceipt.netPay)"
        
        Write-Host "`n[Ingresos/Devengos]" -ForegroundColor Green
        if ($SampleReceipt.devengos) {
            Write-Host "  Salario: $($SampleReceipt.devengos.salario)"
            Write-Host "  Aux. Transporte: $($SampleReceipt.devengos.auxilioTransporte)"
            Write-Host "  Horas Extras: $($SampleReceipt.devengos.horasExtras)"
            Write-Host "  Total Devengado: $($SampleReceipt.totalPerceptions)"
        }
        else {
            Write-Host "  [ALERTA] Objeto 'devengos' no encontrado o nulo." -ForegroundColor Red
        }

        Write-Host "`n[Deducciones]" -ForegroundColor Red
        if ($SampleReceipt.deducciones) {
            Write-Host "  Salud (4%): $($SampleReceipt.deducciones.salud)"
            Write-Host "  Pensión (4%): $($SampleReceipt.deducciones.pension)"
            Write-Host "  Total Deducido: $($SampleReceipt.totalDeductions)"
        }
        else {
            Write-Host "  [ALERTA] Objeto 'deducciones' no encontrado o nulo." -ForegroundColor Red
        }

        Write-Host "`n[Provisiones Empresa]" -ForegroundColor Yellow
        if ($SampleReceipt.provisiones) {
            Write-Host "  Cesantías: $($SampleReceipt.provisiones.cesantias)"
            Write-Host "  Prima: $($SampleReceipt.provisiones.prima)"
        }
        else {
            Write-Host "  [INFO] Objeto 'provisiones' no encontrado."
        }
    }
    else {
        Write-Host "El periodo no tiene recibos liquidados. Ejecuta la liquidación en la interfaz." -ForegroundColor Yellow
    }

}
catch {
    Write-Host " [ERROR]" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== PRUEBA FINALIZADA ===" -ForegroundColor Cyan
