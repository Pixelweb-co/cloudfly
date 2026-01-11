package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad para conceptos de nómina (Percepciones y Deducciones)
 */
@Entity
@Table(name = "payroll_concepts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollConcept {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con Customer (Multi-tenancy)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // === INFORMACIÓN DEL CONCEPTO ===
    @Enumerated(EnumType.STRING)
    @Column(name = "concept_type", length = 20, nullable = false)
    private ConceptType conceptType; // PERCEPCION o DEDUCCION

    @Column(name = "code", length = 20, nullable = false)
    private String code; // Código único del concepto

    @Column(name = "name", length = 100, nullable = false)
    private String name; // Nombre del concepto

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "dian_code", length = 20)
    private String dianCode; // Código Concepto DIAN (ej: "BASICO", "TRANSPORTE")

    @Column(name = "sat_code", length = 10)
    private String satCode; // Se mantiene por retrocompatibilidad si es necesario

    // === CONFIGURACIÓN FISCAL ===
    @Column(name = "is_taxable", nullable = false)
    private Boolean isTaxable = true; // Si es base para Retención en la Fuente

    @Column(name = "is_imss_subject", nullable = false)
    private Boolean isImssSubject = false; // Si es base para Seguridad Social (IBC)

    // === CONFIGURACIÓN DE CÁLCULO ===
    @Column(name = "calculation_formula", length = 255)
    private String calculationFormula; // Fórmula de cálculo (opcional)

    @Column(name = "is_system_concept", nullable = false)
    private Boolean isSystemConcept = false; // Si es un concepto del sistema

    // === ESTATUS ===
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // Soft delete

    // === ENUMS ===
    public enum ConceptType {
        PERCEPCION, // Ingresos
        DEDUCCION // Egresos
    }

    // Códigos DIAN Colombia (Resolución 000013)
    public static class DIANCodes {
        // DEVENGOS
        public static final String BASICO = "BASICO";
        public static final String TRANSPORTE = "TRANSPORTE";
        public static final String HED = "HED"; // Hora Extra Diurna
        public static final String HEN = "HEN"; // Hora Extra Nocturna
        public static final String HRN = "HRN"; // Recargo Nocturno
        public static final String HEDDF = "HEDDF"; // Hora Extra Dom/Fest Diurna
        public static final String HENDF = "HENDF"; // Hora Extra Dom/Fest Nocturna
        public static final String HRDDF = "HRDDF"; // Recargo Dom/Fest Diurno
        public static final String HRNDF = "HRNDF"; // Recargo Dom/Fest Nocturno
        public static final String COMISION = "COMISION";
        public static final String BONIFICACION = "BONIFICACION"; // Salarial
        public static final String BONIFICACION_NS = "BONIFICACION_NS"; // No Salarial
        public static final String AUXILIO = "AUXILIO"; // No Salarial
        public static final String INCAPACIDAD = "INCAPACIDAD";
        public static final String LICENCIA_MP = "LICENCIA_MP"; // Maternidad/Paternidad
        public static final String LICENCIA_R = "LICENCIA_R"; // Remunerada
        public static final String LICENCIA_NR = "LICENCIA_NR"; // No Remunerada
        public static final String OTROS_CONCEPTOS = "OTROS_CONCEPTOS";

        // DEDUCCIONES
        public static final String SALUD = "SALUD";
        public static final String PENSION = "PENSION";
        public static final String FONDO_SP = "FONDO_SP"; // Fondo Solidaridad Pensional
        public static final String FONDO_SUB = "FONDO_SUB"; // Fondo Subsistencia
        public static final String SINDICATO = "SINDICATO";
        public static final String SANCION = "SANCION";
        public static final String LIBRANZA = "LIBRANZA";
        public static final String OTRAS_DEDUCCIONES = "OTRAS_DEDUCCIONES";
        public static final String ANTICIPO = "ANTICIPO";
        public static final String RETENCION_FUENTE = "RETENCION_FUENTE";
    }
}
