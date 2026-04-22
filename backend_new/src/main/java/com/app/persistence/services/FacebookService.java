package com.app.persistence.services;

import com.app.dto.ChannelConfigDTO;
import com.app.persistence.entity.ChannelEntity;
import com.app.persistence.repository.ChannelRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class FacebookService {

    private final WebClient webClient;
    private final ChannelRepository channelRepository;
    private final ObjectMapper objectMapper;
    private final String fbAppId;
    private final String fbAppSecret;

    public FacebookService(
            WebClient.Builder webClientBuilder,
            ChannelRepository channelRepository,
            ObjectMapper objectMapper,
            @Value("${facebook.app.id:}") String fbAppId,
            @Value("${facebook.app.secret:}") String fbAppSecret) {
        this.channelRepository = channelRepository;
        this.objectMapper = objectMapper;
        this.fbAppId = fbAppId;
        this.fbAppSecret = fbAppSecret;
        this.webClient = webClientBuilder.baseUrl("https://graph.facebook.com/v19.0").build();
    }

    public String getAppId() {
        return fbAppId;
    }

    public Mono<String> exchangeForLongLivedToken(String shortLivedToken) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/oauth/access_token")
                        .queryParam("grant_type", "fb_exchange_token")
                        .queryParam("client_id", fbAppId)
                        .queryParam("client_secret", fbAppSecret)
                        .queryParam("fb_exchange_token", shortLivedToken)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(response -> (String) response.get("access_token"));
    }

    public Mono<List<Map<String, Object>>> getUserPages(String userAccessToken) {
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/me/accounts")
                        .queryParam("access_token", userAccessToken)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(response -> {
                    List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                    return data != null ? data : List.of();
                });
    }

    public Mono<Boolean> subscribeAppToPage(String pageId, String pageAccessToken) {
        return webClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/{pageId}/subscribed_apps")
                        .queryParam("subscribed_fields", "messages,messaging_postbacks,messaging_optins")
                        .queryParam("access_token", pageAccessToken)
                        .build(pageId))
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(response -> Boolean.TRUE.equals(response.get("success")))
                .onErrorResume(e -> {
                    log.error("Error subscribing app to page {}: {}", pageId, e.getMessage());
                    return Mono.just(false);
                });
    }

    public Mono<ChannelEntity> registerFacebookPage(Long tenantId, Long companyId, String pageId, String pageName, String pageAccessToken, String userAccessToken) {
        return subscribeAppToPage(pageId, pageAccessToken)
            .flatMap(subscribed -> {
                if (!subscribed) {
                    return Mono.error(new RuntimeException("Could not subscribe webhook to Facebook Page"));
                }
                
                ChannelEntity channel = new ChannelEntity();
                channel.setTenantId(tenantId);
                channel.setCompanyId(companyId);
                channel.setName(pageName);
                channel.setPlatform("FACEBOOK");
                channel.setProvider("META_API");
                channel.setStatus(true);
                channel.setCreatedAt(LocalDateTime.now());
                channel.setUpdatedAt(LocalDateTime.now());
                
                Map<String, String> settings = new HashMap<>();
                settings.put("pageId", pageId);
                settings.put("pageAccessToken", pageAccessToken);
                settings.put("userAccessToken", userAccessToken);
                
                try {
                    channel.setSettingsJson(objectMapper.writeValueAsString(settings));
                } catch (JsonProcessingException e) {
                    return Mono.error(new RuntimeException("Error formatting settings JSON", e));
                }
                
                return channelRepository.save(channel);
            });
    }

    public Mono<Map<String, Object>> sendMessage(String pageId, String recipientId, String text) {
        return channelRepository.findAll()
            .filter(ch -> "FACEBOOK".equals(ch.getPlatform()))
            .filter(ch -> {
                try {
                    if (ch.getSettingsJson() == null) return false;
                    Map<String, String> settings = objectMapper.readValue(ch.getSettingsJson(), new TypeReference<Map<String, String>>() {});
                    return pageId.equals(settings.get("pageId"));
                } catch (JsonProcessingException e) {
                    return false;
                }
            })
            .next()
            .flatMap(channel -> {
                try {
                    Map<String, String> settings = objectMapper.readValue(channel.getSettingsJson(), new TypeReference<Map<String, String>>() {});
                    String pageAccessToken = settings.get("pageAccessToken");
                    
                    Map<String, Object> body = new HashMap<>();
                    body.put("recipient", Map.of("id", recipientId));
                    body.put("message", Map.of("text", text));
                    body.put("messaging_type", "RESPONSE");
                    
                    return webClient.post()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/{pageId}/messages")
                                    .queryParam("access_token", pageAccessToken)
                                    .build(pageId))
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(body)
                            .retrieve()
                            .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
                } catch (Exception e) {
                    return Mono.error(e);
                }
            });
    }
}
