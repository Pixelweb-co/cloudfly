# 📋 TAREAS PENDIENTES - POS Desktop

## 🔥 PRIORIDAD ALTA - Mañana

### 1. Header con Información Completa
**Archivo:** `POSController.java` + `pos.fxml`
**Tiempo estimado:** 2 horas

```java
// Agregar campos al controller:
@FXML private Label invoiceNoLabel;
@FXML private Label dateLabel;
@FXML private Label linesLabel;      // Cantidad de líneas
@FXML private Label quantityLabel;   // Total de items
@FXML private Label saleTypeLabel;   // Retail/Mayorista
@FXML private Label paymentLabel;    // Efectivo/Tarjeta
@FXML private Button customerButton; // "Mostrador" -> Modal

// Métodos a implementar:
private void updateHeader() {
    invoiceNoLabel.setText(lastInvoice.isEmpty() ? "NUEVO" : lastInvoice);
    dateLabel.setText(new SimpleDateFormat("yyyy-MM-dd HH:mm").format(new Date()));
    linesLabel.setText(String.valueOf(cart.size()));
    quantityLabel.setText(String.valueOf(cart.stream().mapToInt(i -> i.getQuantity()).sum()));
    // ...
}
```

**FXML:**
```xml
<HBox style="-fx-background-color: white; -fx-padding: 10;">
    <VBox><Label text="N° FACTURA"/><Label fx:id="invoiceNoLabel" text="NUEVO"/></VBox>
    <VBox><Label text="FECHA"/><Label fx:id="dateLabel"/></VBox>
    <VBox><Label text="LINEAS"/><Label fx:id="linesLabel" text="0"/></VBox>
    <!-- ... más campos -->
</HBox>
```

---

### 2. Búsqueda por Código de Barras
**Archivo:** `POSController.java`
**Tiempo estimado:** 1 hora

```java
// En el TextField de búsqueda:
searchField.setOnKeyPressed(event -> {
    if (event.getCode() == KeyCode.ENTER) {
        String barcode = searchField.getText().trim();
        if (!barcode.isEmpty()) {
            searchProductByBarcode(barcode);
        }
    }
});

private void searchProductByBarcode(String barcode) {
    // 1. Buscar en productos de ejemplo primero
    Product product = products.stream()
        .filter(p -> barcode.equals(p.getBarcode()))
        .findFirst()
        .orElse(null);
    
    if (product != null) {
        addToCart(product);
        searchField.clear();
        return;
    }
    
    // 2. Si no está, buscar en API (implementar después)
    // ProductService.getByBarcode(barcode)
}
```

---

### 3. Modal de Métodos de Pago
**Archivos:** `PaymentModalController.java` + `payment-modal.fxml`
**Tiempo estimado:** 2 horas

**payment-modal.fxml:**
```xml
<VBox xmlns:fx="http://javafx.com/fxml" 
      fx:controller="com.cloudfly.pos.controllers.PaymentModalController"
      spacing="20" style="-fx-padding: 30; -fx-background-color: white;">
    
    <Label text="PROCESAR PAGO" style="-fx-font-size: 24px; -fx-font-weight: bold;"/>
    
    <Label fx:id="totalLabel" text="$0.00" 
           style="-fx-font-size: 48px; -fx-font-weight: bold; -fx-text-fill: #4f46e5;"/>
    
    <GridPane hgap="15" vgap="15">
        <Button text="EFECTIVO" onAction="#handleCash" 
                style="-fx-background-color: #10b981; -fx-text-fill: white;"
                GridPane.columnIndex="0" GridPane.rowIndex="0"/>
        <Button text="TARJETA" onAction="#handleCard"
                style="-fx-background-color: #3b82f6; -fx-text-fill: white;"
                GridPane.columnIndex="1" GridPane.rowIndex="0"/>
        <Button text="TRANSFERENCIA" onAction="#handleTransfer"
                style="-fx-background-color: #8b5cf6; -fx-text-fill: white;"
                GridPane.columnIndex="0" GridPane.rowIndex="1"/>
        <Button text="OTRO" onAction="#handleOther"
                style="-fx-background-color: #6b7280; -fx-text-fill: white;"
                GridPane.columnIndex="1" GridPane.rowIndex="1"/>
    </GridPane>
    
    <Button text="CANCELAR" onAction="#handleCancel"
            style="-fx-background-color: #ef4444; -fx-text-fill: white;"/>
</VBox>
```

**PaymentModalController.java:**
```java
public class PaymentModalController {
    @FXML private Label totalLabel;
    private Stage stage;
    private Consumer<String> onPaymentConfirm;
    
    public void setTotal(double total) {
        totalLabel.setText(String.format("$%.2f", total));
    }
    
    public void setOnPaymentConfirm(Consumer<String> callback) {
        this.onPaymentConfirm = callback;
    }
    
    @FXML
    private void handleCash() {
        confirmPayment("CASH");
    }
    
    @FXML
    private void handleCard() {
        confirmPayment("CARD");
    }
    
    private void confirmPayment(String method) {
        if (onPaymentConfirm != null) {
            onPaymentConfirm.accept(method);
        }
        stage.close();
    }
}
```

---

### 4. Integración con API Real de Productos
**Archivo:** `ProductService.java` (nuevo)
**Tiempo estimado:** 1.5 horas

```java
public class ProductService {
    private final ApiService apiService;
    private final String token;
    
    public ProductService() {
        this.apiService = ApiClient.getApiService();
        this.token = "Bearer " + SessionManager.getInstance().getToken();
    }
    
    public List<Product> getAll() throws IOException {
        Call<List<Product>> call = apiService.getProducts(token);
        Response<List<Product>> response = call.execute();
        
        if (!response.isSuccessful()) {
            throw new IOException("Error al obtener productos: " + response.code());
        }
        
        return response.body();
    }
    
    public Product getByBarcode(String barcode) throws IOException {
        Call<Product> call = apiService.getProductByBarcode(token, barcode);
        Response<Product> response = call.execute();
        
        if (!response.isSuccessful()) {
            return null; // No encontrado
        }
        
        return response.body();
    }
}
```

**Actualizar ApiService.java:**
```java
public interface ApiService {
    // Autenticación (ya existe)
    @POST("auth/login")
    Call<AuthResponse> login(@Body LoginRequest request);
    
    // Productos (NUEVO)
    @GET("products")
    Call<List<Product>> getProducts(@Header("Authorization") String token);
    
    @GET("products/barcode/{barcode}")
    Call<Product> getProductByBarcode(
        @Header("Authorization") String token,
        @Path("barcode") String barcode
    );
    
    @GET("products/search")
    Call<List<Product>> searchProducts(
        @Header("Authorization") String token,
        @Query("query") String query
    );
}
```

---

## 🟡 PRIORIDAD MEDIA - Esta Semana

### 5. Selector de Clientes
**Archivos:** `CustomerModalController.java` + `customer-modal.fxml`
**Tiempo:** 3 horas

### 6. Teclado de Funciones (18 botones)
**Archivo:** `pos.fxml`
**Tiempo:** 2 horas

### 7. Mejorar Diseño Visual
**Archivos:** `styles.css` + todos los FXML
**Tiempo:** 2 horas

### 8. Validaciones de Stock
**Archivo:** `POSController.java`
**Tiempo:** 1 hora

---

## 🟢 PRIORIDAD BAJA - Futuro

### 9. Servicio de Órdenes (POST /api/orders)
**Tiempo:** 2 horas

### 10. Impresión de Tickets
**Tiempo:** 4 horas

### 11. Reportes de Ventas
**Tiempo:** 3 horas

### 12. Devoluciones
**Tiempo:** 2 horas

### 13. Descuentos Globales
**Tiempo:** 1 hora

### 14. Multi-idioma
**Tiempo:** 2 horas

---

## 📊 ESTIMACIÓN TOTAL

**Alta Prioridad:** ~6.5 horas  
**Media Prioridad:** ~8 horas  
**Baja Prioridad:** ~14 horas  

**TOTAL:** ~28.5 horas de desarrollo

---

## 🎯 PLAN DE DESARROLLO

### Día 1 (Mañana):
- ✅ Tarea 1: Header completo
- ✅ Tarea 2: Búsqueda por código de barras
- ✅ Tarea 3: Modal de pago

### Día 2:
- ✅ Tarea 4: API real de productos
- ✅ Tarea 5: Selector de clientes
- ✅ Tarea 7: Mejorar diseño

### Día 3:
- ✅ Tarea 6: Teclado de funciones
- ✅ Tarea 8: Validaciones
- ✅ Tarea 9: Servicio de órdenes

### Día 4-5:
- Tareas de baja prioridad según necesidad

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de marcar cada tarea como completa, verificar:

- [ ] Código compila sin errores
- [ ] FXML carga sin excepciones
- [ ] Funcionalidad probada manualmente
- [ ] Estilos CSS aplicados correctamente
- [ ] Integración con backend funciona
- [ ] Manejo de errores implementado
- [ ] Mensajes al usuario (toast/alerts)
- [ ] Código documentado (comentarios)

---

**Última actualización:** 2025-12-11  
**Próxima revisión:** Mañana
