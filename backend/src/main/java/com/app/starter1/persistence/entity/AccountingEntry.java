package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa un Movimiento Contable (línea de un comprobante)
 */
@Entity
@Table(name = "accounting_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountingEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Comprobante al que pertenece este movimiento
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voucher_id", nullable = false)
    private AccountingVoucher voucher;

    /**
     * Número de línea dentro del comprobante
     */
    @Column(name = "line_number")
    private Integer lineNumber;

    /**
     * Código de la cuenta contable
     */
    @ManyToOne
    @JoinColumn(name = "account_code", referencedColumnName = "code", nullable = false)
    private ChartOfAccount account;

    /**
     * Tercero asociado (cliente, proveedor, empleado, etc.)
     */
    @ManyToOne
    @JoinColumn(name = "third_party_id")
    private Contact thirdParty;

    /**
     * Centro de costo
     */
    @ManyToOne
    @JoinColumn(name = "cost_center_id")
    private CostCenter costCenter;

    /**
     * Descripción del movimiento
     */
    @Column(length = 255)
    private String description;

    /**
     * Valor débito
     */
    @Column(name = "debit_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal debitAmount = BigDecimal.ZERO;

    /**
     * Valor crédito
     */
    @Column(name = "credit_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal creditAmount = BigDecimal.ZERO;

    /**
     * Base para cálculo de retenciones
     */
    @Column(name = "base_value", precision = 15, scale = 2)
    private BigDecimal baseValue;

    /**
     * Valor del impuesto (IVA, etc.)
     */
    @Column(name = "tax_value", precision = 15, scale = 2)
    private BigDecimal taxValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Obtiene el valor neto del movimiento (débito - crédito)
     */
    public BigDecimal getNetAmount() {
        return debitAmount.subtract(creditAmount);
    }

    /**
     * Verifica si es un débito
     */
    public boolean isDebit() {
        return debitAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Verifica si es un crédito
     */
    public boolean isCredit() {
        return creditAmount.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Valida que el movimiento tenga solo débito O crédito, NO ambos
     */
    public boolean isValid() {
        boolean hasDebit = debitAmount.compareTo(BigDecimal.ZERO) > 0;
        boolean hasCredit = creditAmount.compareTo(BigDecimal.ZERO) > 0;
        return hasDebit != hasCredit; // XOR: solo uno debe ser verdadero
    }
}
