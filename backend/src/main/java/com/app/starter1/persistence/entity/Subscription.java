package com.app.starter1.persistence.entity;

import com.app.starter1.persistence.entity.rbac.RbacModule;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "subscriptions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Referencia al Plan base (plantilla)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    // Referencia al Customer (tenant/organización)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Usuario que creó/gestiona la suscripción (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private UserEntity user;

    // ==================== PERIODO Y FACTURACIÓN ====================

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_cycle", nullable = false)
    private BillingCycle billingCycle = BillingCycle.MONTHLY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;

    @Column(name = "is_auto_renew")
    private Boolean isAutoRenew = false;

    // ==================== MÓDULOS CUSTOMIZADOS ====================
    // Los módulos de esta suscripción (pueden ser diferentes del plan base)
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "subscription_modules", joinColumns = @JoinColumn(name = "subscription_id"), inverseJoinColumns = @JoinColumn(name = "module_id"))
    @Builder.Default
    private Set<RbacModule> modules = new HashSet<>();

    // ==================== LÍMITES CUSTOMIZADOS ====================
    // Estos límites pueden ser mayores que los del plan base
    // Si son null, se usan los del plan

    @Column(name = "ai_tokens_limit")
    private Long aiTokensLimit;

    @Column(name = "electronic_docs_limit")
    private Integer electronicDocsLimit;

    @Column(name = "users_limit")
    private Integer usersLimit;

    // ==================== CONFIGURACIÓN DE SOBRECOSTOS ====================

    @Column(name = "allow_overage")
    private Boolean allowOverage;

    @Column(name = "ai_overage_price_per_1k", precision = 10, scale = 2)
    private BigDecimal aiOveragePricePer1k;

    @Column(name = "doc_overage_price_unit", precision = 10, scale = 2)
    private BigDecimal docOveragePriceUnit;

    // ==================== PRECIO CUSTOM ====================
    // Si el cliente tiene addons o descuentos, el precio puede diferir del plan

    @Column(name = "monthly_price", precision = 10, scale = 2)
    private BigDecimal monthlyPrice;

    @Column(name = "discount_percent", precision = 5, scale = 2)
    private BigDecimal discountPercent;

    // ==================== METADATOS ====================

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = SubscriptionStatus.ACTIVE;
        }
        if (this.billingCycle == null) {
            this.billingCycle = BillingCycle.MONTHLY;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // ==================== MÉTODOS DE UTILIDAD ====================

    /**
     * Obtiene el límite de tokens IA efectivo (custom o del plan)
     */
    public Long getEffectiveAiTokensLimit() {
        return aiTokensLimit != null ? aiTokensLimit : plan.getAiTokensLimit();
    }

    /**
     * Obtiene el límite de documentos electrónicos efectivo
     */
    public Integer getEffectiveElectronicDocsLimit() {
        return electronicDocsLimit != null ? electronicDocsLimit : plan.getElectronicDocsLimit();
    }

    /**
     * Obtiene el límite de usuarios efectivo
     */
    public Integer getEffectiveUsersLimit() {
        return usersLimit != null ? usersLimit : plan.getUsersLimit();
    }

    /**
     * Verifica si permite sobrecostos (custom o del plan)
     */
    public Boolean getEffectiveAllowOverage() {
        return allowOverage != null ? allowOverage : plan.getAllowOverage();
    }

    /**
     * Obtiene el precio de sobrecosto de IA efectivo
     */
    public BigDecimal getEffectiveAiOveragePricePer1k() {
        return aiOveragePricePer1k != null ? aiOveragePricePer1k : plan.getAiOveragePricePer1k();
    }

    /**
     * Obtiene el precio de sobrecosto de documentos efectivo
     */
    public BigDecimal getEffectiveDocOveragePriceUnit() {
        return docOveragePriceUnit != null ? docOveragePriceUnit : plan.getDocOveragePriceUnit();
    }
}
