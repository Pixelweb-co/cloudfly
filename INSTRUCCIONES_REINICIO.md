# ⚠️ INSTRUCCIONES PARA REINICIAR Y PROBAR

## 🔄 Paso 1: Reiniciar el Backend

### Opción A: Si estás usando IntelliJ IDEA o Eclipse
1. Detener la aplicación (botón Stop)
2. Volver a ejecutar la aplicación (botón Run)

### Opción B: Si estás usando línea de comandos
```powershell
# Detener el proceso actual (Ctrl+C en la terminal donde corre)
# O ejecutar:
cd c:\apps\cloudfly\backend
mvn spring-boot:run
```

### Opción C: Usando el proceso ID
```powershell
# Ver procesos Java
Get-Process | Where-Object {$_.ProcessName -like "*java*"}

# Detener el proceso (reemplazar PID con el ID correcto)
Stop-Process -Id <PID> -Force

# Iniciar nuevamente
cd c:\apps\cloudfly\backend
mvn spring-boot:run
```

## ✅ Paso 2: Verificar que el Backend está corriendo

```powershell
# Debe mostrar una conexión en el puerto 8080
netstat -ano | findstr :8080
```

Deberías ver algo como:
```
TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       <PID>
```

## 🧪 Paso 3: Ejecutar el Script de Prueba

```powershell
cd c:\apps\cloudfly\backend
.\test-pos-complete.ps1
```

Este script hará:
1. ✅ Login con tus credenciales
2. ✅ Listar productos disponibles
3. ✅ Crear un cliente de prueba
4. ✅ Crear una orden de venta
5. ✅ Verificar que la orden se creó correctamente

## 📊 Resultado Esperado

Si todo funciona correctamente, verás:

```
==================================================
  PRUEBA COMPLETA DEL SISTEMA POS
==================================================

PASO 1: Autenticación
✅ Login exitoso!

PASO 2: Obteniendo productos disponibles
✅ Productos encontrados: 3
  - Producto seleccionado:
    ID: 1
    Nombre: mi producto
    Precio: $100000.00
    Stock disponible: 150

PASO 3: Creando cliente de prueba
✅ Cliente creado exitosamente!
  - ID: 1
  - Nombre: Carlos Mendoza - Prueba POS
  - Tipo: CUSTOMER

PASO 4: Creando orden de venta
✅ ¡ORDEN CREADA EXITOSAMENTE!
==================================================
  DETALLES DE LA ORDEN
==================================================
  ID de Orden: 1
  Número de Factura: INV-1-20250130-00001
  Estado: COMPLETED
  Subtotal: $200000.00
  Impuesto: $0.00
  Descuento: $0.00
  TOTAL: $200000.00
  Método de pago: CASH
  Fecha: 2025-01-30T01:XX:XX

  Items:
    - mi producto
      Cantidad: 2
      Precio unitario: $100000.00
      Subtotal: $200000.00

PASO 5: Verificando la orden creada
✅ Orden verificada correctamente!

PASO 6: Listando todas las órdenes del tenant
✅ Total de órdenes: 1

==================================================
  ✅ PRUEBA COMPLETADA EXITOSAMENTE
==================================================
```

## 🌐 Paso 4 (Alternativo): Probar desde el Frontend

Si prefieres probar desde la interfaz web:

1. Abrir navegador en: `http://localhost:3000`
2. Hacer login con:
   - Usuario: `edwing2022`
   - Contraseña: `Edwin2025*`
3. Navegar al módulo POS
4. Hacer clic en el campo "Cliente" para crear/seleccionar un cliente
5. Buscar o escanear productos
6. Agregar al carrito
7. Hacer clic en un botón de pago (Efectivo, Tarjeta, etc.)
8. Confirmar la venta

## 🔍 Verificar en la Base de Datos

```sql
-- Ver órdenes creadas
SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- Ver items de órdenes
SELECT 
    o.invoice_number,
    o.total,
    oi.product_name,
    oi.quantity,
    oi.unit_price,
    oi.subtotal
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.created_at DESC
LIMIT 10;

-- Ver clientes creados
SELECT * FROM contacts WHERE type = 'CUSTOMER' ORDER BY created_at DESC;
```

## ❌ Troubleshooting

### Error: "Acceso no autorizado"
- **Causa**: SecurityConfig no se actualizó
- **Solución**: Reiniciar el backend

### Error: "Stock insuficiente"
- **Causa**: No hay suficiente inventario
- **Solución**: Aumentar el inventario del producto en la BD o usar otro producto

### Error: "El cliente no pertenece al tenant"
- **Causa**: Intentas usar un cliente de otro tenant
- **Solución**: Crear un nuevo cliente o usar uno del tenant correcto

### Error: "Producto no encontrado"
- **Causa**: El ID del producto no existe
- **Solución**: Verificar que hay productos en la BD para el tenant

---

## 🎯 Checklist de Verificación

Antes de marcar como completado, verificar:

- [ ] Backend reiniciado y corriendo en puerto 8080
- [ ] Frontend corriendo en puerto 3000
- [ ] Script `test-pos-complete.ps1` ejecuta sin errores
- [ ] Se puede crear un cliente desde el POS
- [ ] Se puede crear una orden desde el POS
- [ ] La orden se guarda en la BD
- [ ] El stock se reduce correctamente
- [ ] Se genera un número de factura único
- [ ] Las validaciones funcionan (stock insuficiente, etc.)

---

**Una vez completado el checklist, el sistema POS está 100% funcional** ✅
