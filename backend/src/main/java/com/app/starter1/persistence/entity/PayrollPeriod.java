package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
        OPEN, // Abierto (se pueden registrar incidencias)
        CALCULATED, // Calculado (nómina calculada, pero no aprobada)
        APPROVED, // Aprobado (listo para pagar)
        PAID, // Pagado (dispersión realizada)
        CLOSED // Cerrado (no se puede modificar)
    }

    // Métodos helper
    public String getPeriodName() {
        return periodType.name() + " " + periodNumber + "/" + year;
    }

    public boolean canModify() {
        return status == PeriodStatus.OPEN || status == PeriodStatus.CALCULATED;
    }

    public boolean isProcessed() {
        return status == PeriodStatus.CALCULATED ||
                status == PeriodStatus.APPROVED ||
                status == PeriodStatus.PAID ||
                status == PeriodStatus.CLOSED;
    }

    public int getWorkingDays() {
        return switch (periodType) {
            case WEEKLY -> 7;
            case BIWEEKLY -> 15;
            case MONTHLY -> 30;
        };
    }
}
