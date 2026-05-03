# Guía de Depuración y Despliegue Rápido en VPS - CloudFly

Esta guía detalla el flujo de trabajo para probar cambios en tiempo real en el VPS antes de generar las imágenes de producción definitivas.

## 1. Flujo de Trabajo de Prueba Rápida (Frontend)

Para evitar esperar los 10 minutos que toma el build de producción de Next.js, utiliza el contenedor `frontend-dev`.

### Paso A: Actualizar Código
Conéctate por SSH al VPS y ejecuta:
```bash
cd /apps/cloudfly
git pull origin main
```

### Paso B: Iniciar el Entorno de Desarrollo
Si el contenedor no está corriendo, inícialo:
```bash
docker compose -f docker-compose-full-vps.yml up -d frontend-dev
```

### Paso C: Verificar en el Navegador
Accede a: `http://dashboard.cloudfly.com.co:5420`
*   **Ventaja**: Los cambios que descargaste con el `git pull` se reflejarán inmediatamente (Hot Reload).
*   **Nota**: Si agregaste nuevas librerías, el contenedor ejecutará `npm install` automáticamente al iniciar.

---

## 2. Monitoreo de Logs (Backend y Frontend)

Si algo no carga o hay errores 500, revisa los logs en tiempo real:

### Ver logs de un servicio específico:
```bash
docker compose -f docker-compose-full-vps.yml logs -f backend-api
docker compose -f docker-compose-full-vps.yml logs -f frontend-dev
```

### Ver errores de todos los servicios:
```bash
docker compose -f docker-compose-full-vps.yml logs -f --tail 100
```

---

## 3. Comandos Útiles de Mantenimiento

### Reiniciar un servicio colgado:
```bash
docker compose -f docker-compose-full-vps.yml restart backend-api
```

### Limpiar imágenes huérfanas (si el disco se llena):
```bash
docker system prune -f
```

---

## 4. Paso a Producción (Build Final)

Una vez que hayas verificado que todo funciona correctamente en el puerto `5420`, procede a actualizar la versión oficial de producción:

```bash
# Reconstruir la imagen de producción (esto toma tiempo)
docker compose -f docker-compose-full-vps.yml up -d --build frontend-react backend-api
```

### ¿Cuándo usar cada uno?
| Escenario | Contenedor Recomendado | Puerto/URL |
| :--- | :--- | :--- |
| **Prueba de UI rápida** | `frontend-dev` | `:5420` |
| **Depuración de lógica** | `frontend-dev` + logs | `:5420` |
| **Lanzamiento oficial** | `frontend-react` | `dashboard.cloudfly.com.co` |

---

## 5. Solución de Problemas Comunes

1.  **El puerto 5420 no carga**: Verifica el firewall.
    ```bash
    ufw allow 5420/tcp
    ```
2.  **Error de memoria en Node**: Si el build de producción falla por memoria, detén temporalmente el servicio dev:
    ```bash
    docker stop frontend-dev
    ```
3.  **Base de Datos bloqueada**: Si el backend no inicia por "Metadata Lock", reinicia el contenedor de MySQL (con precaución):
    ```bash
    docker restart mysql
    ```
