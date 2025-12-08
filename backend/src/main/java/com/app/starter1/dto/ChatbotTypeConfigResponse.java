package com.app.starter1.dto;

import java.time.LocalDateTime;

public record ChatbotTypeConfigResponse(
        Long id,
        String typeName,
        String description,
        String webhookUrl,
        Boolean status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
