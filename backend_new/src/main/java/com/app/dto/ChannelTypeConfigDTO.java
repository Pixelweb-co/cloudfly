package com.app.dto;

import java.time.LocalDateTime;

public record ChannelTypeConfigDTO(
    Long id,
    String typeName,
    String description,
    String webhookUrl,
    Boolean status,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
