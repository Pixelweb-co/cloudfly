package com.app.persistence.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerClient {

    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    @Value("${services.scheduler.url:http://scheduler-service:8080}")
    private String schedulerUrl;

    public Mono<Map<String, Object>> scheduleCampaign(Long campaignId, String campaignName, LocalDateTime scheduledAt, Long tenantId, Long companyId) {
        WebClient webClient = webClientBuilder.build();

        Map<String, Object> event = new HashMap<>();
        event.put("tenantId", tenantId);
        event.put("companyId", companyId);
        event.put("title", "Campaña: " + campaignName);
        event.put("description", "Ejecución automática de campaña de marketing");
        event.put("eventType", "KAFKA_QUEUE");
        event.put("eventSubtype", "CAMPAIGN_WORKER");
        event.put("startTime", scheduledAt);
        event.put("endTime", scheduledAt.plusMinutes(30));
        event.put("allDay", false);
        event.put("relatedEntityType", "CAMPAIGN");
        event.put("relatedEntityId", campaignId);
        
        // Payload for the scheduler to know where to send
        Map<String, Object> schedulerPayload = new HashMap<>();
        schedulerPayload.put("topic", "campaign-worker-queue");
        
        Map<String, Object> campaignData = new HashMap<>();
        campaignData.put("campaignId", campaignId);
        campaignData.put("tenantId", tenantId);
        campaignData.put("companyId", companyId);
        
        schedulerPayload.put("data", campaignData);
        
        try {
            event.put("payload", objectMapper.writeValueAsString(schedulerPayload));
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Error serializing scheduler payload", e));
        }

        log.info("📅 Scheduling campaign {} at {} via KAFKA_QUEUE", campaignId, scheduledAt);

        return webClient.post()
                .uri(schedulerUrl + "/api/events")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(event)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .doOnSuccess(res -> log.info("✅ Campaign {} scheduled successfully in scheduler", campaignId))
                .doOnError(err -> log.error("❌ Failed to schedule campaign {}: {}", campaignId, err.getMessage()));
    }
}
