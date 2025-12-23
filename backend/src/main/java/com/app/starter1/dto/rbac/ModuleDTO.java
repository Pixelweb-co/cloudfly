package com.app.starter1.dto.rbac;

import java.time.LocalDateTime;

public record ModuleDTO(
                Long id,
                String code,
                String name,
                String description,
                String icon,
                String menuPath,
                Integer displayOrder,
                Boolean isActive,
                String menuItems,
                LocalDateTime createdAt,
                LocalDateTime updatedAt) {
}
