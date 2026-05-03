package com.app.services;

import com.app.dto.leads.LeadRequest;
import com.app.dto.leads.LeadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Service
@Slf4j
public class LeadOrchestratorService {

    private final WebClient webClient;

    public LeadOrchestratorService(WebClient.Builder webClientBuilder, 
                                 @Value("${lead-generator.url:http://lead-generator:8000}") String leadGenUrl) {
        this.webClient = webClientBuilder.baseUrl(leadGenUrl).build();
    }

    public Mono<LeadResponse> generateLeads(LeadRequest request) {
        log.info("🚀 [LEAD-ORCHESTRATOR] Forwarding lead generation request: {}", request.getFilters().getKeyword());
        long startTime = System.currentTimeMillis();

        return webClient.post()
                .uri("/leads/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(LeadResponse.class)
                .timeout(Duration.ofSeconds(10))
                .doOnSuccess(response -> {
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("✅ [LEAD-ORCHESTRATOR] Received {} leads in {}ms", 
                        response.getLeads() != null ? response.getLeads().size() : 0, duration);
                })
                .doOnError(error -> log.error("❌ [LEAD-ORCHESTRATOR] Error calling lead-generator: {}", error.getMessage()))
                .onErrorResume(e -> Mono.error(new RuntimeException("Error orquestando la generación de leads: " + e.getMessage())));
    }
}
