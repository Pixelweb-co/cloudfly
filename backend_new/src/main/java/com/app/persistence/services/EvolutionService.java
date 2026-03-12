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

    public EvolutionService(
            WebClient.Builder webClientBuilder,
            @Value("${evolution.api.url}") String apiUrl,
            @Value("${evolution.api.key}") String apiKey) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
        this.apiKey = apiKey;
    }

    public Mono<Map<String, Object>> createInstance(String instanceName) {
        log.info("🌐 [EVOLUTION-SERVICE] Creating instance: {}", instanceName);

        Map<String, Object> body = new HashMap<>();
        body.put("instanceName", instanceName);
        body.put("token", apiKey);
        body.put("integration", "WHATSAPP-BAILEYS");
        body.put("qrcode", true);

        return webClient.post()
                .uri("/instance/create")
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(res -> log.info("✅ Instance created: {}", instanceName))
                .doOnError(err -> log.error("❌ Error creating instance: {}", err.getMessage()));
    }

    public Mono<Map<String, Object>> fetchQrCode(String instanceName) {
        log.info("🔲 [EVOLUTION-SERVICE] Fetching QR for: {}", instanceName);

        return webClient.get()
                .uri("/instance/connect/" + instanceName)
                .header("apikey", apiKey)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnError(err -> log.error("❌ Error fetching QR: {}", err.getMessage()));
    }

    public Mono<Map<String, Object>> checkConnection(String instanceName) {
        return webClient.get()
                .uri("/instance/connectionState/" + instanceName)
                .header("apikey", apiKey)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnError(err -> log.error("❌ Error checking connection: {}", err.getMessage()));
    }
}
