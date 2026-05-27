package com.app.starter1.dto;

public record SubscriptionLimitsUpdateRequest(
        Long aiTokensLimit,
        Integer electronicDocsLimit,
        Integer usersLimit) {
}
