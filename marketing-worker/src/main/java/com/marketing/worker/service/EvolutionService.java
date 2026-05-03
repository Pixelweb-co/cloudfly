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

    public Mono<Void> sendMessage(CampaignEntity campaign, ContactEntity contact, String formattedMessage) {
        return channelConfigRepository.findById(campaign.getChannelId())
                .flatMap(config -> {
                    if (campaign.getMediaUrl() != null && !campaign.getMediaUrl().isEmpty()) {
                        return sendMedia(config, contact.getPhone(), campaign.getMediaUrl(), campaign.getMediaType(), formattedMessage);
                    } else {
                        return sendText(config, contact.getPhone(), formattedMessage);
                    }
                });
    }

    private Mono<Void> sendText(ChannelConfig config, String phone, String text) {
        String url = apiUrl + "/message/sendText/" + config.getInstanceName();
        Map<String, Object> body = new HashMap<>();
        body.put("number", phone.replaceAll("[^0-9]", ""));
        body.put("text", text);

        return webClientBuilder.build().post()
                .uri(url)
                .header("apikey", config.getApiKey() != null ? config.getApiKey() : globalApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(v -> log.debug("✅ Message sent to {}", phone))
                .onErrorResume(e -> {
                    log.error("❌ Error sending message to {}: {}", phone, e.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<Void> sendMedia(ChannelConfig config, String phone, String mediaUrl, String mediaType, String caption) {
        String url = apiUrl + "/message/sendMedia/" + config.getInstanceName();
        Map<String, Object> body = new HashMap<>();
        body.put("number", phone.replaceAll("[^0-9]", ""));
        body.put("media", mediaUrl);
        body.put("mediatype", mediaType != null ? mediaType.toLowerCase() : "image");
        body.put("caption", caption);

        return webClientBuilder.build().post()
                .uri(url)
                .header("apikey", config.getApiKey() != null ? config.getApiKey() : globalApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Void.class)
                .doOnSuccess(v -> log.debug("✅ Media sent to {}", phone))
                .onErrorResume(e -> {
                    log.error("❌ Error sending media to {}: {}", phone, e.getMessage());
                    return Mono.empty();
                });
    }
}
