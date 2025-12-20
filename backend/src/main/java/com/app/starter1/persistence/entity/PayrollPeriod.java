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
import java.util.HashSet;
import java.util.Set;

/**
 * Entidad para periodos de nómina
 */
@Entity
@Table(name = "payroll_periods")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con Customer
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // === INFORMACIÓN DEL PERIODO ===
    @Enumerated(EnumType.STRING)
    @Column(name = "period_type", length = 20, nullable = false)
    private PeriodType periodType;

    @Column(name = "period_number", nullable = false)
    private Integer periodNumber; // Número del periodo (1, 2, 3...)

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "close_date")
    private LocalDate closeDate; // Fecha en que se cerró el periodo

    // === ESTATUS ===
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "description", length = 255)
    private String description;

    // === EMPLEADOS ASIGNADOS ===
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(name = "payroll_period_employees", joinColumns = @JoinColumn(name = "period_id"), inverseJoinColumns = @JoinColumn(name = "employee_id"))
    private Set<Employee> assignedEmployees = new HashSet<>();

    // === TOTALES ===
    @Column(name = "total_payroll", precision = 15, scale = 2)
    private BigDecimal totalPayroll = BigDecimal.ZERO;

    @Column(name = "elapsed_payroll", precision = 15, scale = 2)
    private BigDecimal elapsedPayroll = BigDecimal.ZERO;

    // === FECHAS DE CONTROL ===
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt; // Fecha de procesamiento

    @Column(name = "approved_at")
    private LocalDateTime approvedAt; // Fecha de aprobación

    @Column(name = "paid_at")
    private LocalDateTime paidAt; // Fecha de pago realizado

    // === ENUMS ===
    public enum PeriodType {
        WEEKLY, // Semanal
        BIWEEKLY, // Quincenal
        MONTHLY // Mensual
    }

    public enum PeriodStatus {
        OPEN, // Abierto (se pueden registrar novedades)
        LIQUIDATED, // Liquidado (calculado y generados recibos, listo para pagar)
        PARTIALLY_PAID, // Parcialmente pagado (algunos empleados pagados)
        PAID, // Completamente pagado (todos los empleados pagados)
        CLOSED // Cerrado contablemente (no se puede modificar)
    }

    // Métodos helper
    public String getPeriodName() {
        return periodType.name() + " " + periodNumber + "/" + year;
    }

    public boolean canModify() {
        return status == PeriodStatus.OPEN;
    }

    public boolean isProcessed() {
        return status == PeriodStatus.LIQUIDATED ||
                status == PeriodStatus.PARTIALLY_PAID ||
                status == PeriodStatus.PAID ||
                status == PeriodStatus.CLOSED;
    }

    public boolean canBePaid() {
        return status == PeriodStatus.LIQUIDATED || status == PeriodStatus.PARTIALLY_PAID;
    }

    public int getWorkingDays() {
        return switch (periodType) {
            case WEEKLY -> 7;
            case BIWEEKLY -> 15;
            case MONTHLY -> 30;
        };
    }
}
