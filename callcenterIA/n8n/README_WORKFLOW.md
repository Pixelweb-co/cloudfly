# Workflow n8n - Llamadas Automáticas de Cobranza

## 📋 Descripción

Workflow de n8n que realiza llamadas automáticas cada hora para cobro de compra de flores.

## 🎯 Configuración

### Datos de la llamada:
- **Extensión**: 1002
- **Cliente**: Edwin
- **Tenant ID**: 2
- **Monto**: $50,000
- **Concepto**: Compra de flores
- **Frecuencia**: Cada 1 hora

### Red:
- **IP del Bot (OpenVPN)**: 192.168.255.6
- **Puerto API**: 5000
- **Endpoint**: `http://192.168.255.6:5000/call`

## 📦 Nodos del Workflow

### 1. Schedule Trigger
- **Tipo**: Trigger por tiempo
- **Configuración**: Cada 1 hora
- **Función**: Inicia el workflow automáticamente

### 2. Iniciar Llamada (HTTP Request)
- **Método**: POST
- **URL**: `http://192.168.255.6:5000/call`
- **Body**:
  ```json
  {
    "number": "1002",
    "customer_name": "Edwin",
    "agent_context": "Hola Edwin, te llamamos de la florería para recordarte que tienes una compra pendiente de pago por valor de $50,000 pesos por las flores que adquiriste. ¿Podrías confirmar cuándo podrías realizar el pago?",
    "tenant_id": "2",
    "subject": "Cobro por compra de flores"
  }
  ```

### 3. ¿Llamada Exitosa? (IF Node)
- **Condición**: `success == true`
- **True**: Continúa al log exitoso y consulta estado
- **False**: Registra error

### 4. Consultar Estado (HTTP Request)
- **Método**: GET
- **URL**: `http://192.168.255.6:5000/call/{{ call_id }}`
- **Función**: Verifica el estado de la llamada iniciada

### 5. Esperar 10s (Wait Node)
- **Duración**: 10 segundos
- **Función**: Permite que la llamada se establezca antes de finalizar

### 6. Log Exitoso / Log Error
- **Función**: Registra el resultado de la operación

## 🚀 Instalación

### Paso 1: Importar el workflow en n8n

1. Accede a tu instancia de n8n
2. Ve a **Workflows** > **Import**
3. Selecciona el archivo: `flores-cobranza-workflow.json`
4. Haz clic en **Import**

### Paso 2: Verificar la IP

Si tu IP de OpenVPN cambió, actualiza en los nodos HTTP Request:

1. Abre el nodo **"Iniciar Llamada"**
2. Cambia la URL si es necesario: `http://TU_IP_OPENVPN:5000/call`
3. Haz lo mismo en **"Consultar Estado"**

### Paso 3: Activar el workflow

1. Haz clic en el botón **"Active"** en la esquina superior derecha
2. El workflow ahora se ejecutará automáticamente cada hora

## 🧪 Prueba Manual

Antes de activar el trigger automático, puedes probar manualmente:

1. En n8n, haz clic en **"Execute Workflow"**
2. Verifica que la llamada se inicie correctamente
3. Revisa los logs en cada nodo

## 📊 Monitoreo

### Ver ejecuciones
En n8n:
- Ve a **Executions** en el menú lateral
- Verás todas las ejecuciones del workflow con su estado

### Ver llamadas activas
Desde PowerShell o terminal:
```powershell
Invoke-RestMethod -Uri http://192.168.255.6:5000/calls
```

### Ver logs del bot
```bash
docker logs ari-bot -f
```

## ⚙️ Personalización

### Cambiar la frecuencia

Para cambiar la frecuencia de llamadas:

1. Abre el nodo **"Schedule Trigger"**
2. Modifica el intervalo:
   - Cada 30 minutos: `hoursInterval: 0.5`
   - Cada 2 horas: `hoursInterval: 2`
   - Cada día: Cambia a `days` en lugar de `hours`

### Cambiar el mensaje

1. Abre el nodo **"Iniciar Llamada"**
2. Edita el parámetro `agent_context` con el nuevo mensaje

### Añadir más clientes

Para llamar a múltiples clientes en cada ejecución:

1. Agrega un nodo **"Code"** después del Schedule Trigger
2. Crea un array con los datos de cada cliente:
   ```javascript
   return [
     { 
       number: "1002", 
       customer_name: "Edwin",
       amount: 50000,
       tenant_id: "2"
     },
     { 
       number: "1003", 
       customer_name: "Maria",
       amount: 30000,
       tenant_id: "3"
     }
   ];
   ```
3. Conecta a un nodo **"Loop Over Items"**
4. Cada item iniciará una llamada separada

## 🔔 Notificaciones

### Añadir notificación por email en caso de error

1. Agrega un nodo **"Send Email"** después de "Log Error"
2. Configura tu servidor SMTP
3. Define el destinatario y mensaje

### Webhook de notificación

1. Agrega un nodo **"HTTP Request"**
2. Configura una URL de webhook (Slack, Discord, etc.)
3. Envía el estado de la llamada

## 📈 Estadísticas

Para rastrear estadísticas de llamadas:

1. Agrega un nodo **"Google Sheets"** o **"Airtable"**
2. Registra cada llamada con:
   - Fecha/hora
   - Call ID
   - Estado
   - Duración
   - Resultado

## 🛡️ Seguridad

### Recomendaciones:

1. **VPN**: Siempre usa OpenVPN para conectar n8n con el bot
2. **API Key**: Considera añadir autenticación a la API del bot
3. **HTTPS**: Si es posible, usa certificados SSL
4. **Rate Limiting**: No excedas 10 llamadas concurrentes

## 🐛 Troubleshooting

### El workflow no se ejecuta

1. Verifica que el workflow esté **Active**
2. Revisa las **Executions** para ver errores
3. Verifica la conectividad OpenVPN

### Error "Connection refused"

1. Verifica que el bot esté corriendo: `docker ps`
2. Verifica la IP de OpenVPN: `ipconfig`
3. Prueba el ping: `ping 192.168.255.6`
4. Verifica el firewall de Windows

### La llamada no se inicia

1. Verifica logs del bot: `docker logs ari-bot`
2. Verifica que Asterisk esté corriendo
3. Prueba el endpoint manualmente:
   ```powershell
   Invoke-RestMethod -Uri http://192.168.255.6:5000/health
   ```

## 📞 Contacto de Soporte

Para problemas o dudas:
- Revisa la documentación: `API_DOCUMENTATION.md`
- Revisa logs: `docker logs ari-bot`
- Verifica el estado: `http://192.168.255.6:5000/health`

---

**Versión**: 1.0  
**Última actualización**: Enero 2026
