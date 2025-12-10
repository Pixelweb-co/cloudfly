package com.app.starter1.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI cloudFlyOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("CloudFly Marketing AI Pro API")
                        .description("API REST para CloudFly - Sistema de gestión empresarial con IA")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("CloudFly Team")
                                .email("soporte@cloudfly.com.co")
                                .url("https://cloudfly.com.co"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://cloudfly.com.co/license")))
                .servers(Arrays.asList(
                        new Server().url("https://api.cloudfly.com.co").description("Servidor de Producción"),
                        new Server().url("http://localhost:8080").description("Servidor Local")))
                .components(new Components()
                        .addSecuritySchemes("bearer-jwt", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .in(SecurityScheme.In.HEADER)
                                .name("Authorization")
                                .description("Ingrese el token JWT obtenido al hacer login")))
                .addSecurityItem(new SecurityRequirement().addList("bearer-jwt"));
    }
}
