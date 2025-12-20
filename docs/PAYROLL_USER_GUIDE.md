# 🚀 GUÍA DE USO - Sistema de Liquidación y Pago de Nómina

**Fecha:** 19 de Diciembre 2025  
**Versión:** 1.0  
**Estado:** ✅ Totalmente Funcional

---

## 📋 REQUISITOS PREVIOS

### 1. Evolution API (WhatsApp)
Asegúrate de que Evolution API esté corriendo:
```bash
# Verificar estado
curl http://localhost:8081/instance/fetchInstances

# Debe mostrar la instancia "gm2" conectada
```

### 2. Backend
```bash
cd c:\apps\cloudfly\backend
mvn spring-boot:run

# Debe estar corriendo en http://localhost:8080
```

### 3. Frontend
```bash
cd c:\apps\cloudfly\frontend
npm run dev

# Debe estar corriendo en http://localhost:3000
```

---

## 🎯 FLUJO COMPLETO DE NÓMINA

### PASO 1: Crear Período y Asignar Empleados

1. Ve a **RRHH → Períodos de Nómina**
2. Clic en **"Nuevo Período"**
3. Completa el formulario:
   - Tipo: Quincenal/Mensual
   - Fechas: inicio, fin, pago
   - Selecciona empleados
4. Guarda

**Estado inicial:** `OPEN` 🔵

---

### PASO 2: Registrar Novedades (Opcional)

1. Ve a **RRHH → Novedades de Nómina**
2. Registra horas extras, bonos, incapacidades, etc.
3. Asocia cada novedad al período correspondiente

**Tipos de novedades:**
- ✅ Horas extras (diurnas, nocturnas, dominicales)
- ✅ Bonificaciones
- ✅ Comisiones
- ✅ Incapacidades
- ✅ Deducciones

---

### PASO 3: Liquidar el Período

1. Ve a **RRHH → Períodos de Nómina**
2. Clic en el período que quieres liquidar
3. Verifica la información
4. Clic en **"💰 Liquidar Período"**

**¿Qué hace?**
- ✅ Calcula el salario de cada empleado
- ✅ Aplica las novedades registradas
- ✅ Genera un recibo para cada empleado
- ✅ Marca las novedades como procesadas
- ✅ Cambia el estado del período a `LIQUIDATED`

**Resultado:**
```
✅ Período liquidado: 6 recibos generados para 6 empleados
```

**Estado nuevo:** `LIQUIDATED` 🟡

---

### PASO 4: Pagar Empleados Individualmente

Después de liquidar, verás:
- 📊 Progress bar de pagos (ej: 2/6 pagados - 33%)
- 💰 Totales: Nómina total, Pagado, Pendiente
- 📋 Tabla con todos los empleados y su estado

**Para pagar un empleado:**

1. Encuentra el empleado en la tabla
2. Clic en **"Pagar"** (botón verde)
3. En el diálogo que aparece:
   - **Referencia de pago:** Ej: `TRX-2025-001`, `Transferencia Bancolombia`
   - **Método de pago:** Transferencia/Efectivo/Cheque
   - **Notas:** (opcional) Observaciones adicionales
4. Clic en **"Confirmar Pago"**

**¿Qué hace?**
- ✅ Marca el recibo como `PAID`
- ✅ Genera PDF del desprendible
- ✅ **Envía WhatsApp automático al empleado** 📱
- ✅ Envía email complementario 📧
- ✅ Actualiza el progress bar
- ✅ Si es el último empleado → Período pasa a `PAID` automáticamente

**Notificación WhatsApp enviada:**
```
✅ *¡Pago de Nómina Realizado!*

Hola Juan Pérez,

Te informamos que se ha realizado el pago de tu nómina 
correspondiente al período:

📅 *Período:* Quincenal 1 /2025
💰 *Monto pagado:* $450,000 COP

Tu desprendible de nómina está adjunto en este mensaje.

Si tienes alguna pregunta, no dudes en contactarnos.

_Mensaje automático - No responder_

[PDF Adjunto: Desprendible_Nomina.pdf]
```

**Estado:** `PARTIALLY_PAID` 🟠 (mientras haya pendientes)

---

### PASO 5: Completar Todos los Pagos

Repite el PASO 4 para cada empleado pendiente.

**Cuando pagas al último empleado:**
- ✅ El período cambia automáticamente a `PAID` 🟢
- ✅ Progress bar llega al 100%
- ✅ Todos los botones "Pagar" desaparecen
- ✅ Aparecen botones "Ver Recibo" para cada empleado

**Estado final:** `PAID` 🟢

---

## 📱 NOTIFICACIONES POR WHATSAPP

### Requisitos del Empleado

Para que un empleado reciba WhatsApp:
- ✅ Debe tener número de teléfono registrado en su perfil
- ✅ El número puede estar en formato local (ej: `3001234567`) o internacional (ej: `573001234567`)
- ✅ El sistema automáticamente agrega el código de país (57) si hace falta

### Formatos Aceptados

Todos estos formatos funcionan:
```
3001234567          → Se convierte a: 573001234567
57 300 123 4567     → Se convierte a: 573001234567  
+57 300 123 4567    → Se convierte a: 573001234567
(300) 123-4567      → Se convierte a: 573001234567
```

### Fallback a Email

Si el empleado NO tiene teléfono:
- ⚠️  Se registra un warning en el log
- ✅ Se intenta enviar por email (si tiene configurado)

---

## 🧪 PRUEBAS CON SCRIPT POWERSHELL

### Opción 1: Usar el Script de Pruebas

```powershell
cd c:\apps\cloudfly
.\test_payroll_liquidation.ps1
```

El script te guía paso a paso:
1. Liquidar un período (te pide el ID)
2. Ver los recibos generados
3. Pagar un recibo (te pide el ID del recibo)

### Opción 2: Pruebas Manuales con cURL

#### Liquidar Período
```bash
curl -X POST "http://localhost:8080/api/hr/payroll/periods/1/liquidate?customerId=1" \
  -H "Content-Type: application/json"
```

#### Pagar Recibo
```bash
curl -X POST "http://localhost:8080/api/hr/payroll/receipts/1/pay?customerId=1" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentReference": "TRX-2025-001",
    "paymentMethod": "TRANSFER",
    "notes": "Pago realizado"
  }'
```

#### Ver Recibos del Período
```bash
curl "http://localhost:8080/api/hr/payroll/periods/1/receipts?customerId=1"
```

---

## 🎨 INTERFAZ DE USUARIO

### Vista del Período Liquidado

La interfaz muestra:

#### 1. **Header**
- Nombre del período
- Estado (badge con color)
- Botón "Liquidar" (si está en OPEN)

#### 2. **Información del Período** (card azul)
- Fecha inicio
- Fecha fin
- Fecha de pago
- Días del período

#### 3. **Progreso de Pagos** (card verde/amarillo)
- Progress bar visual
- Porcentaje completado
- 3 tarjetas con totales:
  - 💼 TOTAL NÓMINA
  - ✅ PAGADO
  - ⏳ PENDIENTE

#### 4. **Tabla de Recibos**
Columnas:
- Empleado (nombre + número de recibo)
- Neto a pagar (en verde)
- Estado (chip con color)
- Acciones:
  - **Botón "Pagar"** (verde) si está PENDING
  - **Botón "Ver Recibo"** (azul) si está PAID

---

## ⚙️ CONFIGURACIÓN

### application.properties (Backend)

```properties
# Evolution API para WhatsApp
evolution.api.url=http://localhost:8081
evolution.api.key=B6D711FCDE4D4FD5936544120E713976
```

### Variables de Entorno (Opcional)

```bash
# Si quieres cambiar la instancia de WhatsApp
EVOLUTION_INSTANCE=gm2

# Si Evolution API está en otro servidor
EVOLUTION_API_URL=https://api.evolution.com
EVOLUTION_API_KEY=tu-api-key-aqui
```

---

## 🐛 TROUBLESHOOTING

### Problema: WhatsApp no se envía

**Solución 1:** Verificar Evolution API
```bash
curl http://localhost:8081/instance/fetchInstances

# Debe retornar:
# { "instance": "gm2", "state": "open" }
```

**Solución 2:** Ver logs del backend
```bash
# Busca líneas como:
# ✅ WhatsApp enviado exitosamente a 573001234567
# ⚠️  No se pudo enviar WhatsApp a 573001234567
```

**Solución 3:** Verificar número de teléfono
- Ve al perfil del empleado
- Asegúrate de que tiene teléfono registrado
- Formato correcto: mínimo 10 dígitos

---

### Problema: No aparecen los recibos después de liquidar

**Solución:** Refrescar la página
```
F5 o Ctrl+R
```

Si persiste, verificar en consola del navegador:
```javascript
// Debe mostrar el array de recibos
console.log(receipts)
```

---

### Problema: Error "Period must be in OPEN status"

**Causa:** El período ya fue liquidado

**Solución:** Ese período ya no se puede liquidar de nuevo. Si necesitas modificarlo:
1. Crea un nuevo período
2. O modifica las novedades antes de liquidar

---

## 📊 REPORTES Y ANÁLISIS

### Datos Disponibles

Después de pagar, puedes ver:
- ✅ Total de nómina del período
- ✅ Cuánto se ha pagado
- ✅ Cuánto falta por pagar
- ✅ Progreso en porcentaje
- ✅ Estado de cada empleado
- ✅ Referencias de pago

### Próximamente

- 📄 Exportar a Excel
- 📊 Gráficas de tendencias
- 🧾 Comprobantes contables automáticos
- 📧 Reportes por email

---

## ✅ CHECK LIST DE NÓMINA

Usa esta lista para asegurarte de completar todo:

- [ ] Crear período de nómina
- [ ] Asignar empleados al período
- [ ] Registrar novedades (si aplica)
- [ ] Liquidar el período
- [ ] Verificar recibos generados
- [ ] Pagar cada empleado
- [ ] Verificar que se enviaron WhatsApp
- [ ] Confirmar que el período pasó a PAID
- [ ] Archivar comprobantes de pago
- [ ] (Futuro) Generar asiento contable

---

## 📞 SOPORTE

Si tienes problemas:
1. Revisa esta guía
2. Verifica los logs del backend
3. Revisa la consola del navegador
4. Contacta al equipo de desarrollo

---

**¡Listo! El sistema está 100% funcional y listo para usar.** 🎉

_Última actualización: 19 de Diciembre 2025_
