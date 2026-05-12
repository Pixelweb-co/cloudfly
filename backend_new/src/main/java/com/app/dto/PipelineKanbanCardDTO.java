package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineKanbanCardDTO {
    private String conversationId;
    private Long contactId;
    private String name;
    private String avatarUrl;
    private String stage;
    private String priority;
}
