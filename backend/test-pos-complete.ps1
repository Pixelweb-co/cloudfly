# Script de Prueba Completa - Sistema POS
# Ejecutar después de reiniciar el backend

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  PRUEBA COMPLETA DEL SISTEMA POS" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Login
Write-Host "PASO 1: Autenticación" -ForegroundColor Yellow
$loginBody = @{
    username = "edwing2022"
    password = "Edwin2025*"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody
    
    $token = $loginResponse.jwt
    $headers = @{Authorization = "Bearer $token"}
    Write-Host "✅ Login exitoso!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Error en login: $_" -ForegroundColor Red
    exit
}

# Paso 2: Obtener productos
Write-Host "PASO 2: Obteniendo productos disponibles" -ForegroundColor Yellow
try {
    $productos = Invoke-RestMethod -Uri "http://localhost:8080/productos/tenant/1" `
        -Method Get `
        -Headers $headers
    
    Write-Host "✅ Productos encontrados: $($productos.Count)" -ForegroundColor Green
    $producto = $productos[0]
    Write-Host "  - Producto seleccionado:" -ForegroundColor Cyan
    Write-Host "    ID: $($producto.id)" -ForegroundColor White
    Write-Host "    Nombre: $($producto.productName)" -ForegroundColor White
    Write-Host "    Precio: $$($producto.price)" -ForegroundColor White
    Write-Host "    Stock disponible: $($producto.inventoryQty)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Error obteniendo productos: $_" -ForegroundColor Red
    exit
}

# Paso 3: Crear un cliente
Write-Host "PASO 3: Creando cliente de prueba" -ForegroundColor Yellow
$contactBody = @{
    name = "Carlos Mendoza - Prueba POS"
    email = "carlos.prueba@test.com"
    phone = "555-4321"
    address = "Av. Siempre Viva 742"
    taxId = "11223344-5"
    type = "CUSTOMER"
    tenantId = 1
} | ConvertTo-Json

try {
    $newContact = Invoke-RestMethod -Uri "http://localhost:8080/contacts" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $contactBody
    
    Write-Host "✅ Cliente creado exitosamente!" -ForegroundColor Green
    Write-Host "  - ID: $($newContact.id)" -ForegroundColor Cyan
    Write-Host "  - Nombre: $($newContact.name)" -ForegroundColor White
    Write-Host "  - Tipo: $($newContact.type)" -ForegroundColor White
    Write-Host ""
    $customerId = $newContact.id
} catch {
    Write-Host "⚠️  No se pudo crear el cliente (puede que ya exista)" -ForegroundColor Yellow
    Write-Host "Intentando obtener clientes existentes..." -ForegroundColor Yellow
    
    try {
        $contacts = Invoke-RestMethod -Uri "http://localhost:8080/contacts/tenant/1" `
            -Method Get `
            -Headers $headers
        
        if ($contacts.Count -gt 0) {
            $newContact = $contacts[0]
            $customerId = $newContact.id
            Write-Host "✅ Usando cliente existente: $($newContact.name) (ID: $customerId)" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host "ℹ️  No hay clientes. Continuando sin cliente (venta mostrador)..." -ForegroundColor Cyan
            $customerId = $null
            Write-Host ""
        }
    } catch {
        Write-Host "ℹ️  Continuando sin cliente (venta mostrador)..." -ForegroundColor Cyan
        $customerId = $null
        Write-Host ""
    }
}

# Paso 4: Crear una orden
Write-Host "PASO 4: Creando orden de venta" -ForegroundColor Yellow
$orderBody = @{
    tenantId = 1
    customerId = $customerId
    items = @(
        @{
            productId = $producto.id
            quantity = 2
            discount = 0
        }
    )
    paymentMethod = "CASH"
    tax = 0
    discount = 0
} | ConvertTo-Json -Depth 10

Write-Host "  Datos de la orden:" -ForegroundColor Cyan
Write-Host "    TenantId: 1" -ForegroundColor White
Write-Host "    CustomerId: $customerId" -ForegroundColor White
Write-Host "    Producto: $($producto.productName) x2" -ForegroundColor White
Write-Host "    Método de pago: CASH" -ForegroundColor White
Write-Host ""

try {
    $order = Invoke-RestMethod -Uri "http://localhost:8080/orders" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $orderBody
    
    Write-Host "✅ ¡ORDEN CREADA EXITOSAMENTE!" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  DETALLES DE LA ORDEN" -ForegroundColor Cyan
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  ID de Orden: $($order.id)" -ForegroundColor White
    Write-Host "  Número de Factura: $($order.invoiceNumber)" -ForegroundColor Yellow -BackgroundColor DarkGreen
    Write-Host "  Estado: $($order.status)" -ForegroundColor White
    Write-Host "  Subtotal: $$($order.subtotal)" -ForegroundColor White
    Write-Host "  Impuesto: $$($order.tax)" -ForegroundColor White
    Write-Host "  Descuento: $$($order.discount)" -ForegroundColor White
    Write-Host "  TOTAL: $$($order.total)" -ForegroundColor Yellow -BackgroundColor DarkGreen
    Write-Host "  Método de pago: $($order.paymentMethod)" -ForegroundColor White
    Write-Host "  Fecha: $($order.createdAt)" -ForegroundColor White
    Write-Host ""
    Write-Host "  Items:" -ForegroundColor Cyan
    foreach ($item in $order.items) {
        Write-Host "    - $($item.productName)" -ForegroundColor White
        Write-Host "      Cantidad: $($item.quantity)" -ForegroundColor White
        Write-Host "      Precio unitario: $$($item.unitPrice)" -ForegroundColor White
        Write-Host "      Subtotal: $$($item.subtotal)" -ForegroundColor White
    }
    Write-Host ""
    
    # Paso 5: Verificar que la orden se guardó
    Write-Host "PASO 5: Verificando la orden creada" -ForegroundColor Yellow
    $orderCheck = Invoke-RestMethod -Uri "http://localhost:8080/orders/$($order.id)" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ Orden verificada correctamente!" -ForegroundColor Green
    Write-Host ""
    
    # Paso 6: Listar todas las órdenes del tenant
    Write-Host "PASO 6: Listando todas las órdenes del tenant" -ForegroundColor Yellow
    $allOrders = Invoke-RestMethod -Uri "http://localhost:8080/orders/tenant/1" `
        -Method Get `
        -Headers $headers
    Write-Host "✅ Total de órdenes: $($allOrders.Count)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "  ✅ PRUEBA COMPLETADA EXITOSAMENTE" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error creando la orden:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    # Intentar obtener más detalles del error
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetalles del error:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Presiona Enter para salir..." -ForegroundColor Cyan
Read-Host
