package com.app.persistence.services;

import com.app.dto.*;
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

    public Mono<PipelineEntity> createDefaultPipeline(Long tenantId) {
        log.info("🛠️ Creating default pipeline for tenant: {}", tenantId);
        
        PipelineEntity pipeline = PipelineEntity.builder()
                .tenantId(tenantId)
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

    public Flux<PipelineDto> getAllPipelines(Long tenantId) {
        return pipelineRepository.findByTenantId(tenantId)
                .flatMap(pipeline -> pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipeline.getId())
                        .collectList()
                        .map(stages -> mapToDto(pipeline, stages)));
    }

    public Mono<PipelineDto> getPipelineById(Long tenantId, Long id) {
        return pipelineRepository.findByIdAndTenantId(id, tenantId)
                .flatMap(pipeline -> pipelineStageRepository.findByPipelineIdOrderByPositionAsc(pipeline.getId())
                        .collectList()
                        .map(stages -> mapToDto(pipeline, stages)));
    }

    @Transactional
    public Mono<PipelineDto> createPipeline(Long tenantId, Long userId, PipelineCreateRequest request) {
        PipelineEntity pipeline = PipelineEntity.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : "MARKETING")
                .color(request.getColor())
                .icon(request.getIcon())
                .isActive(true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .build();

        return pipelineRepository.save(pipeline)
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
    public Mono<PipelineDto> updatePipeline(Long tenantId, Long id, PipelineCreateRequest request) {
        return pipelineRepository.findByIdAndTenantId(id, tenantId)
                .flatMap(existing -> {
                    existing.setName(request.getName());
                    existing.setDescription(request.getDescription());
                    existing.setType(request.getType());
                    existing.setColor(request.getColor());
                    existing.setIcon(request.getIcon());
                    existing.setDefault(request.getIsDefault() != null ? request.getIsDefault() : existing.isDefault());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return pipelineRepository.save(existing);
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
    public Mono<Void> deletePipeline(Long tenantId, Long id) {
        return pipelineRepository.findByIdAndTenantId(id, tenantId)
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
}
