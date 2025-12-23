package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa una Retención (IVA, ICA, Fuente)
 */
@Entity
@Table(name = "tax_withholdings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaxWithholding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Movimiento contable asociado
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entry_id", nullable = false)
    private AccountingEntry entry;

    /**
     * Tipo de retención
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "tax_type", nullable = false, length = 20)
    private TaxType taxType;

    /**
     * Código del concepto de retención
     */
    @Column(name = "tax_code", length = 10)
    private String taxCode;

    /**
     * Nombre del impuesto
     */
    @Column(name = "tax_name", length = 100)
    private String taxName;

    /**
     * Base gravable
     */
    @Column(name = "base_amount", precision = 15, scale = 2)
    private BigDecimal baseAmount;

    /**
     * Tarifa de retención (porcentaje)
     */
    @Column(name = "tax_rate", precision = 5, scale = 2)
    private BigDecimal taxRate;

    /**
     * Valor de la retención
     */
    @Column(name = "tax_amount", precision = 15, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    /**
     * Calcula el valor de la retención
     */
    public void calculateTaxAmount() {
        if (baseAmount != null && taxRate != null) {
            taxAmount = baseAmount.multiply(taxRate).divide(BigDecimal.valueOf(100));
        }
    }

    /**
     * Tipos de retención en Colombia
     */
    public enum TaxType {
        RETEFUENTE("Retención en la Fuente"),
        RETEIVA("Retención de IVA"),
        RETEICA("Retención de ICA");

        private final String description;

        TaxType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
