package com.app.persistence.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("subscriptions")
public class SubscriptionEntity {

    @Id
    private Long id;

    @Column("plan_id")
    private Long planId;

    @Column("customer_id")
    private Long customerId;

    @Column("user_id")
    private Long userId;

    @Column("start_date")
    private LocalDateTime startDate;

    @Column("end_date")
    private LocalDateTime endDate;

    @Column("billing_cycle")
    private String billingCycle;

    private String status;

    @Column("is_auto_renew")
    private Boolean isAutoRenew;

    @Column("ai_tokens_limit")
    private Long aiTokensLimit;

    @Column("electronic_docs_limit")
    private Integer electronicDocsLimit;

    @Column("users_limit")
    private Integer usersLimit;

    @Column("allow_overage")
    private Boolean allowOverage;

    @Column("ai_overage_price_per_1k")
    private BigDecimal aiOveragePricePer1k;

    @Column("doc_overage_price_unit")
    private BigDecimal docOveragePriceUnit;

    @Column("monthly_price")
    private BigDecimal monthlyPrice;

    @Column("discount_percent")
    private BigDecimal discountPercent;

    private String notes;

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Explicit getter for VPS build
    public Long getId() { return id; }
}
