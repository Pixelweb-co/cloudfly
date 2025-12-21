package com.app.starter1.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PlanResponse(
                Long id,
                String name,
                String description,
                BigDecimal price,
                Integer durationDays,
                Boolean isActive,
                LocalDateTime createdAt,
                LocalDateTime updatedAt,

                Long aiTokensLimit,
                Integer electronicDocsLimit,
                Integer usersLimit,

                Boolean allowOverage,
                BigDecimal aiOveragePricePer1k,
                BigDecimal docOveragePriceUnit,

                java.util.Set<Long> moduleIds,
                java.util.List<String> moduleNames) {
}
