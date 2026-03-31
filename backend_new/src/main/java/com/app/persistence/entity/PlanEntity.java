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
@Table("plans")
public class PlanEntity {

    @Id
    private Long id;

    private String name;

    private String description;

    private BigDecimal price;

    @Column("duration_days")
    private Integer durationDays;

    @Column("is_active")
    private Boolean isActive;

    @Column("is_free")
    private Boolean isFree;

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

    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("updated_at")
    private LocalDateTime updatedAt;

    // Explicit getters for VPS build
    public Long getId() { return id; }
    public String getName() { return name; }
    public Integer getDurationDays() { return durationDays; }
    public Long getAiTokensLimit() { return aiTokensLimit; }
    public Integer getUsersLimit() { return usersLimit; }
}
