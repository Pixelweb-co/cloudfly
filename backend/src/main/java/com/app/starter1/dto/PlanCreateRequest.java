package com.app.starter1.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;

public record PlanCreateRequest(
        @NotBlank(message = "El nombre del plan es requerido") 
        String name,
        
        String description,
        
        @NotNull(message = "El precio es requerido")
        @Positive(message = "El precio debe ser mayor a 0")
        BigDecimal price,
        
        @NotNull(message = "La duración en días es requerida")
        @Positive(message = "La duración debe ser mayor a 0")
        Integer durationDays
) {
}
