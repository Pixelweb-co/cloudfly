package com.app.starter1.dto;

import com.app.starter1.persistence.entity.BillingCycle;
import com.app.starter1.persistence.entity.SubscriptionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SubscriptionResponse(
                Long id,
                Long tenantId,
                String tenantName,
                Long planId,
                String planName,
                BillingCycle billingCycle,
                LocalDateTime startDate,
                LocalDateTime endDate,
                SubscriptionStatus status,
                Boolean isAutoRenew,

                // Módulos incluidos en esta suscripción
                List<Long> moduleIds,
                List<String> moduleNames,

                // Límites efectivos (custom o del plan)
                Long effectiveAiTokensLimit,
                Integer effectiveElectronicDocsLimit,
                Integer effectiveUsersLimit,

                // Configuración de sobrecostos
                Boolean effectiveAllowOverage,
                BigDecimal effectiveAiOveragePricePer1k,
                BigDecimal effectiveDocOveragePriceUnit,

                // Precio efectivo
                BigDecimal monthlyPrice,
                BigDecimal discountPercent,

                String notes,
                LocalDateTime createdAt,
                LocalDateTime updatedAt) {
}
