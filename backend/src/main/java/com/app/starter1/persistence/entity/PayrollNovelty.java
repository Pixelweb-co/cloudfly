package com.app.starter1.persistence.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

@Entity
@Table(name = "payroll_novelties")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PayrollNovelty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnore
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    @JsonIgnore
    private Employee employee;

    @Column(name = "employee_id", insertable = false, updatable = false)
    private Long employeeId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_period_id")
    @JsonIgnore
    private PayrollPeriod payrollPeriod;

    @Column(name = "payroll_period_id", insertable = false, updatable = false)
    private Long payrollPeriodId;

    @Enumerated(EnumType.STRING)
    @Column(name = "novelty_type", nullable = false)
    private NoveltyType type;

    @Column(nullable = false)
    private String description;

    // Fecha en que ocurre la novedad
    @Column(name = "novelty_date")
    private LocalDate date;

    // Valor monetario (ej. valor de la bonificación o total horas extras)
    @Column(precision = 19, scale = 2)
    private BigDecimal amount;

    // Cantidad (ej. número de horas o días)
    @Column(precision = 10, scale = 2)
    private BigDecimal quantity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private NoveltyStatus status; // PENDING, PROCESSED, CANCELLED

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public enum NoveltyType {
        EXTRA_HOUR_DAY, // Hora Extra Diurna
        EXTRA_HOUR_NIGHT, // Hora Extra Nocturna
        EXTRA_HOUR_SUNDAY, // Hora Extra Dominical/Festiva
        BONUS_SALARY, // Bonificación Salarial (Base Prestacional)
        BONUS_NON_SALARY, // Bonificación No Salarial
        COMMISSION, // Comisiones
        TRANSPORT_AID, // Auxilio Rodamiento/Transporte extra
        DEDUCTION_LOAN, // Préstamo
        DEDUCTION_OTHER, // Otra deducción
        SICK_LEAVE, // Incapacidad (Afecta días trabajados)
        LICENSE_MATERNITY, // Licencia Maternidad
        LICENSE_UNPAID // Licencia No Remunerada
    }

    public enum NoveltyStatus {
        PENDING,
        PROCESSED,
        CANCELLED
    }
}
