package com.app.starter1.dto;

import java.time.LocalDateTime;

public record CategoryResponse(
        Long id,
        String nombreCategoria,
        String description,
        Long parentCategory,
        Boolean status,
        Long tenantId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
