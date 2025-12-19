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
 * Entidad para registrar incidencias de nómina
 * (Faltas, horas extra, bonos, incapacidades, etc.)
 */
@Entity
@Table(name = "payroll_incidences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollIncidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // === RELACIONES ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payroll_period_id", nullable = false)
    private PayrollPeriod payrollPeriod;

    // === TIPO DE INCIDENCIA ===
    @Enumerated(EnumType.STRING)
    @Column(name = "incidence_type", length = 30, nullable = false)
    private IncidenceType incidenceType;

    // === FECHAS Y CANTIDADES ===
    @Column(name = "incidence_date", nullable = false)
    private LocalDate incidenceDate; // Fecha de la incidencia

    @Column(name = "start_date")
    private LocalDate startDate; // Para periodos (ej: vacaciones de 5 días)

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "days", precision = 5, scale = 2)
    private BigDecimal days; // Número de días (puede ser fracción para medio día)

    @Column(name = "hours", precision = 5, scale = 2)
    private BigDecimal hours; // Número de horas (para horas extra)

    // === MONTO ===
    @Column(name = "amount", precision = 12, scale = 2)
    private BigDecimal amount; // Monto de la incidencia (ej: bono de $500)

    // === INFORMACIÓN ADICIONAL ===
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "justification", columnDefinition = "TEXT")
    private String justification;

    @Column(name = "document_path", length = 255)
    private String documentPath; // Ruta del documento justificante

    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = false;

    @Column(name = "approved_by")
    private Long approvedBy; // ID del usuario que aprobó

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // === FECHAS DE CONTROL ===
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === ENUMS ===
    public enum IncidenceType {
        // Deducciones (impacto negativo)
        FALTA("Falta", false),
        RETARDO("Retardo", false),
        INCAPACIDAD("Incapacidad", false),
        PERMISO_SIN_GOCE("Permiso sin goce de sueldo", false),
        SUSPENSION("Suspensión", false),

        // Percepciones (impacto positivo)
        HORAS_EXTRA("Horas extra", true),
        BONO("Bono", true),
        COMISION("Comisión", true),
        PRIMA_DOMINICAL("Prima dominical", true),
        COMPENSACION("Compensación", true),

        // Neutras (pueden ser con o sin goce de sueldo)
        VACACIONES("Vacaciones", true),
        PERMISO_CON_GOCE("Permiso con goce de sueldo", true),
        DIA_FESTIVO("Día festivo trabajado", true);

        private final String description;
        private final boolean isPositive;

        IncidenceType(String description, boolean isPositive) {
            this.description = description;
            this.isPositive = isPositive;
        }

        public String getDescription() {
            return description;
        }

        public boolean isPositive() {
            return isPositive;
        }
    }

    // Método helper para determinar si afecta positivamente
    public boolean hasPositiveImpact() {
        return incidenceType.isPositive();
    }

    // Método para calcular el impacto en días
    public BigDecimal getImpactInDays() {
        if (days != null) {
            return hasPositiveImpact() ? days : days.negate();
        }
        return BigDecimal.ZERO;
    }
}
