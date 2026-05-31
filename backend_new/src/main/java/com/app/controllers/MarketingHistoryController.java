package com.app.controllers;

import com.app.persistence.entity.GlobalAgent;
import com.app.persistence.entity.TenantAgentConfig;
import com.app.persistence.entity.WorkflowExecutionLogEntity;
import com.app.persistence.repository.GlobalAgentRepository;
import com.app.persistence.repository.TenantAgentConfigRepository;
import com.app.persistence.repository.WorkflowExecutionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for marketing agent history, live status, connections, and tasks.
 * Provides the initial data load for the Marketing Team Live Dashboard (CLOUD-212).
 *
 * Base path: /api/v1/marketing/agents
 */
@RestController
@RequestMapping("/api/v1/marketing/agents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarketingHistoryController {

    private final GlobalAgentRepository globalAgentRepository;
    private final TenantAgentConfigRepository tenantAgentConfigRepository;
    private final WorkflowExecutionLogRepository workflowExecutionLogRepository;

    // ========================================================================
    // DTOs (inline for simplicity — move to dto/ package if reused)
    // ========================================================================

    /** Live agent DTO returned to the frontend */
    public record MarketingAgentDto(
            String id,
            String name,
            String status,
            String currentTask,
            String lastActivity,
            String avatarUrl
    ) {}

    /** Directed connection between two agents */
    public record AgentConnectionDto(
            String from,
            String to,
            String label
    ) {}

    /** Marketing action event for the history timeline */
    public record MarketingActionEventDto(
            String id,
            String agentId,
            String agentName,
            String actionType,
            String description,
            String timestamp,
            Map<String, Object> metadata
    ) {}

    /** Response for live-status endpoint */
    public record LiveStatusResponse(
            List<MarketingAgentDto> agents,
            List<AgentConnectionDto> connections
    ) {}

    /** Response for history endpoint */
    public record MarketingHistoryResponse(
            List<MarketingAgentDto> agents,
            List<AgentConnectionDto> connections,
            List<MarketingActionEventDto> recentEvents,
            String generatedAt
    ) {}

    // ========================================================================
    // Endpoints
    // ========================================================================

    /**
     * GET /api/v1/marketing/agents/live-status?tenantId={}&companyId={}
     *
     * Returns all active agents with their current status and connections
     * for the initial dashboard load or WebSocket reconnection fallback.
     */
    @GetMapping("/live-status")
    public Mono<LiveStatusResponse> getLiveStatus(
            @RequestParam Long tenantId,
            @RequestParam(required = false) Long companyId,
            Authentication authentication) {

        return buildAgents(tenantId, companyId)
                .collectList()
                .flatMap(agents -> buildConnections(tenantId, companyId)
                        .collectList()
                        .map(connections -> new LiveStatusResponse(agents, connections)));
    }

    /**
     * GET /api/v1/marketing/agents/history?tenantId={}&limit={}&page={}&companyId={}
     *
     * Returns agent status, connections, and recent action history events
     * for the timeline component.
     */
    @GetMapping("/history")
    public Mono<MarketingHistoryResponse> getActionHistory(
            @RequestParam Long tenantId,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(required = false) Long companyId,
            Authentication authentication) {

        int offset = page * limit;

        return buildAgents(tenantId, companyId)
                .collectList()
                .flatMap(agents ->
                        buildConnections(tenantId, companyId)
                                .collectList()
                                .flatMap(connections ->
                                        buildRecentEvents(tenantId, companyId, limit, offset)
                                                .collectList()
                                                .map(events -> new MarketingHistoryResponse(
                                                        agents,
                                                        connections,
                                                        events,
                                                        LocalDateTime.now().toString()
                                                ))
                                )
                );
    }

    /**
     * GET /api/v1/marketing/agents/connections?tenantId={}
     *
     * Returns directed agent connections for the flow graph component.
     */
    @GetMapping("/connections")
    public Flux<AgentConnectionDto> getAgentConnections(
            @RequestParam Long tenantId,
            Authentication authentication) {

        return buildConnections(tenantId, null);
    }

    /**
     * GET /api/v1/marketing/agents/{agentId}/tasks
     *
     * Returns recent action events (tasks) for a specific agent.
     */
    @GetMapping("/{agentId}/tasks")
    public Flux<MarketingActionEventDto> getAgentTasks(
            @PathVariable String agentId,
            Authentication authentication) {

        Long tenantId = getTenantId(authentication);
        Long companyId = getCompanyId(authentication);

        return workflowExecutionLogRepository
                .findByTenantIdAndCompanyId(tenantId, companyId != null ? companyId : 0L)
                .filter(log -> agentId.equals(String.valueOf(log.getWorkflowId())))
                .sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .take(50)
                .map(log -> new MarketingActionEventDto(
                        String.valueOf(log.getId()),
                        agentId,
                        "Agent-" + log.getWorkflowId(),
                        "WORKFLOW_EXECUTION",
                        resolveActionDescription(log),
                        log.getCreatedAt().toString(),
                        buildMetadata(log)
                ));
    }

    // ========================================================================
    // Private builder methods
    // ========================================================================

    /**
     * Build agent DTOs from global agents + tenant-specific configs.
     * If companyId is provided, filters to company-scoped configs.
     */
    private Flux<MarketingAgentDto> buildAgents(Long tenantId, Long companyId) {
        return globalAgentRepository.findByIsActiveTrue()
                .flatMap(globalAgent ->
                        tenantAgentConfigRepository
                                .findByTenantIdAndGlobalAgentId(tenantId, globalAgent.getId())
                                .defaultIfEmpty(TenantAgentConfig.builder()
                                        .tenantId(tenantId)
                                        .globalAgentId(globalAgent.getId())
                                        .displayName(globalAgent.getName())
                                        .isActive(true)
                                        .build())
                                .map(config -> new MarketingAgentDto(
                                        String.valueOf(globalAgent.getId()),
                                        config.getDisplayName() != null ? config.getDisplayName() : globalAgent.getName(),
                                        "idle",  // Default status; real-time status comes via WebSocket
                                        "Waiting for tasks",
                                        LocalDateTime.now().toString(),
                                        null
                                ))
                );
    }

    /**
     * Build agent connection DTOs.
     * For now, creates a simple chain: Agent1 -> Agent2 -> Agent3.
     * TODO: Replace with dynamic connection resolution from a dedicated table.
     */
    private Flux<AgentConnectionDto> buildConnections(Long tenantId, Long companyId) {
        return globalAgentRepository.findByIsActiveTrue()
                .collectList()
                .flatMapMany(agents -> {
                    List<AgentConnectionDto> connections = new ArrayList<>();
                    for (int i = 0; i < agents.size() - 1; i++) {
                        connections.add(new AgentConnectionDto(
                                String.valueOf(agents.get(i).getId()),
                                String.valueOf(agents.get(i + 1).getId()),
                                "feeds into"
                        ));
                    }
                    return Flux.fromIterable(connections);
                });
    }

    /**
     * Build recent action events from workflow execution logs.
     */
    private Flux<MarketingActionEventDto> buildRecentEvents(Long tenantId, Long companyId, int limit, int offset) {
        Flux<WorkflowExecutionLogEntity> logs;
        if (companyId != null) {
            logs = workflowExecutionLogRepository
                    .findByTenantIdAndCompanyId(tenantId, companyId)
                    .sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        } else {
            logs = workflowExecutionLogRepository
                    .findByTenantIdAndCompanyId(tenantId, 0L)
                    .sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        }

        return logs
                .skip(offset)
                .take(limit)
                .map(log -> new MarketingActionEventDto(
                        String.valueOf(log.getId()),
                        String.valueOf(log.getWorkflowId()),
                        "Agent-" + log.getWorkflowId(),
                        "WORKFLOW_EXECUTION",
                        resolveActionDescription(log),
                        log.getCreatedAt().toString(),
                        buildMetadata(log)
                ));
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    private String resolveActionDescription(WorkflowExecutionLogEntity log) {
        if ("SUCCESS".equals(log.getStatus())) {
            return "Workflow executed successfully";
        } else if ("FAILED".equals(log.getStatus())) {
            return "Workflow execution failed: " + (log.getErrorMessage() != null ? log.getErrorMessage() : "Unknown error");
        } else if ("FILTERED".equals(log.getStatus())) {
            return "Workflow filtered (conditions not met)";
        }
        return "Workflow status: " + log.getStatus();
    }

    private Map<String, Object> buildMetadata(WorkflowExecutionLogEntity log) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("status", log.getStatus());
        meta.put("executionTimeMs", log.getExecutionTimeMs());
        meta.put("companyId", log.getCompanyId());
        if (log.getErrorMessage() != null) {
            meta.put("error", log.getErrorMessage());
        }
        return meta;
    }

    private Long getTenantId(Authentication authentication) {
        if (authentication == null) return 1L;
        Map<String, Object> details = (Map<String, Object>) authentication.getDetails();
        if (details != null && details.containsKey("customer_id")) {
            return (Long) details.get("customer_id");
        }
        return 1L;
    }

    private Long getCompanyId(Authentication authentication) {
        if (authentication == null) return null;
        Map<String, Object> details = (Map<String, Object>) authentication.getDetails();
        if (details != null && details.containsKey("company_id")) {
            return (Long) details.get("company_id");
        }
        return null;
    }
}
