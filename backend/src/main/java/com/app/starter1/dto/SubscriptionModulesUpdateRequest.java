package com.app.starter1.dto;

import jakarta.validation.constraints.NotNull;
import java.util.Set;

public record SubscriptionModulesUpdateRequest(
        @NotNull(message = "Los IDs de módulos son requeridos") Set<Long> moduleIds) {
}
