package com.app.persistence.services;

import com.app.dto.*;
import com.app.dto.UnreadChatSummaryDto;
import com.app.persistence.entity.PipelineEntity;
import com.app.persistence.entity.PipelineStageEntity;
import com.app.persistence.repository.PipelineRepository;
import com.app.persistence.repository.PipelineStageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository pipelineStageRepository;
    private final com.app.persistence.repository.ConversationPipelineStateRepository stateRepository;
    private final com.app.persistence.repository.ContactRepository contactRepository;
    private final com.app.persistence.repository.OmniChannelMessageRepository messageRepository;
    private final com.app.persistence.repository.ChannelRepository channelRepository;

    public Mono<PipelineEntity> createDefaultPipeline(Long tenantId, Long companyId) {
        log.info("🛠️ Creating default pipeline for tenant: {} and company: {}", tenantId, companyId);
        
        PipelineEntity pipeline = PipelineEntity.builder()
                .tenantId(tenantId)
                .companyId(companyId)
                .name("Atención a Clientes")
                .description("Pipeline base para la gestión de prospectos y clientes.")
                .type("MARKETING")
                .color("#6366F1")
                .icon("tabler-message-2")
                .isActive(true)
                .isDefault(true)
                .createdAt(LocalDateTime.now())
                .build();

        return pipelineRepository.save(pipeline)
                .flatMap(savedPipeline -> {
                    List<PipelineStageEntity> stages = List.of(
                            createDefaultStage(savedPipeline.getId(), "Nuevos", 0, true, false, "OPEN"),
                            createDefaultStage(savedPipeline.getId(), "Calificados", 1, false, false, "OPEN"),
                            createDefaultStage(savedPipeline.getId(), "En Proceso", 2, false, false, "OPEN"),
                            createDefaultStage(savedPipeline.getId(), "Cerrados (Ganado)", 3, false, true, "WON"),
                            createDefaultStage(savedPipeline.getId(), "Cerrados (Perdido)", 4, false, true, "LOST")
                    );
                    return pipelineStageRepository.saveAll(stages)
                            .collectList()
                            .thenReturn(savedPipeline);
                });
    }

    public Flux<PipelineDto> getAllPipelines(Long tenantId, Long companyId) {
        Flux<PipelineEntity> pipelineFlux;
        if (companyId != null) {
            log.info("🔍 Filtering pipelines for tenant {} and company {}", tenantId, companyId);
            pipelineFlux = pipelineRepository.findByTenantIdAndCompanyId(tenantId, companyId);
        } else {
            log.info("🌐 Fetching all pipelines for tenant {}", tenantId);
            pipelineFlux = pipelineRepository.findByTenantId(tenantId);
        }

        return pipelineFlux
                .flatMap(pipeline -> pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipeline.getId())
                        .collectList()
                        .map(stages -> mapToDto(pipeline, stages)));
    }

    public Mono<PipelineDto> getPipelineById(Long tenantId, Long companyId, Long id) {
        return pipelineRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(pipeline -> pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipeline.getId())
                        .collectList()
                        .map(stages -> mapToDto(pipeline, stages)));
    }

    @Transactional
    public Mono<PipelineDto> createPipeline(Long tenantId, Long companyId, Long userId, PipelineCreateRequest request) {
        PipelineEntity pipeline = PipelineEntity.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .color(request.getColor())
                .icon(request.getIcon())
                .isActive(true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .companyId(companyId != null ? companyId : request.getCompanyId())
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        Mono<Void> clearDefaultsMono = Boolean.TRUE.equals(request.getIsDefault()) 
                ? clearOtherDefaults(tenantId, companyId, null) 
                : Mono.empty();

        return clearDefaultsMono.then(pipelineRepository.save(pipeline))
                .flatMap(savedPipeline -> {
                    if (request.getStages() == null || request.getStages().isEmpty()) {
                        return Mono.just(mapToDto(savedPipeline, List.of()));
                    }
                    List<PipelineStageEntity> stageEntities = request.getStages().stream()
                            .map(s -> PipelineStageEntity.builder()
                                    .pipelineId(savedPipeline.getId())
                                    .name(s.getName())
                                    .description(s.getDescription())
                                    .color(s.getColor())
                                    .position(s.getPosition())
                                    .isInitial(s.getIsInitial() != null ? s.getIsInitial() : false)
                                    .isFinal(s.getIsFinal() != null ? s.getIsFinal() : false)
                                    .outcome(s.getOutcome())
                                    .timeoutHours(s.getTimeoutHours())
                                    .createdAt(LocalDateTime.now())
                                    .build())
                            .toList();
                    return pipelineStageRepository.saveAll(stageEntities)
                            .collectList()
                            .map(savedStages -> mapToDto(savedPipeline, savedStages));
                });
    }

    @Transactional
    public Mono<PipelineDto> updatePipeline(Long tenantId, Long companyId, Long id, PipelineCreateRequest request) {
        return pipelineRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(existing -> {
                    existing.setName(request.getName());
                    existing.setDescription(request.getDescription());
                    existing.setType(request.getType());
                    existing.setColor(request.getColor());
                    existing.setIcon(request.getIcon());
                    existing.setDefault(request.getIsDefault() != null ? request.getIsDefault() : existing.isDefault());
                    existing.setUpdatedAt(LocalDateTime.now());
                    Mono<Void> clearDefaultsMono = Boolean.TRUE.equals(request.getIsDefault()) 
                            ? clearOtherDefaults(tenantId, companyId, id) 
                            : Mono.empty();

                    return clearDefaultsMono.then(pipelineRepository.save(existing));
                })
                .flatMap(savedPipeline -> pipelineStageRepository.deleteByPipelineId(savedPipeline.getId())
                        .thenMany(Flux.fromIterable(request.getStages() != null ? request.getStages() : List.of()))
                        .map(s -> PipelineStageEntity.builder()
                                .pipelineId(savedPipeline.getId())
                                .name(s.getName())
                                .description(s.getDescription())
                                .color(s.getColor())
                                .position(s.getPosition())
                                .isInitial(s.getIsInitial() != null ? s.getIsInitial() : false)
                                .isFinal(s.getIsFinal() != null ? s.getIsFinal() : false)
                                .outcome(s.getOutcome())
                                .timeoutHours(s.getTimeoutHours())
                                .createdAt(LocalDateTime.now())
                                .build())
                        .collectList()
                        .flatMapMany(pipelineStageRepository::saveAll)
                        .collectList()
                        .map(savedStages -> mapToDto(savedPipeline, savedStages)));
    }

    @Transactional
    public Mono<Void> deletePipeline(Long tenantId, Long companyId, Long id) {
        return pipelineRepository.findByIdAndTenantIdAndCompanyId(id, tenantId, companyId)
                .flatMap(pipeline -> pipelineStageRepository.deleteByPipelineId(pipeline.getId())
                        .then(pipelineRepository.delete(pipeline)));
    }

    private PipelineDto mapToDto(PipelineEntity pipeline, List<PipelineStageEntity> stages) {
        return PipelineDto.builder()
                .id(pipeline.getId())
                .tenantId(pipeline.getTenantId())
                .name(pipeline.getName())
                .description(pipeline.getDescription())
                .type(pipeline.getType())
                .color(pipeline.getColor())
                .icon(pipeline.getIcon())
                .isActive(pipeline.isActive())
                .isDefault(pipeline.isDefault())
                .companyId(pipeline.getCompanyId())
                .createdAt(pipeline.getCreatedAt())
                .stages(stages.stream().map(this::mapStageToDto).toList())
                .build();
    }

    private PipelineStageDto mapStageToDto(PipelineStageEntity stage) {
        return PipelineStageDto.builder()
                .id(stage.getId())
                .pipelineId(stage.getPipelineId())
                .name(stage.getName())
                .description(stage.getDescription())
                .color(stage.getColor())
                .position(stage.getPosition())
                .isInitial(stage.isInitial())
                .isFinal(stage.isFinal())
                .outcome(stage.getOutcome())
                .timeoutHours(stage.getTimeoutHours())
                .build();
    }

    private PipelineStageEntity createDefaultStage(Long pipelineId, String name, int position, boolean isInitial, boolean isFinal, String outcome) {
        return PipelineStageEntity.builder()
                .pipelineId(pipelineId)
                .name(name)
                .position(position)
                .isInitial(isInitial)
                .isFinal(isFinal)
                .outcome(outcome)
                .color(isFinal ? (outcome.equals("WON") ? "#10B981" : "#EF4444") : "#10B981")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Mono<Void> clearOtherDefaults(Long tenantId, Long companyId, Long excludeId) {
        return pipelineRepository.findByTenantIdAndCompanyIdAndIsDefaultTrue(tenantId, companyId)
                .filter(p -> excludeId == null || !p.getId().equals(excludeId))
                .flatMap(p -> {
                    p.setDefault(false);
                    return pipelineRepository.save(p);
                })
                .then();
    }

    public Mono<java.util.Map<String, java.util.List<PipelineKanbanCardDTO>>> getKanbanData(Long tenantId, Long companyId, Long pipelineId) {
        // Fetch all channels for this tenant to map channelId -> platform
        Mono<java.util.Map<Long, String>> channelsMapMono = channelRepository.findByTenantId(tenantId)
                .collectList()
                .map(list -> list.stream().collect(java.util.stream.Collectors.toMap(
                        com.app.persistence.entity.ChannelEntity::getId,
                        com.app.persistence.entity.ChannelEntity::getPlatform,
                        (v1, v2) -> v1
                )));

        // Fetch unread counts
        Mono<java.util.Map<Long, Integer>> unreadMapMono = messageRepository.countUnreadGroupedByContactAndCompany(tenantId, companyId)
                .collectList()
                .map(list -> list.stream().collect(java.util.stream.Collectors.toMap(
                        UnreadChatSummaryDto::getContactId,
                        s -> s.getCnt().intValue(),
                        (v1, v2) -> v1
                )));

        return Mono.zip(channelsMapMono, unreadMapMono)
                .flatMap(tuple -> {
                    java.util.Map<Long, String> channelsMap = tuple.getT1();
                    java.util.Map<Long, Integer> unreadMap = tuple.getT2();

                    return stateRepository.findByTenantIdAndPipelineIdAndIsActiveTrue(tenantId, pipelineId)
                            .flatMap(state -> contactRepository.findById(state.getContactId())
                                    .flatMap(contact -> {
                                        return messageRepository.findLastByContactId(tenantId, companyId, contact.getId())
                                                .map(lastMsg -> {
                                                    String platform = lastMsg.getChannelId() != null ? channelsMap.get(lastMsg.getChannelId()) : "UNKNOWN";
                                                    return PipelineKanbanCardDTO.builder()
                                                            .contactId(contact.getId())
                                                            .name(contact.getName())
                                                            .avatarUrl(contact.getAvatarUrl())
                                                            .conversationId(state.getConversationId())
                                                            .stage(String.valueOf(state.getCurrentStageId()))
                                                            .priority(state.getPriority())
                                                            .chatbotEnabled(contact.getChatbotEnabled())
                                                            .phone(contact.getPhone())
                                                            .unreadCount(unreadMap.getOrDefault(contact.getId(), 0))
                                                            .lastMessage(lastMsg.getBody())
                                                            .lastMessageAt(lastMsg.getCreatedAt())
                                                            .channel(platform)
                                                            .build();
                                                })
                                                .defaultIfEmpty(PipelineKanbanCardDTO.builder()
                                                        .contactId(contact.getId())
                                                        .name(contact.getName())
                                                        .avatarUrl(contact.getAvatarUrl())
                                                        .conversationId(state.getConversationId())
                                                        .stage(String.valueOf(state.getCurrentStageId()))
                                                        .priority(state.getPriority())
                                                        .chatbotEnabled(contact.getChatbotEnabled())
                                                        .phone(contact.getPhone())
                                                        .unreadCount(unreadMap.getOrDefault(contact.getId(), 0))
                                                        .channel("UNKNOWN")
                                                        .build());
                                    }))
                            .collectList()
                            .map((java.util.List<PipelineKanbanCardDTO> cards) -> {
                                // Sort: Unread first, then by lastMessageAt desc
                                return cards.stream()
                                        .sorted((PipelineKanbanCardDTO a, PipelineKanbanCardDTO b) -> {
                                            // 1. Unread count priority
                                            int unreadComp = b.getUnreadCount().compareTo(a.getUnreadCount());
                                            if (unreadComp != 0) return unreadComp;
                                            
                                            // 2. Recency priority
                                            if (a.getLastMessageAt() == null && b.getLastMessageAt() == null) return 0;
                                            if (a.getLastMessageAt() == null) return 1;
                                            if (b.getLastMessageAt() == null) return -1;
                                            return b.getLastMessageAt().compareTo(a.getLastMessageAt());
                                        })
                                        .collect(java.util.stream.Collectors.groupingBy(
                                                (PipelineKanbanCardDTO card) -> card.getStage(),
                                                java.util.stream.Collectors.collectingAndThen(
                                                        java.util.stream.Collectors.toList(),
                                                        list -> list.stream().limit(10).collect(java.util.stream.Collectors.toList())
                                                )
                                        ));
                            });
                });
    }

    @Transactional
    public Mono<Void> updateCardStage(Long tenantId, Long companyId, Long pipelineId, Long contactId, Long targetStageId) {
        log.info("🎯 Moving contact {} in pipeline {} to stage {}", contactId, pipelineId, targetStageId);
        return stateRepository.findByTenantIdAndPipelineIdAndContactId(tenantId, pipelineId, contactId)
                .flatMap(state -> {
                    state.setCurrentStageId(targetStageId);
                    state.setEnteredStageAt(LocalDateTime.now());
                    state.setUpdatedAt(LocalDateTime.now());
                    return stateRepository.save(state);
                })
                .then();
    }

    @Transactional
    public Mono<Void> assignConversationToPipeline(Long tenantId, Long companyId, Long pipelineId, String conversationId, Long stageId) {
        log.info("🔗 Assigning conversation {} to pipeline {} (stage {})", conversationId, pipelineId, stageId);
        
        return contactRepository.findByUuid(conversationId) // Assuming conversationId is contact UUID here based on previous patterns
                .switchIfEmpty(contactRepository.findByTenantIdAndCompanyIdAndPhone(tenantId, companyId, conversationId))
                .flatMap(contact -> {
                    return stateRepository.findByTenantIdAndPipelineIdAndContactId(tenantId, pipelineId, contact.getId())
                            .switchIfEmpty(Mono.defer(() -> {
                                return pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipelineId)
                                        .collectList()
                                        .flatMap(stages -> {
                                            Long targetStage = stageId != null ? stageId : (stages.isEmpty() ? null : stages.get(0).getId());
                                            com.app.persistence.entity.ConversationPipelineStateEntity newState = com.app.persistence.entity.ConversationPipelineStateEntity.builder()
                                                    .tenantId(tenantId)
                                                    .companyId(companyId)
                                                    .pipelineId(pipelineId)
                                                    .contactId(contact.getId())
                                                    .conversationId(conversationId)
                                                    .currentStageId(targetStage)
                                                    .isActive(true)
                                                    .priority("MEDIUM")
                                                    .enteredStageAt(LocalDateTime.now())
                                                    .createdAt(LocalDateTime.now())
                                                    .updatedAt(LocalDateTime.now())
                                                    .build();
                                            return stateRepository.save(newState);
                                        });
                            }))
                            .flatMap(state -> {
                                if (stageId != null) {
                                    state.setCurrentStageId(stageId);
                                    state.setUpdatedAt(LocalDateTime.now());
                                    return stateRepository.save(state);
                                }
                                return Mono.just(state);
                            });
                })
                .then();
    }
}
