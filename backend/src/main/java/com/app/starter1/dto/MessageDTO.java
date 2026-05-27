package com.app.starter1.dto;

import com.app.starter1.persistence.entity.MessageDirection;
import com.app.starter1.persistence.entity.MessageStatus;
import com.app.starter1.persistence.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private String conversationId;
    private Long contactId;
    private MessageDirection direction;
    private MessageType messageType;
    private String body;
    private String mediaUrl;
    private String title;
    private String displayName;
    private MessageStatus status;
    private LocalDateTime sentAt;
    private LocalDateTime deliveredAt;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private String externalMessageId;
    private String externalQuotedMessageId;
}
