package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entidad que representa un Período Fiscal
 */
@Entity
@Table(name = "fiscal_periods")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FiscalPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private Integer tenantId;

    /**
     * Año fiscal
     */
    @Column(nullable = false)
    private Integer year;

    /**
     * Período (mes) del 1 al 12
     */
    @Column(nullable = false)
    private Integer period;

    /**
     * Fecha de inicio del período
     */
    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    /**
     * Fecha de fin del período
     */
    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    /**
     * Estado del período
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private PeriodStatus status = PeriodStatus.OPEN;

    /**
     * Fecha de cierre del período
     */
    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    /**
     * Usuario que cerró el período
     */
    @Column(name = "closed_by")
    private Long closedBy;

    /**
     * Verifica si el período está abierto
     */
    public boolean isOpen() {
        return status == PeriodStatus.OPEN;
    }

    /**
     * Verifica si el período está cerrado
     */
    public boolean isClosed() {
        return status == PeriodStatus.CLOSED;
    }

    /**
     * Cierra el período
     */
    public void close(Long userId) {
        if (isClosed()) {
            throw new IllegalStateException("El período ya está cerrado");
        }
        this.status = PeriodStatus.CLOSED;
        this.closedAt = LocalDateTime.now();
        this.closedBy = userId;
    }

    /**
     * Reabre el período
     */
    public void reopen() {
        if (isOpen()) {
            throw new IllegalStateException("El período ya está abierto");
        }
        this.status = PeriodStatus.OPEN;
        this.closedAt = null;
        this.closedBy = null;
    }

    /**
     * Obtiene el nombre del período
     */
    public String getPeriodName() {
        String[] months = { "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre" };
        return months[period - 1] + " " + year;
    }

    /**
     * Estados del período fiscal
     */
    public enum PeriodStatus {
        OPEN("Abierto"),
        CLOSED("Cerrado");

        private final String description;

        PeriodStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}
