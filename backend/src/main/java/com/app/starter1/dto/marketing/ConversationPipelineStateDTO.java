package com.app.starter1.dto.marketing;

import com.app.starter1.persistence.entity.ConversationPriority;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationPipelineStateDTO {
    private Long id;
    private Long tenantId;
    private String conversationId;
    private Long contactId;
    private Long pipelineId;
    private String pipelineName;
    private Long currentStageId;
    private String currentStageName;
    private String stageColor;
    private Long assignedToUserId;
    private ConversationPriority priority;
    private String source;
    private LocalDateTime enteredStageAt;
    private Boolean isActive;
}
