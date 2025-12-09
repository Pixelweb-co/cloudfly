package com.cloudfly.pos;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Parent;
import javafx.scene.Scene;
import javafx.scene.image.Image;
import javafx.stage.Stage;

public class Main extends Application {

    @Override
    public void start(Stage primaryStage) throws Exception {
        // Cargar la vista de login
        FXMLLoader loader = new FXMLLoader(getClass().getResource("/fxml/login.fxml"));
        Parent root = loader.load();

        // Crear la escena
        Scene scene = new Scene(root, 1024, 700);
        scene.getStylesheets().add(getClass().getResource("/css/styles.css").toExternalForm());

        // Configurar el stage
        primaryStage.setTitle("CloudFly POS - Inicio de Sesión");
        primaryStage.setScene(scene);
        primaryStage.setResizable(false);
        primaryStage.centerOnScreen();

        // Opcional: Agregar icono de la aplicación
        // primaryStage.getIcons().add(new
        // Image(getClass().getResourceAsStream("/images/icon.png")));

        primaryStage.show();
    }

    public static void main(String[] args) {
        launch(args);
    }
}
