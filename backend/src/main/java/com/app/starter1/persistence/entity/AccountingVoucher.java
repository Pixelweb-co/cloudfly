package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa un Comprobante Contable
 */
@Entity
@Table(name = "accounting_vouchers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Tipo de comprobante
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "voucher_type", nullable = false, length = 20)
    private VoucherType voucherType;

    /**
     * Número consecutivo del comprobante
     */
    @Column(name = "voucher_number", nullable = false, length = 20)
    private String voucherNumber;

    /**
     * Fecha del comprobante
     */
    @Column(nullable = false)
    private LocalDate date;

    /**
     * Descripción general del comprobante
     */
    @Column(columnDefinition = "TEXT")
    private String description;

    /**
     * Referencia externa (número de factura, recibo, etc.)
     */
    @Column(length = 100)
    private String reference;

    /**
     * Estado del comprobante
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private VoucherStatus status = VoucherStatus.DRAFT;

    /**
     * ID del tenant (multi-tenancy)
     */
    @Column(name = "tenant_id", nullable = false)
    private Integer tenantId;

    /**
     * Usuario que creó el comprobante
     */
    @Column(name = "created_by")
    private Long createdBy;

    /**
     * Usuario que aprobó el comprobante
     */
    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Fecha de contabilización
     */
    @Column(name = "posted_at")
    private LocalDateTime postedAt;

    /**
     * Año fiscal
     */
    @Column(name = "fiscal_year")
    private Integer fiscalYear;

    /**
     * Período fiscal (1-12)
     */
    @Column(name = "fiscal_period")
    private Integer fiscalPeriod;

    /**
     * Total débitos
     */
    @Column(name = "total_debit", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalDebit = BigDecimal.ZERO;

    /**
     * Total créditos
     */
    @Column(name = "total_credit", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCredit = BigDecimal.ZERO;

    /**
     * Movimientos contables del comprobante
     */
    @OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AccountingEntry> entries = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (fiscalYear == null) {
            fiscalYear = date.getYear();
        }
        if (fiscalPeriod == null) {
            fiscalPeriod = date.getMonthValue();
        }
    }

    /**
     * Verifica si el comprobante está balanceado (débito = crédito)
     */
    public boolean isBalanced() {
        return totalDebit.compareTo(totalCredit) == 0;
    }

    /**
     * Verifica si el comprobante puede ser editado
     */
    public boolean isEditable() {
        return status == VoucherStatus.DRAFT;
    }

    /**
     * Verifica si el comprobante está contabilizado
     */
    public boolean isPosted() {
        return status == VoucherStatus.POSTED;
    }

    /**
     * Calcula los totales a partir de los movimientos
     */
    public void calculateTotals() {
        totalDebit = entries.stream()
                .map(AccountingEntry::getDebitAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        totalCredit = entries.stream()
                .map(AccountingEntry::getCreditAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Contabiliza el comprobante
     */
    public void post() {
        if (!isBalanced()) {
            throw new IllegalStateException("El comprobante no está balanceado");
        }
        this.status = VoucherStatus.POSTED;
        this.postedAt = LocalDateTime.now();
    }

    /**
     * Anula el comprobante
     */
    public void voidVoucher() {
        if (status == VoucherStatus.VOID) {
            throw new IllegalStateException("El comprobante ya está anulado");
        }
        this.status = VoucherStatus.VOID;
    }

    /**
     * Tipos de comprobante contable
     */
    public enum VoucherType {
        INGRESO("Comprobante de Ingreso"),
        EGRESO("Comprobante de Egreso"),
        NOTA_CONTABLE("Nota Contable"),
        APERTURA("Comprobante de Apertura"),
        CIERRE("Comprobante de Cierre");

        private final String description;

        VoucherType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    /**
     * Estados del comprobante
     */
    public enum VoucherStatus {
        DRAFT("Borrador"),
        POSTED("Contabilizado"),
        VOID("Anulado");

        private final String description;

        VoucherStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
