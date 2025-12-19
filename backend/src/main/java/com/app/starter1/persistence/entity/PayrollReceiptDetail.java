package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Entidad para el detalle de cada recibo de nómina
 * (Desglose de percepciones y deducciones)
 */
@Entity
@Table(name = "payroll_receipt_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollReceiptDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === RELACIONES ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_receipt_id", nullable = false)
    private PayrollReceipt payrollReceipt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_concept_id", nullable = false)
    private PayrollConcept payrollConcept;

    // === INFORMACIÓN DEL DETALLE ===
    @Enumerated(EnumType.STRING)
    @Column(name = "concept_type", length = 20, nullable = false)
    private PayrollConcept.ConceptType conceptType; // PERCEPCION o DEDUCCION

    @Column(name = "concept_name", length = 100, nullable = false)
    private String conceptName; // Nombre del concepto (snapshot)

    @Column(name = "concept_code", length = 20)
    private String conceptCode; // Código del concepto (snapshot)

    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "is_taxable", nullable = false)
    private Boolean isTaxable = true;

    @Column(name = "notes", length = 255)
    private String notes;

    @Column(name = "sort_order")
    private Integer sortOrder; // Orden de presentación en el recibo

    // Método helper
    public boolean isPerception() {
        return conceptType == PayrollConcept.ConceptType.PERCEPCION;
    }

    public boolean isDeduction() {
        return conceptType == PayrollConcept.ConceptType.DEDUCCION;
    }
}
