package com.app.persistence.services;

import com.app.dto.DashboardStatsDTO;
import com.app.dto.PipelineStageStatsDTO;
import com.app.dto.PipelineStatsDTO;
import com.app.persistence.entity.PipelineEntity;
import com.app.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final ContactRepository contactRepository;
    private final ProductRepository productRepository;
    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository pipelineStageRepository;

    public Mono<DashboardStatsDTO> getStats(Long tenantId, Long companyId) {
        log.info("Fetching dashboard stats for tenant: {} and company: {}", tenantId, companyId);
        
        Mono<Long> totalCustomers = contactRepository.countByTenantIdAndOptionalCompanyId(tenantId, companyId);
        Mono<Long> totalProducts = productRepository.countByTenantId(tenantId);
        
        return Mono.zip(totalCustomers, totalProducts)
                .map(tuple -> DashboardStatsDTO.builder()
                        .totalCustomers(tuple.getT1().intValue())
                        .totalProducts(tuple.getT2().intValue())
                        .totalRevenue(24500.0) // Mock
                        .revenueChange(12.0)
                        .totalOrders(156)
                        .activeConversations(5)
                        .lowStockProducts(3)
                        .build());
    }

    public Mono<PipelineStatsDTO> getPipelineStats(Long tenantId, Long companyId) {
        log.info("Fetching pipeline stats for tenant: {} and company: {}", tenantId, companyId);
        
        Flux<PipelineEntity> pipelineFlux = (companyId != null)
                ? pipelineRepository.findByTenantIdAndCompanyId(tenantId, companyId)
                : pipelineRepository.findByTenantId(tenantId);

        return pipelineFlux
                .collectList()
                .flatMap(pipelines -> {
                    if (pipelines.isEmpty()) {
                        return Mono.error(new RuntimeException("No se encontró un pipeline activo para esta empresa."));
                    }
                    
                    // Prioritize default pipeline
                    PipelineEntity pipeline = pipelines.stream()
                            .filter(PipelineEntity::isDefault)
                            .findFirst()
                            .orElse(pipelines.get(0));

                    return pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipeline.getId())
                            .collectList()
                            .flatMap(stages -> {
                                // Fetch ALL contacts for this pipeline once to aggregate in memory (more reliable than SQL count with complex filters)
                                return contactRepository.findByPipelineId(tenantId, companyId, pipeline.getId())
                                        .collectList()
                                        .map(contacts -> {
                                            log.info("📊 Aggregating stats for Pipeline: {}. Total contacts found: {}", pipeline.getName(), contacts.size());
                                            
                                            List<PipelineStageStatsDTO> stageStats = stages.stream().map(stage -> {
                                                // Count by ID (precise) or by Name (fallback for legacy or automated imports)
                                                long count = contacts.stream()
                                                        .filter(c -> (c.getStageId() != null && c.getStageId().equals(stage.getId())) ||
                                                                    (c.getStage() != null && c.getStage().equalsIgnoreCase(stage.getName())))
                                                        .count();
                                                
                                                log.debug("  - Stage: {} (ID: {}), Count: {}", stage.getName(), stage.getId(), count);
                                                
                                                return PipelineStageStatsDTO.builder()
                                                        .stageId(stage.getId())
                                                        .name(stage.getName())
                                                        .color(stage.getColor())
                                                        .contactCount((int) count)
                                                        .position(stage.getPosition())
                                                        .build();
                                            }).collect(Collectors.toList());

                                            return PipelineStatsDTO.builder()
                                                    .pipelineId(pipeline.getId())
                                                    .pipelineName(pipeline.getName())
                                                    .stages(stageStats)
                                                    .build();
                                        });
                            });
                })
                .switchIfEmpty(Mono.error(new RuntimeException("No se encontró un pipeline activo para esta empresa.")));
    }
}
