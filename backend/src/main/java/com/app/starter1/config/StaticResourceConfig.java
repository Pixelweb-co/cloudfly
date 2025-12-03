package com.app.starter1.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Value("${media.uploads-location}")
    private String uploadsLocation; // "uploads"

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resuelve "uploads" a una ruta absoluta real
        Path uploadDir = Paths.get(uploadsLocation)
                .toAbsolutePath()
                .normalize();

        String uploadPath = uploadDir.toUri().toString(); // ej: file:/C:/proyecto/backend/uploads/

        System.out.println(">>> Serving /uploads/** from: " + uploadPath);

        registry
                .addResourceHandler("/uploads/**")
                .addResourceLocations(uploadPath);
    }
}
