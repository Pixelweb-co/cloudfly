package com.app.persistence.services;

import com.app.persistence.entity.PipelineEntity;
import com.app.persistence.entity.PipelineStageEntity;
import com.app.persistence.repository.PipelineRepository;
import com.app.persistence.repository.PipelineStageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
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
                .tenant_id(tenantId)
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
                            createStage(savedPipeline.getId(), "Nuevos", 0, true, false, "OPEN"),
                            createStage(savedPipeline.getId(), "Calificados", 1, false, false, "OPEN"),
                            createStage(savedPipeline.getId(), "En Proceso", 2, false, false, "OPEN"),
                            createStage(savedPipeline.getId(), "Cerrados (Ganado)", 3, false, true, "WON"),
                            createStage(savedPipeline.getId(), "Cerrados (Perdido)", 4, false, true, "LOST")
                    );
                    return pipelineStageRepository.saveAll(stages)
                            .collectList()
                            .thenReturn(savedPipeline);
                });
    }

    private PipelineStageEntity createStage(Long pipelineId, String name, int position, boolean isInitial, boolean isFinal, String outcome) {
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
