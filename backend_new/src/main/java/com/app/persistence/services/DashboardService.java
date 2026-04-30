package com.app.persistence.services;

import com.app.dto.DashboardStatsDTO;
import com.app.dto.PipelineStageStatsDTO;
import com.app.dto.PipelineStatsDTO;
import com.app.dto.SalesChartDataDTO;
import com.app.persistence.entity.ContactEntity;
import com.app.persistence.entity.PipelineEntity;
import com.app.persistence.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
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
    private final OrderRepository orderRepository;

    public Mono<DashboardStatsDTO> getStats(Long tenantId, Long companyId) {
        log.info("Fetching dashboard stats for tenant: {} and company: {}", tenantId, companyId);
        
        Mono<Integer> totalCustomers = contactRepository.countTotalContacts(tenantId, companyId);
        Mono<Integer> totalProducts = productRepository.countByTenantId(tenantId);
        Mono<Integer> totalOrders = orderRepository.countByTenantIdAndCompanyId(tenantId, companyId);
        Mono<Double> totalRevenue = orderRepository.sumTotalByTenantIdAndCompanyId(tenantId, companyId);
        
        return Mono.zip(totalCustomers, totalProducts, totalOrders, totalRevenue)
                .map(tuple -> DashboardStatsDTO.builder()
                        .totalCustomers(tuple.getT1().intValue())
                        .totalProducts(tuple.getT2().intValue())
                        .totalOrders(tuple.getT3().intValue())
                        .totalRevenue(tuple.getT4())
                        .revenueChange(12.0) // Future: calculate from previous period
                        .activeConversations(5) // Future: count from messages table
                        .lowStockProducts(3) // Future: check stock levels
                        .build());
    }

    public Mono<SalesChartDataDTO> getSalesChart(Long tenantId, Long companyId, String period) {
        int days = period.equals("30d") ? 30 : 7;
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        
        return orderRepository.getSalesHistory(tenantId, companyId, since)
                .collectList()
                .map(rows -> {
                    List<String> categories = rows.stream()
                            .map(r -> r.get("date").toString())
                            .collect(Collectors.toList());
                    
                    List<Long> orderCounts = rows.stream()
                            .map(r -> ((Number) r.get("count")).longValue())
                            .collect(Collectors.toList());
                            
                    List<Double> revenueSums = rows.stream()
                            .map(r -> ((Number) r.get("total")).doubleValue())
                            .collect(Collectors.toList());

                    return com.app.dto.SalesChartDataDTO.builder()
                            .categories(categories)
                            .series(List.of(
                                com.app.dto.SalesChartDataDTO.Series.builder().name("Pedidos").data(orderCounts.stream().map(Long::doubleValue).collect(Collectors.toList())).build(),
                                com.app.dto.SalesChartDataDTO.Series.builder().name("Ingresos").data(revenueSums).build()
                            ))
                            .build();
                });
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
                                    // NEW: Fetch ALL contacts for the tenant once (very efficient for current scale ~11 contacts)
                                    // This bypasses ANY database-level filtering issues with parameters
                                    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
                                    
                                    return contactRepository.findByTenantId(tenantId)
                                            .collectList()
                                            .map(allContacts -> {
                                                // Filter by company AND date (last 30 days)
                                                List<ContactEntity> contacts = allContacts.stream()
                                                        .filter(c -> companyId == null || (c.getCompanyId() != null && c.getCompanyId().equals(companyId)))
                                                        .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().isAfter(thirtyDaysAgo))
                                                        .collect(Collectors.toList());
                                            
                                            log.info("📊 Aggregating stats for Pipeline: {} (ID: {}). Contacts to process: {}", 
                                                    pipeline.getName(), pipeline.getId(), contacts.size());
                                            
                                            List<PipelineStageStatsDTO> stageStats = stages.stream().map(stage -> {
                                                // Count by ID (precise) or by Name (fallback)
                                                long count = contacts.stream()
                                                        .filter(c -> {
                                                            boolean matchId = c.getStageId() != null && c.getStageId().equals(stage.getId());
                                                            boolean matchName = c.getStage() != null && c.getStage().equalsIgnoreCase(stage.getName());
                                                            
                                                            // Special case: if contact is 'LEAD' and we are looking at the first stage
                                                            boolean isFirstStageLEADFallback = (stage.getPosition() == 0 || stage.getName().equalsIgnoreCase("Prospecto")) 
                                                                    && "LEAD".equalsIgnoreCase(c.getStage());

                                                            return matchId || matchName || isFirstStageLEADFallback;
                                                        })
                                                        .count();
                                                
                                                log.info("  - Stage: {} (ID: {}), Count: {}", stage.getName(), stage.getId(), count);
                                                
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
