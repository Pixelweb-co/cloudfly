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
                                return Flux.fromIterable(stages)
                                        .flatMap(stage -> {
                                            // Count contacts in this stage with optional company filtering
                                            return contactRepository.countByPipelineAndStage(tenantId, companyId, pipeline.getId(), stage.getId())
                                                    .map(count -> PipelineStageStatsDTO.builder()
                                                            .stageId(stage.getId())
                                                            .name(stage.getName())
                                                            .color(stage.getColor())
                                                            .contactCount(count.intValue())
                                                            .position(stage.getPosition())
                                                            .build());
                                        })
                                        .collectList()
                                        .map(stageStats -> PipelineStatsDTO.builder()
                                                .pipelineId(pipeline.getId())
                                                .pipelineName(pipeline.getName())
                                                .stages(stageStats)
                                                .build());
                            });
                })
                .switchIfEmpty(Mono.error(new RuntimeException("No se encontró un pipeline activo para esta empresa.")));
    }
}
