package com.app.starter1.dto;

import jakarta.validation.constraints.NotNull;

public record SubscriptionCreateRequest(
        @NotNull(message = "El ID del plan es requerido")
        Long planId,
        
        Boolean isAutoRenew
) {
}
