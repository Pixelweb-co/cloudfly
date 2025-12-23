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

    @Column(name = "sat_code", length = 10)
    private String satCode; // Clave SAT para México (ej: "001" para Sueldo)

    // === CONFIGURACIÓN FISCAL ===
    @Column(name = "is_taxable", nullable = false)
    private Boolean isTaxable = true; // Si grava para ISR

    @Column(name = "is_imss_subject", nullable = false)
    private Boolean isImssSubject = false; // Si integra para IMSS

    // === CONFIGURACIÓN DE CÁLCULO ===
    @Column(name = "calculation_formula", length = 255)
    private String calculationFormula; // Fórmula de cálculo (opcional, ej: "base_salary * 0.1")

    @Column(name = "is_system_concept", nullable = false)
    private Boolean isSystemConcept = false; // Si es un concepto del sistema (no se puede eliminar)

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
        PERCEPCION, // Percepciones (ingresos)
        DEDUCCION // Deducciones (descuentos)
    }

    // Códigos SAT comunes (México)
    public static class SATCodes {
        public static final String SUELDO = "001";
        public static final String AGUINALDO = "002";
        public static final String PRIMA_VACACIONAL = "021";
        public static final String HORAS_EXTRA = "019";
        public static final String ISR = "002"; // Para deducciones
        public static final String IMSS = "001"; // Para deducciones
    }
}
