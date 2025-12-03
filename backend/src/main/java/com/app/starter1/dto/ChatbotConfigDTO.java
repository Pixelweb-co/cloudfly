package com.app.starter1.dto;

import com.app.starter1.persistence.entity.ChatbotType;
import lombok.Data;

@Data
public class ChatbotConfigDTO {
    private Long id;
    private Long tenantId;
    private String instanceName;
    private ChatbotType chatbotType;
    private Boolean isActive;
    private String n8nWebhookUrl;
    private String context;
    private String apiKey;
    private String qrCode; // Base64 QR Code for activation
}
