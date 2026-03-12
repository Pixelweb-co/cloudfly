package com.app.starter1.dto;

import com.app.starter1.persistence.entity.BillingCycle;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

public record SubscriptionCreateRequest(
                @NotNull(message = "El ID del plan es requerido") Long planId,

                @NotNull(message = "El ID del tenant es requerido") Long tenantId,

                BillingCycle billingCycle,

                LocalDateTime startDate,
                LocalDateTime endDate,

                Boolean isAutoRenew,

                // Módulos customizados (opcional, si es null se usan los del plan)
                Set<Long> customModuleIds,

                // Límites customizados (opcional, si son null se usan los del plan)
                Long customAiTokensLimit,
                Integer customElectronicDocsLimit,
                Integer customUsersLimit,

                // Precio y descuento custom (opcional)
                BigDecimal customMonthlyPrice,
                BigDecimal discountPercent,

                String notes) {
}
