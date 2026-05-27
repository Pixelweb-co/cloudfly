package com.marketing.worker.service;

import com.marketing.worker.persistence.entity.CampaignEntity;
import com.marketing.worker.persistence.entity.ChannelConfig;
import com.marketing.worker.persistence.entity.ContactEntity;
import com.marketing.worker.persistence.repository.ChannelConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class EvolutionService {

    private final WebClient.Builder webClientBuilder;
    private final ChannelConfigRepository channelConfigRepository;

    @Value("${evolution.api.url}")
    private String apiUrl;

    @Value("${evolution.api.key}")
    private String globalApiKey;

    public Mono<String> sendMessage(CampaignEntity campaign, ContactEntity contact, String formattedMessage) {
        return channelConfigRepository.findById(campaign.getChannelId())
                .flatMap(config -> {
                    String phone = contact.getPhone().replaceAll("[^0-9]", "");
                    String apiKey = config.getApiKey() != null ? config.getApiKey() : globalApiKey;

                    // 1. Simulate "composing" presence before sending
                    return sendPresence(config.getInstanceName(), phone, apiKey)
                            .then(Mono.delay(Duration.ofMillis(1500 + (long)(Math.random() * 2000))))
                            .then(Mono.defer(() -> {
                                if (campaign.getMediaUrl() != null && !campaign.getMediaUrl().isEmpty()) {
                                    return sendMedia(config, phone, campaign.getMediaUrl(), campaign.getMediaType(), formattedMessage, apiKey);
                                } else {
                                    return sendText(config, phone, formattedMessage, apiKey);
                                }
                            }));
                });
    }

    /**
     * Sends a "composing" presence indicator so WhatsApp sees
     * the number as "typing..." before the actual message arrives.
     */
    private Mono<Void> sendPresence(String instanceName, String phone, String apiKey) {
        String url = apiUrl + "/chat/updatePresence/" + instanceName;
        Map<String, Object> body = new HashMap<>();
        body.put("number", phone);
        body.put("presence", "composing");

        return webClientBuilder.build().post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .onErrorResume(e -> {
                    log.debug("Presence update skipped for {}: {}", phone, e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<String> sendText(ChannelConfig config, String phone, String text, String apiKey) {
        String url = apiUrl + "/message/sendText/" + config.getInstanceName();
        Map<String, Object> body = new HashMap<>();
        body.put("number", phone);
        body.put("text", text);
        body.put("delay", 1200 + (int)(Math.random() * 3000));

        return webClientBuilder.build().post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    log.debug("✅ Message sent to {}", phone);
                    return extractMessageId(response);
                })
                .onErrorResume(e -> {
                    log.error("❌ Error sending message to {}: {}", phone, e.getMessage());
                    return Mono.error(e);
                });
    }

    private String extractMessageId(Map response) {
        try {
            if (response.containsKey("key")) {
                Map key = (Map) response.get("key");
                return (String) key.get("id");
            }
        } catch (Exception e) {
            log.warn("Could not extract message ID from response: {}", e.getMessage());
        }
        return null;
    }

    private Mono<String> sendMedia(ChannelConfig config, String phone, String mediaUrl, String mediaType, String caption, String apiKey) {
        String url = apiUrl + "/message/sendMedia/" + config.getInstanceName();
        Map<String, Object> body = new HashMap<>();
        body.put("number", phone);
        body.put("media", mediaUrl);
        body.put("mediatype", mediaType != null ? mediaType.toLowerCase() : "image");
        body.put("caption", caption);
        body.put("delay", 1500 + (int)(Math.random() * 3000));

        return webClientBuilder.build().post()
                .uri(url)
                .header("apikey", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .map(response -> {
                    log.debug("✅ Media sent to {}", phone);
                    return extractMessageId(response);
                })
                .onErrorResume(e -> {
                    log.error("❌ Error sending media to {}: {}", phone, e.getMessage());
                    return Mono.error(e);
                });
    }
}
