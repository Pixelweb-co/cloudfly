package com.app.starter1.dto;

import com.app.starter1.persistence.entity.Channel.ChannelType;

import java.time.LocalDateTime;

public record ChannelDTO(
        Long id,
        Long customerId,
        ChannelType type,
        String name,
        Boolean isActive,
        Boolean isConnected,
        String phoneNumber,
        String pageId,
        String username,
        String instanceName,
        String webhookUrl,
        LocalDateTime lastSync,
        String lastError,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
