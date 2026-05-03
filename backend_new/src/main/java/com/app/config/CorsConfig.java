package com.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

/**
 * Configuración global de CORS para Spring WebFlux.
 * Permite el acceso desde el dashboard y dominios autorizados de CloudFly.
 */
@Configuration
public class CorsConfig {

    @Bean
    public org.springframework.web.cors.reactive.CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Orígenes permitidos
        corsConfig.setAllowedOrigins(Arrays.asList(
            "https://dashboard.cloudfly.com.co",
            "https://api.cloudfly.com.co",
            "http://dashboard.cloudfly.com.co:5420",
            "http://localhost:3000",
            "http://localhost:8080"
        ));
        
        // Métodos HTTP permitidos
        corsConfig.setMaxAge(3600L);
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Cabeceras permitidas
        corsConfig.setAllowedHeaders(java.util.Collections.singletonList("*"));
        
        // Permitir envío de credenciales (JWT en cookies o cabeceras)
        corsConfig.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Aplicar a todas las rutas de la API
        source.registerCorsConfiguration("/**", corsConfig);

        return source;
    }
}
