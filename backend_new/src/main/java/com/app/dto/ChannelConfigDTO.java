package com.app.dto;

import com.app.persistence.entity.ChannelType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelConfigDTO {
    private Long id;
    private Long tenantId;
    private String instanceName;
    private ChannelType channelType;
    private Boolean isActive;
    private String n8nWebhookUrl;
    private String context;
    private String agentName;
    private String apiKey;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // UI specific fields
    private String qrCode;
    private Boolean isConnected;
    private Boolean exists;
}
