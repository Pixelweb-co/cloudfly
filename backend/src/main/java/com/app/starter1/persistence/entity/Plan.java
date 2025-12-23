package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "plans")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer durationDays;

    @Column(nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_free", nullable = false)
    @Builder.Default
    private Boolean isFree = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // --- SaaS Limits & Quotas ---
    @Column(name = "ai_tokens_limit")
    private Long aiTokensLimit;

    @Column(name = "electronic_docs_limit")
    private Integer electronicDocsLimit;

    @Column(name = "users_limit")
    private Integer usersLimit;

    // --- Overage / Consumption Costs ---
    @Column(name = "allow_overage")
    @Builder.Default
    private Boolean allowOverage = false;

    @Column(name = "ai_overage_price_per_1k")
    private BigDecimal aiOveragePricePer1k;

    @Column(name = "doc_overage_price_unit")
    private BigDecimal docOveragePriceUnit;

    // --- Relationship with Modules ---
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "plans_modules", joinColumns = @JoinColumn(name = "plan_id"), inverseJoinColumns = @JoinColumn(name = "module_id"))
    private java.util.Set<com.app.starter1.persistence.entity.rbac.RbacModule> modules = new java.util.HashSet<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
