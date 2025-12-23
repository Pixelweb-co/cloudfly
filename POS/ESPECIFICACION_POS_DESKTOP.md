# 📋 ESPECIFICACIÓN - CloudFly POS Desktop

## 🎯 Objetivo
Implementar una aplicación de escritorio POS (Punto de Venta) en JavaFX que replique exactamente el diseño y funcionalidades del POS web ubicado en `frontend/src/views/apps/pos/`.

---

## ✅ ESTADO ACTUAL (2025-12-11)

### **Completado:**
- ✅ Autenticación JWT funcionando con backend
- ✅ Login UI centrado y profesional
- ✅ Pantalla principal básica cargando sin errores
- ✅ Estructura de proyecto creada
- ✅ Modelos de datos: Product, OrderItem, User, AuthResponse
- ✅ Servicios: AuthService, ApiService (Retrofit)
- ✅ Controladores: LoginController, POSController
- ✅ Sistema de carrito básico
- ✅ Cálculo de totales (subtotal, descuento, total)
- ✅ 3 productos de ejemplo mostrándose

### **Pendiente:**
- ❌ Panel superior con información completa de factura
- ❌ Búsqueda por código de barras
- ❌ Selector de cliente
- ❌ Métodos de pago (Efectivo, Tarjeta, Transferencia, Otro)
- ❌ Teclado de funciones (botones inferiores)
- ❌ Integración completa con backend API
- ❌ Tabla de transacciones estilizada
- ❌ Diseño visual idéntico al web

---

## 🏗️ ARQUITECTURA DEL POS WEB (Referencia)

### **Ubicación Frontend:**
`frontend/src/views/apps/pos/index.tsx`

### **Componentes Principales:**

#### 1. **PosHeader** (`components/PosHeader.tsx`)
```typescript
Props:
- invoiceNo: string
- lineCount: number
- totalQty: number
- customerName: string
- onCustomerClick: () => void

Muestra:
- N° FACTURA
- FECHA
- LINEAS (cantidad de líneas en carrito)
- CANTIDAD (total de items)
- TIPO VENTA (Retail)
- PAGO (Efectivo/Tarjeta)
- Cliente (nombre + teléfono)
- Tarjeta Puntos
- Botones: Código Producto, Cant, Precio Desc, Total
```

#### 2. **TransactionTable** (`components/TransactionPanel.tsx`)
```typescript
Props:
- cart: CartItem[]
- selectedItemId: number | null
- onQuantityChange: (id, qty) => void
- onDiscountChange: (id, discount) => void
- onRemove: (id) => void
- onSelectItem: (id) => void

Características:
- Tabla con columnas: Nombre, Cantidad, Descuento, Precio, Total
- Edición inline de cantidad y descuento
- Resaltado del item seleccionado
- Botón eliminar por item
```

#### 3. **RightPanel** (`components/RightPanel.tsx`)
```typescript
Props:
- subtotal: number
- discount: number
- total: number
- onCheckout: () => void

Contiene:
- Display grande del TOTAL
- Botones: RECARGAR, LIMPIAR, SALIR
- Botones de pago: EFECTIVO, TARJETA, TRANSFERENCIA, OTRO
- Botones inferiores: IMPRIMIR, GUARDAR
```

#### 4. **FunctionKeys** (`components/FunctionKeys.tsx`)
```typescript
Botones de funciones (colores específicos):
Fila 1:
- ESPERA (violeta claro)
- RECUPERAR (cyan)
- CONSULTAR (cyan claro)
- DEVOLUCIÓN (naranja)
- CANJEAR (naranja claro)
- DESCUENTO (rosa)

Fila 2:
- ESTADO CTA (violeta)
- HISTORIAL (verde claro)
- LISTA ESPERA (cyan claro)
- REPORTE (naranja)
- DESC FACT (naranja claro)
- VISTA PREVIA (rosa)

Fila 3:
- IMPUESTO (violeta)
- INTER-ESTADO (verde)
- CRÉDITO (cyan)
- CLUB A VENTA (amarillo)
- BORRAR FACT (naranja)
- SALIR (rosa)
```

#### 5. **PaymentModal** (`components/PaymentModal.tsx`)
```typescript
Props:
- isOpen: boolean
- onClose: () => void
- total: number
- onConfirm: (method: PaymentMethod) => void

PaymentMethod enum:
- CASH (Efectivo)
- CARD (Tarjeta)
- TRANSFER (Transferencia)
- OTHER (Otro)
```

#### 6. **CustomerSelectionModal** (`components/CustomerSelectionModal.tsx`)
```typescript
Props:
- isOpen: boolean
- onClose: () => void
- onSelect: (customer: Contact) => void
- tenantId: number

Permite:
- Buscar clientes
- Seleccionar cliente existente
- Usar "Mostrador" (sin cliente)
```

---

## 🎨 DISEÑO VISUAL

### **Paleta de Colores:**
```css
Header: #6366f1 (Azul índigo)
Botón Cerrar: #ef4444 (Rojo)
Botón Procesar Venta: #10b981 (Verde)
Botón Limpiar: #ef4444 (Rojo)
Panel Carrito: #f3f4f6 (Gris claro)
TOTAL: #4f46e5 (Azul)

Botones Función:
- Violeta: #c084fc
- Cyan: #67e8f9
- Verde: #34d399
- Naranja: #fb923c
- Amarillo: #fbbf24
- Rosa: #f9a8d4
```

### **Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: Info de factura, cliente, botones superiores      │
├──────────────────────────────┬──────────────────────────────┤
│                              │  CARRITO (derecha)           │
│  PRODUCTOS (izquierda)       │  - Tabla transacciones       │
│  - Búsqueda                  │  - TOTAL grande              │
│  - Grid de productos         │  - Botones: RECARGAR, etc    │
│                              │  - Pago: EFECTIVO, TARJETA   │
│                              │  - IMPRIMIR, GUARDAR         │
├──────────────────────────────┴──────────────────────────────┤
│  FUNCTION KEYS: 18 botones en 3 filas                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 MODELOS DE DATOS

### **CartItem (Java)**
```java
public class CartItem {
    private Long id;
    private String productName;
    private Double price;
    private Double salePrice;
    private Integer quantity;
    private Double discount;
    private Boolean manageStock;
    private Integer inventoryQty;
    
    // Métodos calculados
    public double getSubtotal() {
        return (salePrice != null ? salePrice : price) * quantity;
    }
    
    public double getTotal() {
        return getSubtotal() - discount;
    }
}
```

### **Contact (Cliente)**
```java
public class Contact {
    private Long id;
    private String name;
    private String phone;
    private String email;
    private String address;
}
```

### **OrderRequest**
```java
public class OrderRequest {
    private Long tenantId;
    private Long customerId;
    private List<OrderItem> items;
    private String paymentMethod; // CASH, CARD, TRANSFER, OTHER
    private Double tax;
    private Double discount;
    private String createdBy;
}
```

---

## 🔌 INTEGRACIÓN CON BACKEND

### **Endpoints Necesarios:**

#### **Productos:**
```java
GET /api/products - Obtener todos los productos
GET /api/products/{id} - Obtener producto por ID
GET /api/products/barcode/{barcode} - Buscar por código de barras
GET /api/products/search?query={name} - Buscar por nombre
```

#### **Órdenes:**
```java
POST /api/orders - Crear orden/venta
{
  "tenantId": 1,
  "customerId": 123,
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "discount": 0
    }
  ],
  "paymentMethod": "CASH",
  "tax": 0,
  "discount": 0
}

Response:
{
  "id": 456,
  "invoiceNumber": "FAC-2025-001",
  "total": 100.50,
  "status": "COMPLETED"
}
```

#### **Clientes:**
```java
GET /api/contacts?tenantId={id} - Obtener clientes
GET /api/contacts/{id} - Obtener cliente por ID
```

---

## 🛠️ TAREAS PENDIENTES

### **Fase 1: UI Básica Mejorada**
1. ✅ Crear PosHeaderPanel con todos los campos
2. ✅ Mejorar TransactionTable con edición inline
3. ✅ Crear RightPanel con botones de pago
4. ✅ Implementar FunctionKeys con colores correctos

### **Fase 2: Funcionalidades Core**
1. ✅ Búsqueda por código de barras (scanner)
2. ✅ Selector de cliente (modal)
3. ✅ Métodos de pago múltiples
4. ✅ Generación de facturas
5. ✅ Impresión de tickets

### **Fase 3: Integraciones**
1. ✅ Conectar productos con API real
2. ✅ Guardar ventas en backend
3. ✅ Actualizar inventario post-venta
4. ✅ Histórico de transacciones

### **Fase 4: Funciones Avanzadas**
1. ✅ Descuentos globales y por item
2. ✅ Devoluciones
3. ✅ Tarjeta de puntos
4. ✅ Crédito/Débito
5. ✅ Reportes

---

## 📝 ARCHIVOS CLAVE A MODIFICAR

### **FXML:**
```
POS/src/main/resources/fxml/
├── pos.fxml (principal - YA EXISTE)
├── payment-modal.fxml (nuevo)
├── customer-modal.fxml (nuevo)
```

### **Controllers:**
```
POS/src/main/java/com/cloudfly/pos/controllers/
├── POSController.java (principal - YA EXISTE)
├── PaymentModalController.java (nuevo)
├── CustomerModalController.java (nuevo)
```

### **Services:**
```
POS/src/main/java/com/cloudfly/pos/services/
├── AuthService.java (YA EXISTE)
├── ProductService.java (nuevo)
├── OrderService.java (nuevo)
├── CustomerService.java (nuevo)
```

### **Models:**
```
POS/src/main/java/com/cloudfly/pos/models/
├── Product.java (YA EXISTE)
├── OrderItem.java (YA EXISTE)
├── CartItem.java (nuevo)
├── Contact.java (nuevo)
├── Order.java (nuevo)
```

---

## 🎯 PRIORIDADES PARA MAÑANA

### **ALTA PRIORIDAD:**
1. Implementar PosHeader completo con todos los campos
2. Crear búsqueda por código de barras funcional
3. Implementar PaymentModal con 4 métodos de pago
4. Conectar con API real de productos

### **MEDIA PRIORIDAD:**
5. Crear CustomerSelectionModal
6. Implementar FunctionKeys con colores
7. Mejorar diseño visual (colores, espaciado)
8. Agregar validaciones de stock

### **BAJA PRIORIDAD:**
9. Impresión de tickets
10. Reportes
11. Funciones avanzadas (devoluciones, etc.)

---

## 📸 REFERENCIA VISUAL

La imagen de referencia muestra:
- Header con 6 campos de información
- Cliente con selector
- Panel de búsqueda por código/nombre
- Grid de productos a la izquierda
- Carrito a la derecha con transacciones
- Total prominente en azul
- Botones EFECTIVO y TARJETA destacados
- 18 botones de funciones en la parte inferior

---

## 🔧 CONFIGURACIÓN ACTUAL

### **Dependencias (pom.xml):**
- JavaFX 21.0.1
- Retrofit 2.11.0
- OkHttp 4.12.0
- Lombok 1.18.30
- Gson 2.10.1
- JWT (Auth0) 4.4.0

### **Estructura del Proyecto:**
```
POS/
├── src/
│   ├── main/
│   │   ├── java/com/cloudfly/pos/
│   │   │   ├── Main.java
│   │   │   ├── controllers/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── config/
│   │   └── resources/
│   │       ├── fxml/
│   │       ├── css/
│   │       └── images/
│   └── test/
├── pom.xml
└── README.md
```

---

## 🚀 PRÓXIMOS PASOS TÉCNICOS

### **1. Crear POS Header Mejorado:**
```java
// Agregar al POSController:
@FXML private Label invoiceLabel;
@FXML private Label dateLabel;
@FXML private Label linesLabel;
@FXML private Label qtyLabel;
@FXML private Label saleTypeLabel;
@FXML private Label paymentMethodLabel;
@FXML private Button customerButton;
@FXML private Button codeButton;
@FXML private Button qtyButton;
@FXML private Button priceButton;
@FXML private Button totalButton;
```

### **2. Implementar ProductService:**
```java
public interface ApiService {
    @GET("products")
    Call<List<Product>> getProducts(@Header("Authorization") String token);
    
    @GET("products/barcode/{barcode}")
    Call<Product> getProductByBarcode(
        @Header("Authorization") String token,
        @Path("barcode") String barcode
    );
}
```

### **3. Crear PaymentModal:**
```java
public class PaymentModalController {
    public enum PaymentMethod {
        CASH, CARD, TRANSFER, OTHER
    }
    
    @FXML
    private void handleCashPayment() {
        processPayment(PaymentMethod.CASH);
    }
    
    // ... otros métodos
}
```

---

## ✅ CHECKLIST FINAL

Antes de considerar el POS completo, verificar:

- [ ] Login funciona con backend
- [ ] Productos cargan desde API
- [ ] Búsqueda por código de barras funciona
- [ ] Se puede agregar productos al carrito
- [ ] Se puede editar cantidad y descuento
- [ ] Cálculos de totales correctos
- [ ] Se puede seleccionar cliente
- [ ] 4 métodos de pago funcionan
- [ ] Venta se guarda en backend
- [ ] Se genera número de factura
- [ ] Inventario se actualiza
- [ ] Se puede imprimir ticket
- [ ] Todos los 18 botones funcionales
- [ ] Diseño visual idéntico al web
- [ ] Responsive y usable en pantallas táctiles

---

## 📞 CONTACTO Y NOTAS

**Desarrollador:** Antigravity AI
**Fecha:** 2025-12-11
**Versión:** 1.0.0

**Notas importantes:**
- El POS debe funcionar offline con cache local
- Sincronización automática cuando haya conexión
- Soporte para múltiples impresoras
- Configuración de impuestos por tenant
- Multi-idioma (ES, EN)

---

**FIN DE ESPECIFICACIÓN**
