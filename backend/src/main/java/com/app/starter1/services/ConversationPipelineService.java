package com.app.starter1.services;

import com.app.starter1.dto.marketing.ConversationPipelineStateDTO;
import com.app.starter1.dto.marketing.MoveConversationRequest;
import com.app.starter1.persistence.entity.ConversationPipelineState;
import com.app.starter1.persistence.entity.Pipeline;
import com.app.starter1.persistence.entity.PipelineStage;
import com.app.starter1.persistence.repository.ConversationPipelineStateRepository;
import com.app.starter1.persistence.repository.PipelineRepository;
import com.app.starter1.persistence.repository.PipelineStageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ConversationPipelineService {

    private final ConversationPipelineStateRepository stateRepository;
    private final PipelineRepository pipelineRepository;
    private final PipelineStageRepository stageRepository;

    @Transactional
    public ConversationPipelineStateDTO assignToPipeline(Long tenantId, String conversationId, Long pipelineId, Long stageId) {
        Pipeline pipeline = pipelineRepository.findByIdAndTenantId(pipelineId, tenantId)
                .orElseThrow(() -> new RuntimeException("Pipeline not found"));
                
        PipelineStage stage = stageRepository.findById(stageId)
                .orElseThrow(() -> new RuntimeException("Stage not found"));

        ConversationPipelineState state = stateRepository.findByTenantIdAndConversationId(tenantId, conversationId)
                .orElseGet(() -> ConversationPipelineState.builder()
                        .tenantId(tenantId)
                        .conversationId(conversationId)
                        .build());

        state.setPipeline(pipeline);
        state.setCurrentStage(stage);
        state.setEnteredStageAt(LocalDateTime.now());
        state.setIsActive(true);

        ConversationPipelineState saved = stateRepository.save(state);
        return mapToDTO(saved);
    }

    @Transactional
    public ConversationPipelineStateDTO moveConversation(Long tenantId, String conversationId, MoveConversationRequest request) {
        ConversationPipelineState state = stateRepository.findByTenantIdAndConversationId(tenantId, conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found in any pipeline"));

        PipelineStage newStage = stageRepository.findById(request.getToStageId())
                .orElseThrow(() -> new RuntimeException("Target stage not found"));

        if (!newStage.getPipeline().getId().equals(state.getPipeline().getId())) {
            throw new RuntimeException("Target stage does not belong to the current pipeline");
        }

        // Si cambia de etapa, actualizar fecha de entrada
        if (!state.getCurrentStage().getId().equals(newStage.getId())) {
            state.setCurrentStage(newStage);
            state.setEnteredStageAt(LocalDateTime.now());
        }

        ConversationPipelineState saved = stateRepository.save(state);
        return mapToDTO(saved);
    }

    @Transactional(readOnly = true)
    public ConversationPipelineStateDTO getState(Long tenantId, String conversationId) {
        ConversationPipelineState state = stateRepository.findByTenantIdAndConversationId(tenantId, conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation pipeline state not found"));
        return mapToDTO(state);
    }

    private ConversationPipelineStateDTO mapToDTO(ConversationPipelineState state) {
        ConversationPipelineStateDTO dto = new ConversationPipelineStateDTO();
        dto.setId(state.getId());
        dto.setTenantId(state.getTenantId());
        dto.setConversationId(state.getConversationId());
        dto.setContactId(state.getContactId());
        dto.setPipelineId(state.getPipeline().getId());
        dto.setPipelineName(state.getPipeline().getName());
        dto.setCurrentStageId(state.getCurrentStage().getId());
        dto.setCurrentStageName(state.getCurrentStage().getName());
        dto.setStageColor(state.getCurrentStage().getColor());
        dto.setAssignedToUserId(state.getAssignedToUserId());
        dto.setPriority(state.getPriority());
        dto.setSource(state.getSource());
        dto.setEnteredStageAt(state.getEnteredStageAt());
        dto.setIsActive(state.getIsActive());
        return dto;
    }
}
