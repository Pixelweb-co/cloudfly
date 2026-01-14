# 🔧 Solución al Error 500 en n8n

## Problema Identificado

El workflow de n8n estaba enviando el body en formato **"Body Parameters"** en lugar de **"JSON"**, lo cual causaba que el servidor no pudiera parsear correctamente el request.

## Solución Aplicada

He actualizado el workflow con la configuración correcta del nodo HTTP Request:

### Antes (Incorrecto):
```
Body Parameters:
- name: number, value: 1002
- name: customer_name, value: Edwin
...
```

### Después (Correcto):
```
Content Type: JSON
Body Parameters (JSON):
{
  "number": "1002",
  "customer_name": "Edwin",
  "agent_context": "Hola Edwin, te llamamos de la florería...",
  "tenant_id": "2",
  "subject": "Cobro por compra de flores"
}
```

## Pasos para Importar el Workflow Corregido

1. En n8n, elimina el workflow anterior si existe
2. Ve a **Workflows** → **Import from File**
3. Selecciona: `n8n/flores-cobranza-workflow.json` (actualizado)
4. Haz clic en **Import**

## Configuración del Nodo HTTP Request

Asegúrate de que el nodo "POST Llamada" tenga estas configuraciones:

### ✅ Settings correctos:
- **Method**: POST
- **URL**: `http://192.168.255.6:5000/call`
- **Authentication**: None
- **Headers**: 
  - Name: `Content-Type`
  - Value: `application/json`
- **Send Body**: Yes
- **Body Content Type**: JSON
- **JSON Body**: 
  ```json
  {
    "number": "1002",
    "customer_name": "Edwin",
    "agent_context": "Hola Edwin, te llamamos de la florería para recordarte que tienes una compra pendiente de pago por valor de $50,000 pesos por las flores que adquiriste. ¿Podrías confirmar cuándo podrías realizar el pago?",
    "tenant_id": "2",
    "subject": "Cobro por compra de flores"
  }
  ```

## Verificación

### Test desde n8n:
1. Haz clic en "Execute Workflow" manualmente
2. Verifica que el nodo "POST Llamada" devuelva:
   ```json
   {
     "success": true,
     "call_id": "outbound_2_...",
     "status": "ringing",
     "number": "1002"
   }
   ```

### Test desde PowerShell:
```powershell
# Verificar que el API esté activo
Invoke-RestMethod -Uri http://192.168.255.6:5000/health

# Test manual
$payload = @{
    number = "1002"
    customer_name = "Edwin"
    agent_context = "Hola Edwin, te llamamos de la florería..."
    tenant_id = "2"
    subject = "Cobro por compra de flores"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://192.168.255.6:5000/call -Method Post -Body $payload -ContentType "application/json"
```

## Diferencias Clave en el Workflow Actualizado

1. **Nodo HTTP mejorado**: Ahora usa `bodyParametersJson` en lugar de `bodyParameters`
2. **Content-Type explícito**: Header `application/json` configurado
3. **Mejor manejo de errores**: Nodos de logging separados para éxito/error

## Si el error persiste:

1. **Verifica los logs del bot**:
   ```bash
   docker logs ari-bot --tail 100 -f
   ```

2. **Verifica la conectividad**:
   ```powershell
   Test-NetConnection -ComputerName 192.168.255.6 -Port 5000
   ```

3. **Prueba manualmente desde n8n**:
   - Usa el "Execute Node" en lugar de "Execute Workflow"
   - Revisa la respuesta completa del nodo HTTP

## Logs Mejorados

El servidor API ahora muestra traceback completo en caso de errores:
```
❌ API Error: ...
📋 Traceback: ...
```

Esto te ayudará a identificar exactamente qué está fallando.
