package com.cloudfly.pos.controllers;

import com.cloudfly.pos.models.dto.AuthResponse;
import com.cloudfly.pos.services.AuthService;
import javafx.application.Platform;
import javafx.fxml

        .FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.PasswordField;
import javafx.scene.control.ProgressIndicator;
import javafx.scene.control.TextField;
import javafx.stage.Stage;

import java.io.IOException;

public class LoginController {

    @FXML
    private TextField usernameField;

    @FXML
    private PasswordField passwordField;

    @FXML
    private Button loginButton;

    @FXML
    private Label errorLabel;

    @FXML
    private ProgressIndicator loadingIndicator;

    private AuthService authService;

    @FXML
    public void initialize() {
        authService = new AuthService();

        // Focus en el campo de usuario al iniciar
        Platform.runLater(() -> usernameField.requestFocus());
    }

    @FXML
    private void handleLogin() {
        String username = usernameField.getText().trim();
        String password = passwordField.getText();

        // Validaciones
        if (username.isEmpty() || password.isEmpty()) {
            showError("Por favor ingrese usuario y contraseña");
            return;
        }

        // Mostrar loading
        setLoading(true);
        hideError();

        // Realizar login
        authService.login(username, password, new AuthService.LoginCallback() {
            @Override
            public void onSuccess(AuthResponse response) {
                Platform.runLater(() -> {
                    setLoading(false);
                    System.out.println("Login exitoso: " + response.getUsername());
                    openPOSScreen();
                });
            }

            @Override
            public void onError(String message) {
                Platform.runLater(() -> {
                    setLoading(false);
                    showError(message);
                });
            }
        });
    }

    private void openPOSScreen() {
        try {
            FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/pos.fxml"));
            Parent root = loader.load();

            Stage stage = (Stage) loginButton.getScene().getWindow();
            Scene scene = new Scene(root);
            scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());

            stage.setScene(scene);
            stage.setTitle("CloudFly POS - Punto de Venta");
            stage.setMaximized(true);

        } catch (IOException e) {
            e.printStackTrace();
            showError("Error al cargar la pantalla principal");
        }
    }

    private void showError(String message) {
        errorLabel.setText(message);
        errorLabel.setVisible(true);
    }

    private void hideError() {
        errorLabel.setVisible(false);
    }

    private void setLoading(boolean loading) {
        loadingIndicator.setVisible(loading);
        loginButton.setDisable(loading);
        usernameField.setDisable(loading);
        passwordField.setDisable(loading);
    }
}
