package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Control de Períodos Fiscales
 */
@Entity
@Table(name = "accounting_fiscal_periods", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "tenant_id", "year", "month" })
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingFiscalPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Integer tenantId;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "month", nullable = false) // 1-12
    private Integer month;

    @Column(length = 20, nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "closed_by")
    private Long closedBy;

    // === METADATA ===
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum PeriodStatus {
        OPEN,
        CLOSED,
        LOCKED // Cierre definitivo
    }

    // Manual getter for id
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getTenantId() {
        return tenantId;
    }

    public Integer getYear() {
        return year;
    }

    public Integer getMonth() {
        return month;
    }

    public PeriodStatus getStatus() {
        return status;
    }
}
