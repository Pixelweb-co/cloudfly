package com.app.starter1.services;

import com.app.starter1.dto.marketing.PipelineCreateRequest;
import com.app.starter1.dto.marketing.PipelineDTO;
import com.app.starter1.dto.marketing.PipelineStageCreateRequest;
import com.app.starter1.dto.marketing.PipelineStageDTO;
import com.app.starter1.persistence.entity.Pipeline;
import com.app.starter1.persistence.entity.PipelineStage;
import com.app.starter1.persistence.repository.PipelineRepository;
import com.app.starter1.persistence.repository.PipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.app.starter1.dto.marketing.PipelineKanbanCardDTO;
import com.app.starter1.persistence.entity.ConversationPipelineState;
import com.app.starter1.persistence.repository.ConversationPipelineStateRepository;

@Service
@RequiredArgsConstructor
public class PipelineService {

    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository stageRepository;
    private final ConversationPipelineStateRepository stateRepository;

    @Transactional(readOnly = true)
    public List<PipelineDTO> getAllPipelines(Long tenantId) {
        return pipelineRepository.findByTenantIdAndIsActiveTrueOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PipelineDTO getPipelineById(Long tenantId, Long id) {
        Pipeline pipeline = pipelineRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Pipeline not found"));
        return mapToDTO(pipeline);
    }

    @Transactional
    public PipelineDTO createPipeline(Long tenantId, Long userId, PipelineCreateRequest request) {
        if (request.getIsDefault() != null && request.getIsDefault()) {
            pipelineRepository.findByTenantIdAndIsDefaultTrue(tenantId).ifPresent(p -> {
                p.setIsDefault(false);
                pipelineRepository.save(p);
            });
        }

        Pipeline pipeline = Pipeline.builder()
                .tenantId(tenantId)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .color(request.getColor() != null ? request.getColor() : "#6366F1")
                .icon(request.getIcon())
                .isActive(true)
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .createdBy(userId)
                .build();

        Pipeline savedPipeline = pipelineRepository.save(pipeline);

        if (request.getStages() != null) {
            for (int i = 0; i < request.getStages().size(); i++) {
                PipelineStageCreateRequest stageReq = request.getStages().get(i);
                PipelineStage stage = PipelineStage.builder()
                        .pipeline(savedPipeline)
                        .name(stageReq.getName())
                        .description(stageReq.getDescription())
                        .color(stageReq.getColor() != null ? stageReq.getColor() : "#10B981")
                        .position(stageReq.getPosition() != null ? stageReq.getPosition() : i)
                        .isInitial(stageReq.getIsInitial() != null ? stageReq.getIsInitial() : (i == 0))
                        .isFinal(stageReq.getIsFinal() != null ? stageReq.getIsFinal() : false)
                        .outcome(stageReq.getOutcome())
                        .timeoutHours(stageReq.getTimeoutHours())
                        .rotationEnabled(false)
                        .build();
                stageRepository.save(stage);
                savedPipeline.getStages().add(stage);
            }
        }

        return mapToDTO(savedPipeline);
    }

    @Transactional(readOnly = true)
    public Map<String, List<PipelineKanbanCardDTO>> getKanbanData(Long tenantId, Long pipelineId) {
        List<ConversationPipelineState> states = stateRepository.findByPipelineIdAndIsActiveTrue(pipelineId);

        return states.stream()
                .filter(s -> s.getTenantId().equals(tenantId))
                .map(state -> {
                    PipelineKanbanCardDTO card = new PipelineKanbanCardDTO();
                    card.setContactId(state.getContactId());
                    // Dummy contact name mapping as generic fallback. 
                    // Should be linked with Contact entity if available in your project.
                    card.setName(state.getContactId() != null ? "Contact #" + state.getContactId() : "Desconocido");
                    card.setAvatarUrl(null);
                    card.setConversationId(state.getConversationId());
                    card.setStage(String.valueOf(state.getCurrentStage().getId()));
                    card.setPriority(state.getPriority());
                    return card;
                })
                .collect(Collectors.groupingBy(PipelineKanbanCardDTO::getStage));
    }

    @Transactional
    public void deletePipeline(Long tenantId, Long id) {
        Pipeline pipeline = pipelineRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new RuntimeException("Pipeline not found"));
        pipeline.setIsActive(false);
        pipelineRepository.save(pipeline);
    }

    private PipelineDTO mapToDTO(Pipeline pipeline) {
        PipelineDTO dto = new PipelineDTO();
        dto.setId(pipeline.getId());
        dto.setTenantId(pipeline.getTenantId());
        dto.setName(pipeline.getName());
        dto.setDescription(pipeline.getDescription());
        dto.setType(pipeline.getType());
        dto.setColor(pipeline.getColor());
        dto.setIcon(pipeline.getIcon());
        dto.setIsActive(pipeline.getIsActive());
        dto.setIsDefault(pipeline.getIsDefault());
        dto.setCreatedAt(pipeline.getCreatedAt());

        if (pipeline.getStages() != null) {
            dto.setStages(pipeline.getStages().stream().map(this::mapStageToDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    private PipelineStageDTO mapStageToDTO(PipelineStage stage) {
        PipelineStageDTO dto = new PipelineStageDTO();
        dto.setId(stage.getId());
        dto.setPipelineId(stage.getPipeline().getId());
        dto.setName(stage.getName());
        dto.setDescription(stage.getDescription());
        dto.setColor(stage.getColor());
        dto.setPosition(stage.getPosition());
        dto.setIsInitial(stage.getIsInitial());
        dto.setIsFinal(stage.getIsFinal());
        dto.setOutcome(stage.getOutcome());
        dto.setTimeoutHours(stage.getTimeoutHours());
        dto.setRotationEnabled(stage.getRotationEnabled());
        dto.setMaxConversations(stage.getMaxConversations());
        return dto;
    }
}
