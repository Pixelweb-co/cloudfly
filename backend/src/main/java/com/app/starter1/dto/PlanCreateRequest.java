package com.app.starter1.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import java.math.BigDecimal;

public record PlanCreateRequest(
        @NotBlank(message = "El nombre del plan es requerido") String name,

        String description,

        @NotNull(message = "El precio es requerido") @PositiveOrZero(message = "El precio debe ser 0 o mayor") BigDecimal price,

        @NotNull(message = "La duración en días es requerida") @Positive(message = "La duración debe ser mayor a 0") Integer durationDays,

        Long aiTokensLimit,
        Integer electronicDocsLimit,
        Integer usersLimit,

        Boolean allowOverage,
        BigDecimal aiOveragePricePer1k,
        BigDecimal docOveragePriceUnit,

        java.util.Set<Long> moduleIds) {
}
