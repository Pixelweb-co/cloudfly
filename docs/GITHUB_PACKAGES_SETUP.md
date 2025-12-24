# 📦 Configuración de GitHub Packages para CloudFly Backend

Esta guía te ayudará a publicar el backend de CloudFly en GitHub Packages.

## 📋 Requisitos Previos

1. Una cuenta de GitHub con acceso al repositorio `Pixelweb-co/cloudfly`
2. Maven instalado en tu sistema
3. Un Personal Access Token (classic) de GitHub con los permisos necesarios

---

## 🔑 Paso 1: Crear Personal Access Token

1. Ve a GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Haz clic en **"Generate new token (classic)"**
3. Dale un nombre descriptivo (ej: "CloudFly Maven Deploy")
4. Selecciona los siguientes scopes:
   - ✅ `write:packages` - Para publicar paquetes
   - ✅ `read:packages` - Para instalar paquetes
   - ✅ `delete:packages` - Para eliminar paquetes (opcional)
   - ✅ `repo` - Acceso al repositorio
5. Haz clic en **"Generate token"**
6. **⚠️ IMPORTANTE**: Copia el token inmediatamente, no podrás verlo de nuevo

---

## ⚙️ Paso 2: Configurar Maven Settings

### En Windows:

1. Ubica o crea el archivo de configuración de Maven:
   ```
   C:\Users\TU_USUARIO\.m2\settings.xml
   ```

2. Si no existe, crea el directorio `.m2`:
   ```powershell
   mkdir $env:USERPROFILE\.m2
   ```

3. Copia el contenido del archivo de ejemplo:
   ```powershell
   cp backend\.mvn\settings.xml.example $env:USERPROFILE\.m2\settings.xml
   ```

4. Edita `C:\Users\TU_USUARIO\.m2\settings.xml` y reemplaza:
   - `YOUR_GITHUB_USERNAME` → Tu nombre de usuario de GitHub
   - `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN` → El token que generaste en el Paso 1

### Ejemplo de configuración:

```xml
<servers>
  <server>
    <id>github</id>
    <username>edwin-cloudfly</username>
    <password>ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</password>
  </server>
</servers>
```

---

## 🚀 Paso 3: Publicar el Paquete

Una vez configurado el `settings.xml`, puedes publicar tu paquete:

### Desde la línea de comandos:

```powershell
# Navega al directorio del backend
cd backend

# Compila y publica el paquete
mvn clean deploy
```

### Desde Docker (si usas docker-compose):

```powershell
# Construir la imagen del backend
docker-compose build backend

# O reconstruir sin caché
docker-compose build --no-cache backend
```

---

## 📦 Paso 4: Verificar la Publicación

1. Ve a tu repositorio en GitHub: `https://github.com/Pixelweb-co/cloudfly`
2. Haz clic en la pestaña **"Packages"** (en el lado derecho)
3. Deberías ver el paquete `com.app:starter1` con la versión `0.0.1-SNAPSHOT`

---

## 📥 Paso 5: Instalar el Paquete en Otros Proyectos

Para usar este paquete en otros proyectos, agrega la dependencia en el `pom.xml`:

```xml
<dependencies>
  <dependency>
    <groupId>com.app</groupId>
    <artifactId>starter1</artifactId>
    <version>0.0.1-SNAPSHOT</version>
  </dependency>
</dependencies>
```

Y asegúrate de tener el repositorio configurado:

```xml
<repositories>
  <repository>
    <id>github</id>
    <url>https://maven.pkg.github.com/Pixelweb-co/cloudfly</url>
    <snapshots>
      <enabled>true</enabled>
    </snapshots>
  </repository>
</repositories>
```

---

## 🎯 Información del Paquete

- **GroupId**: `com.app`
- **ArtifactId**: `starter1`
- **Version**: `0.0.1-SNAPSHOT`
- **Registro**: `https://maven.pkg.github.com/Pixelweb-co/cloudfly`

---

## ⚠️ Notas Importantes

### 1. Convención de Nomenclatura

GitHub Packages **requiere** que el `artifactId` solo contenga:
- ✅ Letras minúsculas
- ✅ Dígitos
- ✅ Guiones (-)

❌ **NO usar**:
- Letras mayúsculas
- Guiones bajos (_)
- Caracteres especiales

**Nota**: Actualmente tu `artifactId` es `starter1` que cumple con estas reglas. Si lo cambias en el futuro, asegúrate de seguir estas convenciones.

### 2. Versiones SNAPSHOT

Las versiones `SNAPSHOT` son para desarrollo:
- Se actualizan automáticamente
- No son versiones estables
- Útiles para integración continua

Para producción, usa versiones estables (ej: `1.0.0`, `1.0.1`, etc.)

### 3. Seguridad del Token

- ❌ **NUNCA** hagas commit del archivo `settings.xml` con tu token
- ❌ **NUNCA** compartas tu Personal Access Token
- ✅ Usa variables de entorno en CI/CD
- ✅ Rota tus tokens periódicamente

### 4. GitHub Actions

Para publicar automáticamente en GitHub Actions, usa `GITHUB_TOKEN`:

```yaml
- name: Publish to GitHub Packages
  run: mvn deploy
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 🔧 Solución de Problemas

### Error 401 Unauthorized

- Verifica que tu token tenga los permisos correctos
- Asegúrate de que el `<id>` en `settings.xml` coincida con el `<id>` en `pom.xml` (ambos deben ser `github`)

### Error 422 Unprocessable Entity

- Verifica que el `artifactId` solo contenga letras minúsculas, dígitos o guiones
- Revisa que no haya caracteres especiales en el nombre

### Error 404 Not Found

- Verifica que la URL del repositorio sea correcta
- Asegúrate de tener acceso al repositorio `Pixelweb-co/cloudfly`

---

## 📚 Recursos Adicionales

- [GitHub Packages Documentation](https://docs.github.com/es/packages/working-with-a-github-packages-registry/working-with-the-apache-maven-registry)
- [Maven Settings Reference](https://maven.apache.org/settings.html)
- [Maven Deploy Plugin](https://maven.apache.org/plugins/maven-deploy-plugin/)

---

## ✅ Checklist de Configuración

- [ ] Personal Access Token creado con permisos adecuados
- [ ] Archivo `~/.m2/settings.xml` configurado
- [ ] Credenciales de GitHub actualizadas en settings.xml
- [ ] `pom.xml` tiene la sección `<distributionManagement>`
- [ ] Primera publicación exitosa con `mvn deploy`
- [ ] Paquete visible en GitHub Packages

---

**¡Todo listo!** 🎉 Ahora puedes publicar y compartir tu backend de CloudFly a través de GitHub Packages.
