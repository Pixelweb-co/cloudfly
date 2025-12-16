
# URL base de la API
$baseUrl = "http://localhost:8080"

# Credenciales de usuario (ajusta según tu DB)
$username = "edwing2022"
$password = "Edwin2025*"

# 1. Login para obtener token
echo "----------------------------------------"
echo "1. Intentando Login..."
$loginPayload = @{
    username = $username
    password = $password
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
    $token = $loginResponse.jwt
    echo "Login Exitoso. Token obtenido."
    # echo "Token: $token"
}
catch {
    echo "Error en Login:"
    echo $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        echo $reader.ReadToEnd()
    }
    exit
}

# 2. Consultar Cotizaciones por Tenant 1
echo "----------------------------------------"
echo "2. Consultando Cotizaciones (Tenant 1)..."
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $quotes = Invoke-RestMethod -Uri "$baseUrl/quotes/tenant/1" -Method Get -Headers $headers
    echo "Cotizaciones encontradas: $($quotes.Count)"
    if ($quotes.Count -gt 0) {
        echo "Primera cotizacion:"
        echo ($quotes[0] | ConvertTo-Json -Depth 5)
    }
    else {
        echo "La lista de cotizaciones esta vacia."
    }
}
catch {
    echo "Error consultando cotizaciones:"
    echo $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        echo $reader.ReadToEnd()
    }
}
