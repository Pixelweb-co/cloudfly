package com.app.starter1.dto;

import com.app.starter1.persistence.entity.Channel.ChannelType;
import jakarta.validation.constraints.NotNull;

public record ChannelCreateRequest(
        @NotNull(message = "El tipo de canal es requerido") ChannelType type,

        String name,
        String phoneNumber,
        String pageId,
        String username,
        String accessToken,
        String instanceName,
        String webhookUrl,
        String apiKey,
        String configuration) {
}
