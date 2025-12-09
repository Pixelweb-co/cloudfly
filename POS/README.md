# CloudFly POS - Aplicación de Escritorio

Aplicación de Punto de Venta (POS) de escritorio desarrollada en JavaFX que se conecta al backend de CloudFly.

## 🚀 Características

- ✅ Autenticación con JWT
- ✅ Interfaz moderna con Material Design
- ✅ Conexión en tiempo real con el backend
- ✅ Gestión de productos
- ✅ Carrito de compras
- ✅ Procesamiento de órdenes
- ✅ Soporte para modo offline (próximamente)

## 📋 Requisitos

- Java 17 o superior
- Maven 3.6+
- Conexión a internet (para conectar con el backend)

## 🛠️ Instalación y Ejecución

### Opción 1: Ejecutar con Maven

```bash
cd POS
mvn clean javafx:run
```

### Opción 2: Compilar JAR ejecutable

```bash
mvn clean package
java -jar target/pos-desktop-1.0.0.jar
```

### Opción 3: Desarrollo con IDE

1. Importar el proyecto como proyecto Maven en IntelliJ IDEA o Eclipse
2. Esperar a que se descarguen las dependencias
3. Ejecutar la clase `com.cloudfly.pos.Main`

## ⚙️ Configuración

### URL del Backend

Por defecto, la aplicación se conecta a:
- **Producción**: `https://api.cloudfly.com.co/`
- **Desarrollo**: `http://localhost:8080/`

Para cambiar entre ambientes, editar `AppConfig.java` o ejecutar con:

```bash
# Para desarrollo local
mvn javafx:run -Denv=local

# Para producción
mvn javafx:run -Denv=production
```

## 📁 Estructura del Proyecto

```
POS/
├── src/main/
│   ├── java/com/cloudfly/pos/
│   │   ├── Main.java                    # Punto de entrada
│   │   ├── config/
│   │   │   └── AppConfig.java          # Configuración global
│   │   ├── controllers/
│   │   │   ├── LoginController.java    # Control de login
│   │   │   └── POSController.java      # Control del POS
│   │   ├── models/
│   │   │   ├── User.java               # Modelo de usuario
│   │   │   ├── Product.java            # Modelo de producto
│   │   │   └── dto/                    # DTOs para API
│   │   ├── services/
│   │   │   ├── AuthService.java        # Servicio de autenticación
│   │   │   └── api/
│   │   │       ├── ApiService.java     # Interface API
│   │   │       └── ApiClient.java      # Cliente Retrofit
│   │   └── utils/
│   │       └── SessionManager.java     # Gestor de sesión
│   └── resources/
│       ├── fxml/
│       │   ├── login.fxml              # Vista de login
│       │   └── pos.fxml                # Vista del POS
│       └── css/
│           └── styles.css              # Estilos
└── pom.xml                             # Configuración Maven
```

## 🔐 Uso

### 1. Login

Al iniciar la aplicación, ingresa tus credenciales de CloudFly:
- **Usuario**: Tu nombre de usuario
- **Contraseña**: Tu contraseña

### 2. Pantalla Principal (POS)

Después del login exitoso, accederás a la pantalla principal donde podrás:
- Búsqueda de productos
- Agregar productos al carrito
- Procesar ventas
- Ver historial

## 🔧 Desarrollo

### Agregar Nuevas Funcionalidades

1. **Nuevos Endpoints API**: Agregar en `ApiService.java`
2. **Nuevas Vistas**: Crear FXML en `resources/fxml/`
3. **Estilos**: Modificar `resources/css/styles.css`

### Debug

Los logs de la aplicación y las peticiones HTTP se mostrarán en la consola durante el desarrollo.

## 📦 Distribución

Para crear un ejecutable nativo:

```bash
# Crear imagen nativa con jpackage (Java 17+)
jpackage --input target --name CloudFlyPOS \
  --main-jar pos-desktop-1.0.0.jar \
  --main-class com.cloudfly.pos.Main \
  --type exe
```

## 🐛 Solución de Problemas

### Error de conexión al backend

- Verificar que el backend esté corriendo
- Verificar la URL en `AppConfig.java`
- Revisar firewall y proxy

### No se cargan las vistas FXML

- Verificar la ruta en `FXMLLoader`
- Asegurarse de que los archivos FXML estén en `resources/fxml/`

## 📝 Próximas Funcionalidades

- [ ] Modo offline con sincronización
- [ ] Impresión de tickets
- [ ] Soporte para escáner de código de barras
- [ ] Reportes y estadísticas
- [ ] Multi-terminal

## 👥 Autor

CloudFly Development Team

## 📄 Licencia

Propiedad de CloudFly © 2025
