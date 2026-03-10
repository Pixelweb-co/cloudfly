package com.app.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubscriptionResponse {
    private Long id;
    private Long tenantId;
    private String tenantName;
    private Long planId;
    private String planName;
    private String billingCycle;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status;
    private Boolean isAutoRenew;
    private List<Long> moduleIds;
    private List<String> moduleNames;
    private Long effectiveAiTokensLimit;
    private Integer effectiveElectronicDocsLimit;
    private Integer effectiveUsersLimit;
    private Boolean effectiveAllowOverage;
    private BigDecimal effectiveAiOveragePricePer1k;
    private BigDecimal effectiveDocOveragePriceUnit;
    private BigDecimal monthlyPrice;
    private BigDecimal discountPercent;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
