# Debug Order Creation
Write-Host "Re-inserting contact..."
docker exec mysql mysql -u root -pwidowmaker cloud_master -e "DELETE FROM contacts WHERE id=99; INSERT INTO contacts (id, name, email, type, tenant_id, created_at, is_active) VALUES (99, 'Camila Debug', 'camila@debug.com', 'CUSTOMER', 1, NOW(), 1);"

Write-Host "Logging in..."
$loginBody = @{ username = "edwing2022"; password = "Edwin2025*" } | ConvertTo-Json
$token = (Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method POST -ContentType "application/json" -Body $loginBody).jwt
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

Write-Host "Creating Order..."
$orderBody = @{
    tenantId      = 1
    customerId    = 99
    paymentMethod = "CASH"
    items         = @(
        @{ productId = 1; quantity = 1; discount = 0 }
    )
    createdBy     = 1
} | ConvertTo-Json

try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/orders" -Method POST -Headers $headers -Body $orderBody
    Write-Host "SUCCESS: $($res | ConvertTo-Json)" -ForegroundColor Green
}
catch {
    Write-Host "ERROR 500 RECEIVED" -ForegroundColor Red
    # Leer el stream de error para ver el mensaje JSON real del backend
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host "Backend Error Details: $errorBody" -ForegroundColor Yellow
}
