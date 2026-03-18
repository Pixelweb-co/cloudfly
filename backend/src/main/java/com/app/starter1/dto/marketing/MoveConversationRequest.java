package com.app.starter1.dto.marketing;

import lombok.Data;

@Data
public class MoveConversationRequest {
    private Long contactId;
    private String conversationId;
    private Long toStageId;
    private String reason;
}
