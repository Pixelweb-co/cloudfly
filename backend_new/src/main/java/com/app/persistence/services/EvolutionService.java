package com.app.persistence.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EvolutionService {

    private final WebClient webClient;
    private final String apiKey;
    private final String apiUrl;

    public EvolutionService(
            WebClient.Builder webClientBuilder,
            @Value("${evolution.api.url}") String apiUrl,
            @Value("${evolution.api.key}") String apiKey) {
        // Limpiar espacios en blanco que puedan venir de variables de entorno
        String cleanUrl = apiUrl != null ? apiUrl.trim() : "";
        String cleanKey = apiKey != null ? apiKey.trim() : "";
        
        log.info("🚀 [EVOLUTION-SERVICE] Initialized. URL: '{}', Key: '{}'", cleanUrl, cleanKey);
        
        // Asegurar que apiUrl no termine en /
        this.apiUrl = cleanUrl.endsWith("/") ? cleanUrl.substring(0, cleanUrl.length() - 1) : cleanUrl;
        this.apiKey = cleanKey;
        this.webClient = webClientBuilder.build();
    }

    public Mono<Map<String, Object>> createInstance(String instanceName) {
        String url = apiUrl + "/instance/create";
        
        // Log ultra-detallado solicitado por el usuario
        log.info("🔍 [DEBUG-EVOLUTION] Tentando crear instancia: '{}'", instanceName);
        log.info("🔍 [DEBUG-EVOLUTION] Host configurado (apiUrl): '{}' (Length: {})", apiUrl, (apiUrl != null ? apiUrl.length() : 0));
        log.info("🔍 [DEBUG-EVOLUTION] API Key configurada (apiKey): '{}'...", (apiKey != null && apiKey.length() > 5 ? apiKey.substring(0, 5) : "NULL/SHORT"));
        log.info("🔍 [DEBUG-EVOLUTION] URL Final construida: '{}'", url);

        Map<String, Object> body = Map.of(
                "instanceName", instanceName,
                "integration", "WHATSAPP-BAILEYS",
                "token", apiKey,
                "qrcode", true
        );

        return webClient.post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.isError(), response -> 
                    response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("❌ Evolution API Error ({}): {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Evolution API Error: " + errorBody));
                        })
                )
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .log("com.app.evolution.create") 
                .doOnSuccess(res -> log.info("✅ Instance created: {}", instanceName))
                .doOnError(err -> {
                    log.error("❌ Error en createInstance: {}", err.getMessage());
                    if (err instanceof org.springframework.web.reactive.function.client.WebClientRequestException) {
                        log.error("❌ WebClientRequestException URI: {}", ((org.springframework.web.reactive.function.client.WebClientRequestException)err).getUri());
                    }
                });
    }

    public Mono<Map<String, Object>> fetchQrCode(String instanceName) {
        String url = apiUrl + "/instance/connect/" + instanceName;
        log.info("🔲 [EVOLUTION-SERVICE] Fetching QR at: {}", url);

        return webClient.get()
                .uri(url)
                .header("apikey", apiKey)
                .retrieve()
                .onStatus(status -> status.isError(), response -> 
                    response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("❌ Evolution QR Error ({}): {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Evolution QR Error: " + errorBody));
                        })
                )
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .log("com.app.evolution.qr") // DEBUG LOG
                .doOnError(err -> log.error("❌ Error fetching QR for {}: {}", instanceName, err.getMessage()));
    }

    public Mono<Map<String, Object>> checkConnection(String instanceName) {
        String url = apiUrl + "/instance/connectionState/" + instanceName;
        return webClient.get()
                .uri(url)
                .header("apikey", apiKey)
                .retrieve()
                .onStatus(status -> status.isError(), response -> Mono.empty())
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .log("com.app.evolution.status") // DEBUG LOG
                .doOnError(err -> log.error("❌ Error checking connection for {}: {}", instanceName, err.getMessage()));
    }
}
