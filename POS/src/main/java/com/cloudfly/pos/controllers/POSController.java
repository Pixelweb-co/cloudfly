package com.cloudfly.pos.controllers;

import com.cloudfly.pos.models.OrderItem;
import com.cloudfly.pos.models.Product;
import com.cloudfly.pos.services.AuthService;
import com.cloudfly.pos.utils.SessionManager;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.geometry.Pos;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.FlowPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.VBox;
import javafx.stage.Stage;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;

public class POSController {

    @FXML
    private Label userLabel;

    @FXML
    private Label dateTimeLabel;

    @FXML
    private TextField searchField;

    @FXML
    private FlowPane productsPane;

    @FXML
    private VBox cartPane;

    @FXML
    private Label subtotalLabel;

    @FXML
    private Label discountLabel;

    @FXML
    private Label totalLabel;

    private AuthService authService;
    private List<OrderItem> cartItems;
    private Timer clockTimer;

    @FXML
    public void initialize() {
        authService = new AuthService();
        cartItems = new ArrayList<>();

        // Mostrar información del usuario
        if (SessionManager.getInstance().getCurrentUser() != null) {
            userLabel.setText("Usuario: " + SessionManager.getInstance().getCurrentUser().getUsername());
        }

        // Iniciar reloj
        startClock();

        // Cargar productos de ejemplo (luego se conectará a la API)
        loadProducts();

        // Actualizar totales
        updateTotals();
    }

    private void startClock() {
        clockTimer = new Timer(true);
        clockTimer.scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                Platform.runLater(() -> {
                    SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss");
                    dateTimeLabel.setText(sdf.format(new Date()));
                });
            }
        }, 0, 1000);
    }

    private void loadProducts() {
        // TODO: Cargar productos desde la API
        // Por ahora, productos de ejemplo
        List<Product> products = new ArrayList<>();
        products.add(
                new Product(1L, "Coca Cola", "Bebida 350ml", "001", "123456", 2.50, 1.50, 100, "Bebidas", null, true));
        products.add(
                new Product(2L, "Pan Integral", "Pan 500g", "002", "123457", 3.00, 2.00, 50, "Panadería", null, true));
        products.add(new Product(3L, "Leche", "Leche 1L", "003", "123458", 1.50, 1.00, 75, "Lácteos", null, true));

        displayProducts(products);
    }

    private void displayProducts(List<Product> products) {
        productsPane.getChildren().clear();

        for (Product product : products) {
            VBox productCard = createProductCard(product);
            productsPane.getChildren().add(productCard);
        }
    }

    private VBox createProductCard(Product product) {
        VBox card = new VBox(10);
        card.setAlignment(Pos.CENTER);
        card.getStyleClass().add("product-card");
        card.setPrefWidth(150);
        card.setPrefHeight(120);

        Label nameLabel = new Label(product.getName());
        nameLabel.getStyleClass().add("product-name");
        nameLabel.setWrapText(true);

        Label priceLabel = new Label("$" + String.format("%.2f", product.getPrice()));
        priceLabel.getStyleClass().add("product-price");

        Label stockLabel = new Label("Stock: " + product.getStock());
        stockLabel.setStyle("-fx-text-fill: #666; -fx-font-size: 12px;");

        card.getChildren().addAll(nameLabel, priceLabel, stockLabel);

        // Click handler
        card.setOnMouseClicked(e -> addToCart(product));

        return card;
    }

    private void addToCart(Product product) {
        // Buscar si el producto ya está en el carrito
        OrderItem existingItem = cartItems.stream()
                .filter(item -> item.getProduct().getId().equals(product.getId()))
                .findFirst()
                .orElse(null);

        if (existingItem != null) {
            // Incrementar cantidad
            existingItem.setQuantity(existingItem.getQuantity() + 1);
        } else {
            // Agregar nuevo item
            cartItems.add(new OrderItem(product, 1));
        }

        refreshCart();
    }

    private void refreshCart() {
        cartPane.getChildren().clear();

        for (OrderItem item : cartItems) {
            HBox itemBox = new HBox(10);
            itemBox.setAlignment(Pos.CENTER_LEFT);
            itemBox.getStyleClass().add("cart-item");

            VBox infoBox = new VBox(5);
            Label nameLabel = new Label(item.getProduct().getName());
            nameLabel.setStyle("-fx-font-weight: bold;");
            Label priceLabel = new Label("$" + String.format("%.2f", item.getUnitPrice()) + " x " + item.getQuantity());
            infoBox.getChildren().addAll(nameLabel, priceLabel);

            Label totalLabel = new Label("$" + String.format("%.2f", item.getTotal()));
            totalLabel.setStyle("-fx-font-weight: bold; -fx-font-size: 16px;");

            HBox.setHgrow(infoBox, javafx.scene.layout.Priority.ALWAYS);

            // Botón eliminar
            Button removeBtn = new Button("|X");
            removeBtn.setStyle(
                    "-fx-background-color: #dc3545; -fx-text-fill: white; -fx-background-radius: 50%; -fx-min-width: 30px; -fx-min-height: 30px;");
            removeBtn.setOnAction(e -> removeFromCart(item));

            itemBox.getChildren().addAll(infoBox, totalLabel, removeBtn);
            cartPane.getChildren().add(itemBox);
        }

        updateTotals();
    }

    private void removeFromCart(OrderItem item) {
        cartItems.remove(item);
        refreshCart();
    }

    private void updateTotals() {
        double subtotal = cartItems.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        double discount = cartItems.stream()
                .mapToDouble(OrderItem::getDiscount)
                .sum();

        double total = subtotal - discount;

        subtotalLabel.setText("$" + String.format("%.2f", subtotal));
        discountLabel.setText("$" + String.format("%.2f", discount));
        totalLabel.setText("$" + String.format("%.2f", total));
    }

    @FXML
    private void handleSearch() {
        String query = searchField.getText().trim();
        if (!query.isEmpty()) {
            // TODO: Buscar productos en la API
            System.out.println("Buscando: " + query);
        }
    }

    @FXML
    private void handleCheckout() {
        if (cartItems.isEmpty()) {
            showAlert("Carrito vacío", "Por favor agregue productos al carrito", Alert.AlertType.WARNING);
            return;
        }

        // TODO: Procesar la venta en el backend
        double total = cartItems.stream().mapToDouble(OrderItem::getTotal).sum();

        showAlert("Venta Procesada",
                "Total: $" + String.format("%.2f", total) + "\nGracias por su compra!",
                Alert.AlertType.INFORMATION);

        handleClearCart();
    }

    @FXML
    private void handleClearCart() {
        cartItems.clear();
        refreshCart();
    }

    @FXML
    private void handleLogout() {
        if (clockTimer != null) {
            clockTimer.cancel();
        }

        authService.logout();

        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/login.fxml"));
            Parent root = loader.load();

            Stage stage = (Stage) userLabel.getScene().getWindow();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());

            stage.setScene(scene);
            stage.setTitle("CloudFly POS - Inicio de Sesión");
            stage.setResizable(false);
            stage.centerOnScreen();

        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    private void showAlert(String title, String content, Alert.AlertType type) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }
}
