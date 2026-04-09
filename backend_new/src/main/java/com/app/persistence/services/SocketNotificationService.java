package com.app.persistence.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class SocketNotificationService {

    private final WebClient webClient;
    private final String socketUrl;
    private final String secretKey;

    public SocketNotificationService(
            WebClient.Builder webClientBuilder,
            @Value("${services.socket.url}") String socketUrl,
            @Value("${services.socket.secret}") String secretKey) {
        this.webClient = webClientBuilder.build();
        this.socketUrl = socketUrl;
        this.secretKey = secretKey;
        log.info("🚀 [SOCKET-NOTIFY] Service initialized. URL: {}", socketUrl);
    }

    /**
     * Notify the socket service about a new message
     */
    public Mono<Void> notifyNewMessage(Map<String, Object> messagePayload) {
        String url = socketUrl + "/api/notify/new-message";
        
        log.info("📡 [SOCKET-NOTIFY] Sending notification for message {} in conversation {}", 
                messagePayload.get("messageId"), messagePayload.get("conversationId"));

        return webClient.post()
                .uri(url)
                .header("x-api-secret", secretKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messagePayload)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnSuccess(res -> log.info("✅ [SOCKET-NOTIFY] Notification sent successfully"))
                .doOnError(err -> log.error("❌ [SOCKET-NOTIFY] Error sending notification: {}", err.getMessage()))
                .then()
                .onErrorResume(e -> Mono.empty()); // No queremos que el chat falle por culpa de la notificación
    }
}
