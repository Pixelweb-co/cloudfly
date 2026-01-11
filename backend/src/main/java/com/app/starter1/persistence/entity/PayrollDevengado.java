package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Detalle de Devengos para Nómina Electrónica DIAN
 */
@Entity
@Table(name = "payroll_devengados")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PayrollDevengado {

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
    private String dianCode; // BASICO, TRANSPORTE, HED, HEN, COMISION, etc.

    @Column(name = "description", length = 255)
    private String description;

    // === VALORES ===
    @Column(name = "amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity; // Horas o Días

    @Column(name = "percentage", precision = 5, scale = 2)
    private BigDecimal percentage; // Porcentaje (si aplica)

    // === FECHAS (Para H.E., Vacaciones, Incapacidades) ===
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    // === PAGO NO SALARIAL ===
    @Column(name = "is_salary", nullable = false)
    @Builder.Default
    private Boolean isSalary = true; // true=Salarial, false=No Salarial (Viáticos, algunos bonos)

    // === DETALLES ADICIONALES DIAN ===
    @Column(name = "payment_type", length = 50)
    private String paymentType; // Solo para algunos conceptos (ej: "SALARIAL", "NO_SALARIAL")
}
