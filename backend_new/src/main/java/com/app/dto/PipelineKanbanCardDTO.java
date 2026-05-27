package com.app.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private Integer unreadCount;
    private Boolean chatbotEnabled;
    private String phone;
    private String channel;
}
