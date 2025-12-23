# CloudFly POS Desktop

Aplicación de escritorio para Punto de Venta (POS) desarrollada en JavaFX 21.

## 🎯 Estado del Proyecto

**Versión:** 1.0.0-SNAPSHOT  
**Última actualización:** 2025-12-11

### ✅ Completado
- Login con autenticación JWT
- Pantalla principal básica funcional
- Sistema de carrito de compras
- Cálculo de totales
- Integración con backend CloudFly

### 🚧 En Desarrollo
Ver `ESPECIFICACION_POS_DESKTOP.md` para detalles completos.

## 🚀 Inicio Rápido

### Requisitos
- Java 17 o superior
- Maven 3.8+
- Backend CloudFly corriendo

### Ejecutar
```bash
# Compilar y ejecutar
mvn clean compile javafx:run

# Ejecutar en modo local (localhost)
mvn javafx:run -Denv=local

# Generar JAR ejecutable
mvn clean package
java -jar target/pos-desktop-1.0.0.jar
```

### Configuración

La aplicación se conecta por defecto a:
- **Producción:** `https://api.cloudfly.com.co/`
- **Local:** `http://localhost:8080/`

Para cambiar el ambiente, usar la variable `-Denv=local`.

## 📁 Estructura del Proyecto

```
POS/
├── src/main/java/com/cloudfly/pos/
│   ├── Main.java                    # Punto de entrada
│   ├── controllers/
│   │   ├── LoginController.java     # ✅ Completado
│   │   └── POSController.java       # ✅ Completado
│   ├── models/
│   │   ├── Product.java             # ✅ Completado
│   │   ├── OrderItem.java           # ✅ Completado
│   │   └── User.java                # ✅ Completado
│   ├── services/
│   │   ├── AuthService.java         # ✅ Completado
│   │   └── api/ApiService.java      # ✅ Completado
│   └── utils/
│       └── SessionManager.java      # ✅ Completado
├── src/main/resources/
│   ├── fxml/
│   │   ├── login.fxml               # ✅ Completado
│   │   └── pos.fxml                 # ✅ Completado
│   └── css/
│       └── styles.css               # ✅ Completado
└── pom.xml
```

## 🔑 Credenciales de Prueba

```
Usuario: edwing2022
Contraseña: [configurada en el backend]
```

## 📖 Documentación

- **Especificación Completa:** `ESPECIFICACION_POS_DESKTOP.md`
- **API Reference:** Ver backend CloudFly
- **Diseño UI:** Basado en `frontend/src/views/apps/pos/`

## 🛠️ Tecnologías

- **JavaFX 21** - Framework UI
- **Retrofit 2.11** - Cliente HTTP
- **OkHttp 4.12** - HTTP client
- **Lombok** - Reducción de boilerplate
- **Gson** - Serialización JSON
- **JWT** - Autenticación

## 📝 Próximos Pasos

1. Implementar header completo con información de factura
2. Agregar búsqueda por código de barras
3. Crear modal de métodos de pago
4. Implementar selector de clientes
5. Agregar teclado de funciones

Ver checklist completo en `ESPECIFICACION_POS_DESKTOP.md`.

## 🐛 Problemas Conocidos

- ~~JavaFX runtime components missing~~ ✅ Resuelto
- ~~FXML loading errors~~ ✅ Resuelto
- ~~JWT sin roles~~ ✅ Resuelto

## 📞 Soporte

Para dudas o problemas, consultar:
- Especificación técnica: `ESPECIFICACION_POS_DESKTOP.md`
- Backend API: `backend/README.md`
- Frontend Web: `frontend/src/views/apps/pos/`

---

**Desarrollado por:** CloudFly Team  
**Licencia:** Propietaria
