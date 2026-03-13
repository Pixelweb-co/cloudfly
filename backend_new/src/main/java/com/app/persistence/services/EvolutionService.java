package com.app.persistence.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

class InstanceAlreadyExistsException extends RuntimeException {
    public InstanceAlreadyExistsException(String message) {
        super(message);
    }
}

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
        log.info("🌐 [EVOLUTION-SERVICE] Creating instance: {} at {}", instanceName, url);

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
                    response.bodyToMono(Map.class)
                        .flatMap(errorBody -> {
                            String message = errorBody != null ? (String) errorBody.get("message") : "";
                            if (response.statusCode().value() == 400 && message != null && message.contains("already in use")) {
                                log.info("ℹ️ [EVOLUTION-SERVICE] Instance already exists: {}", instanceName);
                                return Mono.error(new InstanceAlreadyExistsException("Instance already exists"));
                            }
                            log.error("❌ Evolution API Error ({}): {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Evolution API Error: " + errorBody));
                        })
                )
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .onErrorResume(InstanceAlreadyExistsException.class, e -> {
                    log.info("✅ [EVOLUTION-SERVICE] Recovering from existing instance: {}", instanceName);
                    Map<String, Object> recoveryMap = new HashMap<>();
                    recoveryMap.put("instance", Map.of("instanceName", instanceName, "status", "created"));
                    return Mono.just(recoveryMap);
                })
                .doOnSuccess(res -> log.info("✅ Instance creation handled: {}", instanceName))
                .doOnError(err -> {
                    if (!(err instanceof InstanceAlreadyExistsException)) {
                        log.error("❌ Error creating instance {}: {}", instanceName, err.getMessage());
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
