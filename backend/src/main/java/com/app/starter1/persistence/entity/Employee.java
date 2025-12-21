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
 * Entidad para la gestión de empleados en el sistema de Recursos Humanos
 */
@Entity
@Table(name = "employees")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con Customer (Multi-tenancy)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Relación con UserEntity (Acceso al sistema - opcional)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    // === DATOS PERSONALES ===
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "rfc", length = 13)
    private String rfc; // RFC (México) - 13 caracteres

    @Column(name = "curp", length = 18)
    private String curp; // CURP (México) - 18 caracteres

    @Column(name = "national_id", length = 50)
    private String nationalId; // Identificación nacional (genérico para otros países)

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "city", length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "postal_code", length = 10)
    private String postalCode;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    // === INFORMACIÓN LABORAL ===
    @Column(name = "employee_number", unique = true, length = 20)
    private String employeeNumber; // Número de empleado único en la empresa

    @Column(name = "hire_date", nullable = false)
    private LocalDate hireDate; // Fecha de ingreso

    @Column(name = "termination_date")
    private LocalDate terminationDate; // Fecha de baja

    @Column(name = "department", length = 100)
    private String department; // Departamento o área

    /**
     * Centro de costo al que pertenece el empleado (para contabilidad analítica)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cost_center_id")
    private CostCenter costCenter;

    @Column(name = "job_title", length = 100)
    private String jobTitle; // Puesto o cargo

    @Column(name = "contract_type", length = 50)
    private String contractType; // Tipo de contrato (Temporal, Indefinido, etc.)

    // === INFORMACIÓN SALARIAL ===
    @Column(name = "base_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal baseSalary; // Salario base

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_frequency", length = 20, nullable = false)
    private PaymentFrequency paymentFrequency; // Periodicidad de pago

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    private PaymentMethod paymentMethod; // Método de pago

    // === INFORMACIÓN BANCARIA ===
    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account", length = 50)
    private String bankAccount; // Número de cuenta

    @Column(name = "clabe", length = 18)
    private String clabe; // CLABE interbancaria (México) - 18 dígitos

    // === SEGURIDAD SOCIAL (Colombia) ===
    @Column(name = "nss", length = 15)
    private String nss; // Número de Seguro Social (IMSS México)

    @Column(name = "eps", length = 100)
    private String eps; // EPS (Entidad Promotora de Salud - Colombia)

    @Column(name = "arl", length = 100)
    private String arl; // ARL (Administradora de Riesgos Laborales - Colombia)

    @Column(name = "afp", length = 100)
    private String afp; // AFP (Fondo de Pensiones - Colombia)

    @Column(name = "cesantias_box", length = 100)
    private String cesantiasBox; // Caja de Cesantías (Colombia)

    // === TIPO DE SALARIO (Colombia) ===
    @Enumerated(EnumType.STRING)
    @Column(name = "salary_type", length = 20)
    private SalaryType salaryType = SalaryType.ORDINARIO;

    @Column(name = "has_transport_allowance", nullable = false)
    private Boolean hasTransportAllowance = true; // ¿Aplica auxilio de transporte?

    @Enumerated(EnumType.STRING)
    @Column(name = "arl_risk_level", length = 10)
    private ArlRiskLevel arlRiskLevel = ArlRiskLevel.RIESGO_I; // Nivel de riesgo ARL

    @Column(name = "caja_compensacion", length = 100)
    private String cajaCompensacion; // Caja de Compensación Familiar (Comfama, Cafam, etc.)

    @Enumerated(EnumType.STRING)
    @Column(name = "work_schedule", length = 20)
    private WorkSchedule workSchedule = WorkSchedule.TIEMPO_COMPLETO; // Jornada laboral

    @Column(name = "monthly_worked_days")
    private Integer monthlyWorkedDays = 30; // Días laborados al mes (default 30)

    @Column(name = "has_family_subsidy", nullable = false)
    private Boolean hasFamilySubsidy = false; // ¿Aplica subsidio familiar?

    @Enumerated(EnumType.STRING)
    @Column(name = "contract_type_enum", length = 30)
    private ContractTypeEnum contractTypeEnum; // Tipo de contrato enum

    // === ESTATUS Y CONTROL ===
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes; // Notas adicionales

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // Soft delete

    // === ENUMS ===
    public enum PaymentFrequency {
        WEEKLY, // Semanal (7 días)
        BIWEEKLY, // Quincenal (15 días)
        MONTHLY // Mensual (30 días)
    }

    public enum PaymentMethod {
        BANK_TRANSFER, // Transferencia bancaria
        CASH, // Efectivo
        CHECK // Cheque
    }

    public enum SalaryType {
        ORDINARIO, // Salario ordinario (aplica todas las prestaciones)
        INTEGRAL // Salario integral (>13 SMMLV, incluye prestaciones)
    }

    public enum ContractTypeEnum {
        INDEFINIDO, // Contrato a término indefinido
        FIJO, // Contrato a término fijo
        OBRA_LABOR, // Contrato por obra o labor
        TEMPORAL, // Contrato temporal
        APRENDIZAJE, // Contrato de aprendizaje SENA
        PRESTACION_SERVICIOS // Prestación de servicios (independiente)
    }

    public enum ArlRiskLevel {
        RIESGO_I(0.522), // Riesgo I: 0.522% - Actividades administrativas
        RIESGO_II(1.044), // Riesgo II: 1.044% - Actividades comerciales
        RIESGO_III(2.436), // Riesgo III: 2.436% - Manufacturas
        RIESGO_IV(4.350), // Riesgo IV: 4.350% - Construcción
        RIESGO_V(6.960); // Riesgo V: 6.960% - Minería, alta peligrosidad

        private final double percentage;

        ArlRiskLevel(double percentage) {
            this.percentage = percentage;
        }

        public double getPercentage() {
            return percentage;
        }
    }

    public enum WorkSchedule {
        TIEMPO_COMPLETO, // Jornada completa (8 horas)
        MEDIO_TIEMPO, // Medio tiempo (4 horas)
        POR_HORAS // Trabajo por horas
    }

    // Método helper para obtener nombre completo
    public String getFullName() {
        return firstName + " " + lastName;
    }

    // Método helper para verificar si está activo
    public boolean isActiveEmployee() {
        return isActive && deletedAt == null && terminationDate == null;
    }
}
