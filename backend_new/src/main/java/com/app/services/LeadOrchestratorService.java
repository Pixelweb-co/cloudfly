package com.app.services;

import com.app.dto.leads.LeadDTO;
import com.app.dto.leads.LeadRequest;
import com.app.dto.leads.LeadResponse;
import com.app.persistence.entity.ContactEntity;
import com.app.persistence.services.ContactService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Slf4j
public class LeadOrchestratorService {

    private final WebClient webClient;
    private final ContactService contactService;

    public LeadOrchestratorService(WebClient.Builder webClientBuilder, 
                                 ContactService contactService,
                                 @Value("${lead-generator.url:http://lead-generator:8000}") String leadGenUrl) {
        this.webClient = webClientBuilder.baseUrl(leadGenUrl).build();
        this.contactService = contactService;
    }

    public Mono<LeadResponse> generateLeads(LeadRequest request) {
        log.info("🚀 [LEAD-ORCHESTRATOR] Forwarding lead generation request: {}", request.getFilters().getKeyword());
        long startTime = System.currentTimeMillis();

        return webClient.post()
                .uri("/leads/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(LeadResponse.class)
                .timeout(Duration.ofSeconds(90))
                .doOnSuccess(response -> {
                    long duration = System.currentTimeMillis() - startTime;
                    log.info("✅ [LEAD-ORCHESTRATOR] Received {} leads in {}ms", 
                        response.getLeads() != null ? response.getLeads().size() : 0, duration);
                })
                .doOnError(error -> log.error("❌ [LEAD-ORCHESTRATOR] Error calling lead-generator: {}", error.getMessage()))
                .onErrorResume(e -> Mono.error(new RuntimeException("Error orquestando la generación de leads: " + e.getMessage())));
    }

    public Mono<LeadResponse> saveLeadsToCrm(List<LeadDTO> leads, Map<String, String> headers) {
        return getCurrentUserContext(headers)
                .flatMap(ctx -> {
                    log.info("💾 [LEAD-ORCHESTRATOR] Saving {} leads for Tenant: {}, Company: {}", 
                             leads.size(), ctx.tenantId, ctx.companyId);
                    
                    return Flux.fromIterable(leads)
                            .flatMap(lead -> {
                                ContactEntity entity = new ContactEntity();
                                entity.setName(lead.getName());
                                entity.setPhone(lead.getPhone());
                                entity.setAddress(lead.getCity());
                                
                                if (lead.getCompany() != null && !lead.getCompany().isEmpty()) {
                                    entity.setName(lead.getName() + " (" + lead.getCompany() + ")");
                                }
                                
                                return contactService.create(entity, ctx.tenantId, ctx.companyId)
                                        .onErrorResume(e -> {
                                            log.warn("⚠️ [LEAD-ORCHESTRATOR] Error saving individual lead {}: {}", 
                                                     lead.getName(), e.getMessage());
                                            return Mono.empty(); 
                                        });
                            })
                            .collectList()
                            .map(savedList -> {
                                log.info("✅ [LEAD-ORCHESTRATOR] Successfully saved {}/{} leads to CRM", 
                                         savedList.size(), leads.size());
                                return LeadResponse.builder()
                                        .status("success")
                                        .leads(leads)
                                        .build();
                            });
                });
    }

    private record UserContext(Long tenantId, Long companyId) {}

    private Mono<UserContext> getCurrentUserContext(Map<String, String> headers) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> {
                    if (auth == null || auth.getDetails() == null) {
                        return new UserContext(1L, null);
                    }

                    Map<String, Object> details = (Map<String, Object>) auth.getDetails();
                    Long tokenTenantId = (Long) details.get("customer_id");
                    Long tokenCompanyId = (Long) details.get("company_id");
                    Set<String> roles = auth.getAuthorities().stream()
                            .map(a -> a.getAuthority())
                            .collect(Collectors.toSet());

                    boolean isAdminOrManager = roles.contains("ROLE_ADMIN") || roles.contains("ROLE_MANAGER");

                    Long finalTenantId = tokenTenantId;
                    if (isAdminOrManager && (headers.containsKey("x-tenant-id") || headers.containsKey("X-Tenant-Id"))) {
                        finalTenantId = Long.parseLong(headers.getOrDefault("x-tenant-id", headers.get("X-Tenant-Id")));
                    }

                    Long finalCompanyId = tokenCompanyId;
                    if (isAdminOrManager && (headers.containsKey("x-company-id") || headers.containsKey("X-Company-Id"))) {
                        finalCompanyId = Long.parseLong(headers.getOrDefault("x-company-id", headers.get("X-Company-Id")));
                    }

                    return new UserContext(finalTenantId, finalCompanyId);
                })
                .switchIfEmpty(Mono.just(new UserContext(1L, null)));
    }
}
