package com.app.starter1.dto.marketing;

import com.app.starter1.persistence.entity.ConversationPriority;
import lombok.Data;

@Data
public class PipelineKanbanCardDTO {
    private Long contactId;
    private String name;
    private String avatarUrl;
    private String conversationId;
    private String stage;
    private ConversationPriority priority;
}
