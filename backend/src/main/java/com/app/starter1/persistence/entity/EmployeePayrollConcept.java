package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad para asignar conceptos de nómina a empleados específicos
 * (Percepciones o deducciones recurrentes por empleado)
 */
@Entity
@Table(name = "employee_payroll_concepts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeePayrollConcept {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === RELACIONES ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_concept_id", nullable = false)
    private PayrollConcept payrollConcept;

    // === CONFIGURACIÓN DEL CONCEPTO ===
    @Enumerated(EnumType.STRING)
    @Column(name = "amount_type", length = 20, nullable = false)
    private AmountType amountType; // FIXED_AMOUNT o PERCENTAGE

    @Column(name = "amount_value", precision = 12, scale = 2, nullable = false)
    private BigDecimal amountValue; // Monto fijo o porcentaje (ej: 1000.00 o 10.00)

    // === VIGENCIA ===
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate; // Fecha de inicio de aplicación

    @Column(name = "end_date")
    private LocalDate endDate; // Fecha de fin (null = indefinido)

    @Column(name = "is_recurring", nullable = false)
    private Boolean isRecurring = true; // Si se aplica en todos los periodos

    // === ESTATUS ===
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", length = 255)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === ENUMS ===
    public enum AmountType {
        FIXED_AMOUNT, // Monto fijo (ej: $500 de bono)
        PERCENTAGE // Porcentaje del salario base (ej: 10% de préstamo)
    }

    // Método helper para calcular el monto basado en salario base
    public BigDecimal calculateAmount(BigDecimal baseSalary) {
        if (amountType == AmountType.FIXED_AMOUNT) {
            return amountValue;
        } else {
            // Calcular porcentaje del salario base
            return baseSalary.multiply(amountValue).divide(new BigDecimal("100"));
        }
    }

    // Método para verificar si está vigente en una fecha específica
    public boolean isValidOn(LocalDate date) {
        if (!isActive)
            return false;
        if (date.isBefore(startDate))
            return false;
        if (endDate != null && date.isAfter(endDate))
            return false;
        return true;
    }
}
