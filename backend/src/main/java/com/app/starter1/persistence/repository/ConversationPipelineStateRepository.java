package com.app.starter1.persistence.repository;

import com.app.starter1.persistence.entity.ConversationPipelineState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationPipelineStateRepository extends JpaRepository<ConversationPipelineState, Long> {
    
    Optional<ConversationPipelineState> findByTenantIdAndConversationId(Long tenantId, String conversationId);
    
    List<ConversationPipelineState> findByPipelineIdAndIsActiveTrue(Long pipelineId);
    
    List<ConversationPipelineState> findByCurrentStageIdAndIsActiveTrue(Long stageId);
    
    List<ConversationPipelineState> findByPipelineIdAndIsActiveTrueOrderByEnteredStageAtDesc(Long pipelineId);
}
