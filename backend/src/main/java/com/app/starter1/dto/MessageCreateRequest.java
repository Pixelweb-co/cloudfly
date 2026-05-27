package com.app.starter1.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MessageCreateRequest {
    @NotBlank(message = "conversationId is required")
    private String conversationId;

    @NotNull(message = "tenantId is required")
    private Long tenantId;

    private Long fromUserId;

    @NotBlank(message = "direction is required")
    private String direction; // INBOUND or OUTBOUND

    private String messageType = "TEXT"; // TEXT, IMAGE, AUDIO, etc.

    @NotBlank(message = "platform is required")
    private String platform = "WHATSAPP"; // WHATSAPP, FACEBOOK_MESSENGER, etc.

    private String body;

    private String mediaUrl;

    private String title;

    private String externalQuotedMessageId;
}
