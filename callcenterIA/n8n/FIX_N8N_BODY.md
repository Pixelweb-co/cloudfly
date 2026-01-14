# 🔴 SOLUCIÓN URGENTE - Error 400/500 en n8n

## ❌ EL PROBLEMA

En el nodo **"POST Llamada"** de n8n, estás usando:
- **Body Parameters** (form-data) ❌
- Esto envía: `number=1002&customer_name=Edwin&...`

## ✅ LA SOLUCIÓN

Debes usar:
- **JSON** body ✅  
- Esto envía: `{"number": "1002", "customer_name": "Edwin", ...}`

## 📝 PASOS EXACTOS EN N8N:

### 1. Abre el nodo "POST Llamada"

### 2. En la sección "Body", configura así:

**Send Body**: ✅ ON

**Body Content Type**: Selecciona "**JSON**" (en el dropdown)

**JSON/RAW Parameters**: Pega esto exactamente:

```json
{
  "number": "1002",
  "customer_name": "Edwin",
  "agent_context": "Hola Edwin, te llamamos de la florería para recordarte que tienes una compra pendiente de pago por valor de $50,000 pesos por las flores que adquiriste. ¿Podrías confirmar cuándo podrías realizar el pago?",
  "tenant_id": "2",
  "subject": "Cobro por compra de flores"
}
```

### 3. Headers

Asegúrate que en **Headers** tengas:
- Name: `Content-Type`
- Value: `application/json`

## 🎯 COMPARACIÓN VISUAL

### ❌ INCORRECTO (Lo que tienes ahora):
```
Body Parameters:
  ☐ name: number, value: 1002
  ☐ name: customer_name, value: Edwin
  ☐ name: agent_context, value: cobro de las flores
```

### ✅ CORRECTO (Lo que necesitas):
```
Body Content Type: JSON
JSON/RAW Parameters:
{
  "number": "1002",
  "customer_name": "Edwin",
  "agent_context": "Hola Edwin, te llamamos de la florería..."
}
```

## 🧪 TEST RÁPIDO

Después de hacer el cambio:

1. Haz clic en **"Execute Node"** (solo ese nodo)
2. Deberías ver en la respuesta:
```json
{
  "success": true,
  "call_id": "outbound_2_...",
  "status": "ringing"
}
```

## 📸 CAPTURA DE PANTALLA

Si aún tienes dudas, en n8n el dropdown debe decir:
```
[Send Body: ON]
[Body Content Type: JSON] <-- Aquí debe decir "JSON"
```

**NO debe decir:**
- ❌ "Form-Data Multipart"
- ❌ "Form URL encoded"  
- ❌ "Raw/Custom"

## 🆘 SI AÚN DA ERROR

Copia y pega esto en PowerShell para verificar que el API funciona:

```powershell
$body = @{
    number = "1002"
    customer_name = "Edwin"
    agent_context = "Test desde PowerShell"
    tenant_id = "2"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://192.168.255.6:5000/call -Method Post -Body $body -ContentType "application/json"
```

Si esto funciona desde PowerShell pero no desde n8n, el problema es 100% la configuración del nodo HTTP.
