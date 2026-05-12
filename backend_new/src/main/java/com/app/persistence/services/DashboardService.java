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
    private final OmniChannelMessageRepository messageRepository;
    private final MarketingCampaignRepository campaignRepository;
    private final QuoteRepository quoteRepository;
    private final AppointmentRepository appointmentRepository;

    public Mono<DashboardStatsDTO> getStats(Long tenantId, Long companyId) {
        log.info("📊 Fetching comprehensive dashboard stats for tenant: {} and company: {}", tenantId, companyId);
        
        Mono<Integer> totalCustomers = contactRepository.countTotalContacts(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> totalContactsToday = contactRepository.countContactsToday(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> totalProducts = productRepository.countByTenantIdAndCompanyId(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> totalOrders = orderRepository.countByTenantIdAndCompanyId(tenantId, companyId).defaultIfEmpty(0);
        Mono<Double> totalRevenue = orderRepository.sumTotalByTenantIdAndCompanyId(tenantId, companyId).defaultIfEmpty(0.0);
        
        Mono<Integer> activeConversations = messageRepository.countActiveConversations(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> messagesToday = messageRepository.countMessagesToday(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> activeCampaigns = campaignRepository.countActiveCampaigns(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> totalQuotes = quoteRepository.countByTenantIdAndCompanyId(tenantId, companyId).defaultIfEmpty(0);
        Mono<Integer> pendingAppointments = appointmentRepository.countPendingAppointments(tenantId, companyId).defaultIfEmpty(0);
        
        LocalDateTime startOfDay = LocalDateTime.now().with(java.time.LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.now().with(java.time.LocalTime.MAX);
        
        Mono<List<com.app.dto.RecentOrderDTO>> recentOrders = orderRepository.findRecentOrders(tenantId, companyId)
                .map(order -> com.app.dto.RecentOrderDTO.builder()
                        .id(order.getId())
                        .customerName(order.getCustomerName() != null ? order.getCustomerName() : "Consumidor Final")
                        .total(order.getTotal() != null ? order.getTotal().doubleValue() : 0.0)
                        .status(order.getStatus() != null ? order.getStatus().toString() : "PENDING")
                        .date(order.getCreatedAt().toString())
                        .build())
                .collectList()
                .defaultIfEmpty(List.of());

        Mono<List<com.app.dto.TodayAppointmentDTO>> todayAppointments = appointmentRepository.findTodayAppointments(tenantId, companyId, startOfDay, endOfDay)
                .flatMap(app -> {
                    if (app.getContactId() != null) {
                        return contactRepository.findById(app.getContactId())
                                .map(contact -> com.app.dto.TodayAppointmentDTO.builder()
                                        .id(app.getId())
                                        .contactName(contact.getName())
                                        .time(app.getStartTime().toLocalTime().toString())
                                        .service(app.getTitle())
                                        .status(app.getStatus())
                                        .build())
                                .defaultIfEmpty(com.app.dto.TodayAppointmentDTO.builder()
                                        .id(app.getId())
                                        .contactName("Invitado")
                                        .time(app.getStartTime().toLocalTime().toString())
                                        .service(app.getTitle())
                                        .status(app.getStatus())
                                        .build());
                    }
                    return Mono.just(com.app.dto.TodayAppointmentDTO.builder()
                            .id(app.getId())
                            .contactName("Invitado")
                            .time(app.getStartTime().toLocalTime().toString())
                            .service(app.getTitle())
                            .status(app.getStatus())
                            .build());
                })
                .collectList()
                .defaultIfEmpty(List.of());

        log.info("📊 Step 1: Starting queries zip...");
        
        return Mono.zip(
                objects -> {
                    log.info("📊 Step 2: All queries completed. Building DTO...");
                    return DashboardStatsDTO.builder()
                        .totalCustomers((Integer) objects[0])
                        .totalProducts((Integer) objects[1])
                        .totalOrders((Integer) objects[2])
                        .totalRevenue((Double) objects[3])
                        .activeConversations((Integer) objects[4])
                        .totalMessagesToday((Integer) objects[5])
                        .activeCampaigns((Integer) objects[6])
                        .totalQuotes((Integer) objects[7])
                        .totalContactsToday((Integer) objects[8])
                        .pendingAppointments((Integer) objects[9])
                        .recentOrders((List<com.app.dto.RecentOrderDTO>) objects[10])
                        .todayAppointments((List<com.app.dto.TodayAppointmentDTO>) objects[11])
                        .revenueChange(15.4)
                        .ordersChange(8.2)
                        .customersChange(12.5)
                        .messagesChange(24.0)
                        .lowStockProducts(2)
                        .pendingQuotes(5)
                        .build();
                },
                totalCustomers, totalProducts, totalOrders, totalRevenue, activeConversations, messagesToday, activeCampaigns, totalQuotes, totalContactsToday, pendingAppointments, recentOrders, todayAppointments)
                .doOnError(e -> log.error("❌ Error in dashboard stats zip: {}", e.getMessage(), e));
    }

    public Mono<SalesChartDataDTO> getSalesChart(Long tenantId, Long companyId, String period) {
        int days = period.equals("30d") ? 30 : 7;
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        
        return orderRepository.getSalesHistory(tenantId, companyId, since)
                .collectList()
                .map(rows -> {
                    List<String> categories = rows.stream()
                            .map(r -> r.getDate().toString())
                            .collect(Collectors.toList());
                    
                    List<Long> orderCounts = rows.stream()
                            .map(r -> r.getCount())
                            .collect(Collectors.toList());
                            
                    List<Double> revenueSums = rows.stream()
                            .map(r -> r.getTotal() != null ? r.getTotal() : 0.0)
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
                                    LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
                                    
                                    return contactRepository.findByTenantId(tenantId)
                                            .collectList()
                                            .map(allContacts -> {
                                                List<ContactEntity> contacts = allContacts.stream()
                                                        .filter(c -> companyId == null || (c.getCompanyId() != null && c.getCompanyId().equals(companyId)))
                                                        .filter(c -> c.getCreatedAt() == null || c.getCreatedAt().isAfter(thirtyDaysAgo))
                                                        .collect(Collectors.toList());
                                            
                                            log.info("📊 Aggregating stats for Pipeline: {} (ID: {}). Contacts to process: {}", 
                                                    pipeline.getName(), pipeline.getId(), contacts.size());
                                            
                                            List<PipelineStageStatsDTO> stageStats = stages.stream().map(stage -> {
                                                long count = contacts.stream()
                                                        .filter(c -> {
                                                            boolean matchId = c.getStageId() != null && c.getStageId().equals(stage.getId());
                                                            boolean matchName = c.getStage() != null && c.getStage().equalsIgnoreCase(stage.getName());
                                                            
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
