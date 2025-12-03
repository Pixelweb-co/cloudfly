# 🔧 Solución al Error 401 en /contacts/tenant/

## Problema Identificado
El archivo `SecurityConfig.java` tiene la configuración correcta para `/contacts/**`, pero se guardó con caracteres de escape literales (`\\r\\n`) que impiden que Spring Boot reconozca correctamente las reglas de seguridad.

## Solución Aplicada
✅ Se corrigió el formato del archivo `SecurityConfig.java`
✅ Las reglas de seguridad para `/contacts/**` están configuradas para todos los roles:
   - GET `/contacts/**` → SUPERADMIN, ADMIN, BIOMEDICAL, USER
   - POST `/contacts/**` → SUPERADMIN, ADMIN, BIOMEDICAL, USER  
   - PUT `/contacts/**` → SUPERADMIN, ADMIN, BIOMEDICAL, USER
   - DELETE `/contacts/**` → SUPERADMIN, ADMIN, BIOMEDICAL, USER

## 🚀 Pasos para Aplicar los Cambios

### Paso 1: Reiniciar el Backend

#### Opción A: Si usas IntelliJ IDEA o Eclipse
1. Haz clic en el botón **Stop** (cuadrado rojo)
2. Haz clic en el botón **Run** (triángulo verde)

#### Opción B: Si usas terminal
1. Ve a la terminal donde está corriendo el backend
2. Presiona **Ctrl+C** para detenerlo
3. Ejecuta nuevamente:
```bash
cd c:\apps\cloudfly\backend
mvn spring-boot:run
```

#### Opción C: Reiniciar proceso por PID
```powershell
# Ver procesos Java
Get-Process | Where-Object {$_.ProcessName -like "*java*"} | Select-Object Id, ProcessName, StartTime

# Detener el proceso (reemplaza 12345 con el PID real)
Stop-Process -Id 12345 -Force

# Iniciar nuevamente
cd c:\apps\cloudfly\backend
mvn spring-boot:run
```

### Paso 2: Verificar que el Backend está Corriendo
```powershell
netstat -ano | findstr :8080
```

Deberías ver:
```
TCP    0.0.0.0:8080           0.0.0.0:0              LISTENING       <PID>
```

### Paso 3: Probar el Endpoint

#### Desde PowerShell:
```powershell
# Login
$body = @{username="edwing2022"; password="Edwin2025*"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8080/auth/login" -Method Post -ContentType "application/json" -Body $body
$token = $response.jwt

# Probar /contacts/tenant/1
$headers = @{Authorization="Bearer $token"}
$contacts = Invoke-RestMethod -Uri "http://localhost:8080/contacts/tenant/1" -Method Get -Headers $headers
Write-Output "Contactos encontrados: $($contacts.Count)"
```

#### Desde el Frontend:
1. Abre el navegador en `http://localhost:3000`
2. Haz login
3. Ve al módulo POS
4. Haz clic en el campo "Cliente"
5. Debe abrir el modal sin error 401

## 🔍 Verificación de la Configuración

El archivo `SecurityConfig.java` ahora tiene las siguientes reglas (líneas ~86-90):

```java
//contacts (clientes POS)
http.requestMatchers(HttpMethod.GET, "/contacts/**").hasAnyRole("SUPERADMIN","ADMIN","BIOMEDICAL","USER");
http.requestMatchers(HttpMethod.PUT, "/contacts/**").hasAnyRole("SUPERADMIN","ADMIN","BIOMEDICAL","USER");
http.requestMatchers(HttpMethod.POST, "/contacts/**").hasAnyRole("SUPERADMIN","ADMIN","BIOMEDICAL","USER");
http.requestMatchers(HttpMethod.DELETE, "/contacts/**").hasAnyRole("SUPERADMIN","ADMIN","BIOMEDICAL","USER");
```

## ❓ Si el Error Persiste

1. **Verifica los logs del backend** al iniciar:
   - Busca errores de compilación
   - Verifica que Spring Security se inicialice correctamente

2. **Verifica tu rol de usuario**:
   - El usuario debe tener uno de estos roles: SUPERADMIN, ADMIN, BIOMEDICAL, o USER
   - Puedes verificar esto en la base de datos:
   ```sql
   SELECT u.username, r.role_enum 
   FROM users u 
   JOIN user_role_table ur ON u.id = ur.user_id 
   JOIN role r ON ur.role_id = r.id 
   WHERE u.username = 'edwing2022';
   ```

3. **Verifica el token JWT**:
   - El token debe ser válido y no haber expirado
   - Haz login nuevamente si es necesario

## ✅ Checklist de Verificación

- [ ] Backend reiniciado exitosamente
- [ ] Backend corriendo en puerto 8080
- [ ] Token JWT válido obtenido del login
- [ ] Request a `/contacts/tenant/1` con token funciona
- [ ] Modal de clientes en el POS abre sin error
- [ ] Se pueden crear clientes desde el POS

---

**Una vez completado el checklist, el error 401 debe estar resuelto** ✅
