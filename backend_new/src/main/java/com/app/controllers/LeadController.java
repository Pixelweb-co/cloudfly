package com.app.controllers;

import com.app.dto.leads.LeadRequest;
import com.app.dto.leads.LeadResponse;
import com.app.services.LeadOrchestratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/leads")
public class LeadController {

    private final LeadOrchestratorService leadOrchestratorService;

    @PostMapping("/generate")
    public Mono<LeadResponse> generateLeads(@RequestBody LeadRequest request) {
        log.info("📥 [LEAD-CONTROLLER] Received lead generation request for: {}", 
                 request.getFilters() != null ? request.getFilters().getKeyword() : "unknown");
        return leadOrchestratorService.generateLeads(request);
    }

    @PostMapping("/save-to-crm")
    public Mono<LeadResponse> saveToCrm(@RequestBody LeadResponse request, 
                                        @org.springframework.web.bind.annotation.RequestHeader java.util.Map<String, String> headers) {
        log.info("💾 [LEAD-CONTROLLER] Saving {} leads to CRM", 
                 request.getLeads() != null ? request.getLeads().size() : 0);
        return leadOrchestratorService.saveLeadsToCrm(request.getLeads(), headers);
    }
}
