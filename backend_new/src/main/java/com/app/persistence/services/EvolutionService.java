package com.app.persistence.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

@Service
public class EvolutionService {

    private static final Logger log = LoggerFactory.getLogger(EvolutionService.class);

    private final WebClient webClient;
    private final String apiKey;
    private final String apiUrl;
    private final String webhookUrl;

    public EvolutionService(
            WebClient.Builder webClientBuilder,
            @Value("${evolution.api.url}") String apiUrl,
            @Value("${evolution.api.key}") String apiKey,
            @Value("${evolution.webhook.url}") String webhookUrl) {
        // Limpiar espacios en blanco que puedan venir de variables de entorno
        String cleanUrl = apiUrl != null ? apiUrl.trim() : "";
        String cleanKey = apiKey != null ? apiKey.trim() : "";
        String cleanWebhook = webhookUrl != null ? webhookUrl.trim() : "";
        
        log.info("🚀 [EVOLUTION-SERVICE] Initialized. URL: '{}', Key: '{}', Webhook: '{}'", cleanUrl, cleanKey, cleanWebhook);
        
        // Asegurar que apiUrl no termine en /
        this.apiUrl = cleanUrl.endsWith("/") ? cleanUrl.substring(0, cleanUrl.length() - 1) : cleanUrl;
        this.apiKey = cleanKey;
        this.webhookUrl = cleanWebhook;
        this.webClient = webClientBuilder.build();
    }

    public Mono<Boolean> instanceExists(String instanceName) {
        String url = apiUrl + "/instance/connectionState/" + instanceName;
        log.info("🔍 [EVOLUTION-SERVICE] Checking existence: {}", instanceName);
        return webClient.get()
                .uri(url)
                .header("apikey", apiKey)
                .exchangeToMono(response -> {
                    boolean exists = response.statusCode().is2xxSuccessful();
                    log.info("📊 [EVOLUTION-SERVICE] Instance {} exists: {}", instanceName, exists);
                    return Mono.just(exists);
                })
                .onErrorReturn(false);
    }

    public Mono<Map<String, Object>> createInstance(String instanceName) {
        return instanceExists(instanceName)
            .flatMap(exists -> {
                if (exists) {
                    log.info("📡 [EVOLUTION-SERVICE] Instance {} already exists. Fetching QR code.", instanceName);
                    return fetchQrCode(instanceName)
                        .map(qrMap -> {
                            Map<String, Object> recovery = new HashMap<>(qrMap);
                            recovery.put("recovered", true);
                            recovery.put("instance", Map.of("instanceName", instanceName, "status", "recovered"));
                            return recovery;
                        });
                } else {
                    String url = apiUrl + "/instance/create";
                    log.info("🌐 [EVOLUTION-SERVICE] Creating new instance: {} at {}", instanceName, url);

                    Map<String, Object> body = new HashMap<>();
                    body.put("instanceName", instanceName);
                    body.put("integration", "WHATSAPP-BAILEYS");
                    body.put("token", apiKey);
                    body.put("qrcode", true);

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
                            .doOnSuccess(res -> log.info("✅ Instance creation successful for: {}", instanceName));
                }
            })
            .doOnError(err -> log.error("❌ Error handling instance {}: {}", instanceName, err.getMessage()));
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

    public Mono<Boolean> checkHealth() {
        String url = apiUrl + "/";
        log.info("🏥 [EVOLUTION-SERVICE] Checking API Health at: {}", url);
        return webClient.get()
                .uri(java.net.URI.create(url))
                .retrieve()
                .toBodilessEntity()
                .timeout(java.time.Duration.ofSeconds(7))
                .map(response -> response.getStatusCode().is2xxSuccessful())
                .doOnError(err -> log.error("❌ [EVOLUTION-SERVICE] Health check failed for URL {}: {}", url, err.getMessage()))
                .onErrorReturn(false);
    }

    public Mono<Boolean> isOnWhatsApp(String instanceName, String phoneNumber) {
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");
        String url = apiUrl + "/chat/whatsappNumbers/" + (instanceName != null ? instanceName : "cloudfly_chatbot1");
        
        Map<String, Object> body = new HashMap<>();
        body.put("numbers", new String[]{cleanNumber});

        log.info("🔍 [EVOLUTION-SERVICE] Checking if {} is on WhatsApp using instance {}", cleanNumber, instanceName);

        return webClient.post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.List<Map<String, Object>>>() {})
                .map(list -> {
                    if (list != null && !list.isEmpty()) {
                        Map<String, Object> result = list.get(0);
                        return Boolean.TRUE.equals(result.get("exists"));
                    }
                    return false;
                })
                .onErrorResume(err -> {
                    log.warn("⚠️ [EVOLUTION-SERVICE] Error checking WhatsApp number {}: {}", cleanNumber, err.getMessage());
                    return Mono.just(false);
                });
    }

    public Mono<Map<String, Object>> sendSimpleMessage(String instanceName, String phoneNumber, String body) {
        String cleanNumber = phoneNumber.replaceAll("[^0-9]", "");
        String url = apiUrl + "/message/sendText/" + (instanceName != null ? instanceName : "cloudfly_chatbot1");
        
        Map<String, Object> messageBody = new HashMap<>();
        messageBody.put("number", cleanNumber);
        messageBody.put("text", body);
        messageBody.put("delay", 1200);
        messageBody.put("linkPreview", true);

        log.info("📤 [EVOLUTION-SERVICE] Sending text message to {}: {}", cleanNumber, body);

        return webClient.post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageBody)
                .retrieve()
                .onStatus(status -> status.isError(), response -> 
                    response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("❌ Evolution SendMessage Error ({}): {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Evolution SendMessage Error: " + errorBody));
                        })
                )
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(res -> log.info("✅ Message sent successfully to {}", cleanNumber));
    }

    public Mono<Map<String, Object>> setWebhook(String instanceName) {
        String url = apiUrl + "/webhook/set/" + instanceName;
        log.info("📡 [EVOLUTION-SERVICE] Configuring Webhook for: {} (URL: {})", instanceName, webhookUrl);

        // Evolution v2 requiere que los campos estén dentro de un objeto 'webhook'
        Map<String, Object> webhookData = new HashMap<>();
        // El webhook ahora se gestiona en el microservicio de sockets para mayor velocidad
        String finalWebhookUrl = "https://chat.cloudfly.com.co/webhook/evolution";
        webhookData.put("url", finalWebhookUrl);
        webhookData.put("enabled", true);
        webhookData.put("webhook_by_events", false);
        webhookData.put("base64", true); // Permitir media en base64 (nombre correcto para v2)
        webhookData.put("events", new String[]{
            "MESSAGES_UPSERT",
            "CONNECTION_UPDATE"
        });

        Map<String, Object> body = new HashMap<>();
        body.put("webhook", webhookData);

        return webClient.post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(status -> status.isError(), response -> 
                    response.bodyToMono(String.class)
                        .flatMap(errorBody -> {
                            log.error("❌ Evolution Webhook Config Error ({}): {}", response.statusCode(), errorBody);
                            return Mono.error(new RuntimeException("Evolution Webhook Error: " + errorBody));
                        })
                )
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(res -> log.info("✅ Webhook configured successfully for: {}", instanceName));
    }
}

