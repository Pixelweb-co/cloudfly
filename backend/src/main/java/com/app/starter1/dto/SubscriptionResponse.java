package com.app.starter1.dto;

import com.app.starter1.persistence.entity.SubscriptionStatus;
import java.time.LocalDateTime;

public record SubscriptionResponse(
        Long id,
        Long userId,
        String userName,
        Long planId,
        String planName,
        LocalDateTime startDate,
        LocalDateTime endDate,
        SubscriptionStatus status,
        Boolean isAutoRenew,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
