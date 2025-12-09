package com.cloudfly.pos.config;

public class AppConfig {

    // URL del backend API
    public static final String API_BASE_URL = "https://api.cloudfly.com.co/";

    // También soportar desarrollo local
    public static final String API_BASE_URL_LOCAL = "http://localhost:8080/";

    // Usar la URL apropiada según el ambiente
    public static String getApiUrl() {
        String env = System.getProperty("env", "production");
        return env.equals("local") ? API_BASE_URL_LOCAL : API_BASE_URL;
    }

    // Configuración de la aplicación
    public static final String APP_NAME = "CloudFly POS";
    public static final String APP_VERSION = "1.0.0";

    // Timeouts
    public static final int CONNECTION_TIMEOUT = 30; // segundos
    public static final int READ_TIMEOUT = 30; // segundos
    public static final int WRITE_TIMEOUT = 30; // segundos

    // Session
    public static final int SESSION_TIMEOUT = 480; // 8 horas en minutos

    // Configuración de impresora (para futura implementación)
    public static final String PRINTER_NAME = "default";
    public static final int PAPER_WIDTH = 80; // mm
}
