package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Detalle de Deducciones para Nómina Electrónica DIAN
 */
@Entity
@Table(name = "payroll_deducciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDeduccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_receipt_id", nullable = false)
    @JsonIgnore
    @ToString.Exclude
    private PayrollReceipt payrollReceipt;

    // === CLASIFICACIÓN DIAN (Concepto) ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concept_id")
    private PayrollConcept concept;

    @Column(name = "dian_code", length = 50, nullable = false)
    private String dianCode; // SALUD, PENSION, FONDO_SP, SINDICATO, LIBRANZA, ETC.

    @Column(name = "description", length = 255)
    private String description;

    // === VALORES ===
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage; // Ej: 4.00 para Salud/Pensión

    // === DETALLES ADICIONALES DIAN ===
    @Column(name = "fund_name", length = 200)
    private String fundName; // Nombre del Fondo (Salud, Pensión) o Entidad (Libranza)
}
