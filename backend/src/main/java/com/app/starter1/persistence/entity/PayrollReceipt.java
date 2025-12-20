package com.app.starter1.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad para recibos de nómina individuales
 */
@Entity
@Table(name = "payroll_receipts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollReceipt {

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

    // === INFORMACIÓN DEL RECIBO ===
    @Column(name = "receipt_number", unique = true, length = 50)
    private String receiptNumber; // Número de recibo único

    @Column(name = "calculation_date", nullable = false)
    private LocalDateTime calculationDate;

    // === DÍAS TRABAJADOS ===
    @Column(name = "regular_days", precision = 5, scale = 2, nullable = false)
    private BigDecimal regularDays; // Días regulares trabajados

    @Column(name = "absence_days", precision = 5, scale = 2)
    private BigDecimal absenceDays = BigDecimal.ZERO;

    @Column(name = "overtime_hours", precision = 5, scale = 2)
    private BigDecimal overtimeHours = BigDecimal.ZERO;

    // === SALARIO BASE ===
    @Column(name = "base_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal baseSalary;

    @Column(name = "daily_salary", precision = 12, scale = 2, nullable = false)
    private BigDecimal dailySalary;

    // ========================================
    // DEVENGOS / EARNINGS (Colombia)
    // ========================================
    @Column(name = "salary_amount", precision = 12, scale = 2)
    private BigDecimal salaryAmount = BigDecimal.ZERO;

    @Column(name = "overtime_amount", precision = 12, scale = 2)
    private BigDecimal overtimeAmount = BigDecimal.ZERO;

    @Column(name = "commissions_amount", precision = 12, scale = 2)
    private BigDecimal commissionsAmount = BigDecimal.ZERO;

    @Column(name = "transport_allowance_amount", precision = 12, scale = 2)
    private BigDecimal transportAllowanceAmount = BigDecimal.ZERO;

    @Column(name = "bonuses_amount", precision = 12, scale = 2)
    private BigDecimal bonusesAmount = BigDecimal.ZERO;

    @Column(name = "other_earnings", precision = 12, scale = 2)
    private BigDecimal otherEarnings = BigDecimal.ZERO;

    // ========================================
    // DEDUCCIONES LEGALES (Colombia)
    // ========================================
    @Column(name = "health_deduction", precision = 12, scale = 2)
    private BigDecimal healthDeduction = BigDecimal.ZERO; // 4% empleado

    @Column(name = "pension_deduction", precision = 12, scale = 2)
    private BigDecimal pensionDeduction = BigDecimal.ZERO; // 4% empleado

    @Column(name = "other_deductions", precision = 12, scale = 2)
    private BigDecimal otherDeductions = BigDecimal.ZERO; // Préstamos, embargos, descuentos

    // ========================================
    // COSTOS DEL EMPLEADOR (para contabilidad)
    // ========================================
    @Column(name = "employer_health_contribution", precision = 12, scale = 2)
    private BigDecimal employerHealthContribution = BigDecimal.ZERO; // 8.5%

    @Column(name = "employer_pension_contribution", precision = 12, scale = 2)
    private BigDecimal employerPensionContribution = BigDecimal.ZERO; // 12%

    @Column(name = "arl_contribution", precision = 12, scale = 2)
    private BigDecimal arlContribution = BigDecimal.ZERO; // 0.522% - 6.96%

    @Column(name = "sena_contribution", precision = 12, scale = 2)
    private BigDecimal senaContribution = BigDecimal.ZERO; // 2%

    @Column(name = "icbf_contribution", precision = 12, scale = 2)
    private BigDecimal icbfContribution = BigDecimal.ZERO; // 3%

    @Column(name = "caja_compensacion_contribution", precision = 12, scale = 2)
    private BigDecimal cajaCompensacionContribution = BigDecimal.ZERO; // 4%

    // ========================================
    // PROVISIONES (Prestaciones Sociales)
    // ========================================
    @Column(name = "prima_servicios_provision", precision = 12, scale = 2)
    private BigDecimal primaServiciosProvision = BigDecimal.ZERO;

    @Column(name = "cesantias_provision", precision = 12, scale = 2)
    private BigDecimal cesantiasProvision = BigDecimal.ZERO;

    @Column(name = "intereses_cesantias_provision", precision = 12, scale = 2)
    private BigDecimal interesesCesantiasProvision = BigDecimal.ZERO;

    @Column(name = "vacaciones_provision", precision = 12, scale = 2)
    private BigDecimal vacacionesProvision = BigDecimal.ZERO;

    // === TOTALES CALCULADOS ===
    @Column(name = "total_perceptions", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalPerceptions = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_pay", precision = 12, scale = 2, nullable = false)
    private BigDecimal netPay = BigDecimal.ZERO;

    @Column(name = "total_employer_costs", precision = 12, scale = 2)
    private BigDecimal totalEmployerCosts = BigDecimal.ZERO;

    @Column(name = "total_provisions", precision = 12, scale = 2)
    private BigDecimal totalProvisions = BigDecimal.ZERO;

    // === ESTATUS ===
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ReceiptStatus status = ReceiptStatus.PENDING;

    // === TIMBRADO CFDI (México) ===
    @Column(name = "uuid", length = 36)
    private String uuid; // UUID del CFDI

    @Column(name = "xml_path", length = 255)
    private String xmlPath;

    @Column(name = "pdf_path", length = 255)
    private String pdfPath;

    @Column(name = "stamped_at")
    private LocalDateTime stampedAt;

    // === PAGO ===
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_reference", length = 100)
    private String paymentReference; // Referencia bancaria del pago

    // === NOTAS ===
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // === FECHAS DE CONTROL ===
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // === ENUMS ===
    public enum ReceiptStatus {
        PENDING, // Generado, pendiente de pago
        PAID, // Pagado y notificado
        CANCELLED // Cancelado
    }

    // Métodos helper
    public void calculateNetPay() {
        // Calcular total de devengos
        this.totalPerceptions = this.salaryAmount
                .add(this.overtimeAmount)
                .add(this.commissionsAmount)
                .add(this.transportAllowanceAmount)
                .add(this.bonusesAmount)
                .add(this.otherEarnings);

        // Calcular total de deducciones
        this.totalDeductions = this.healthDeduction
                .add(this.pensionDeduction)
                .add(this.otherDeductions);

        // Calcular neto a pagar
        this.netPay = this.totalPerceptions.subtract(this.totalDeductions);

        // Calcular total costos del empleador
        this.totalEmployerCosts = this.employerHealthContribution
                .add(this.employerPensionContribution)
                .add(this.arlContribution)
                .add(this.senaContribution)
                .add(this.icbfContribution)
                .add(this.cajaCompensacionContribution);

        // Calcular total provisiones
        this.totalProvisions = this.primaServiciosProvision
                .add(this.cesantiasProvision)
                .add(this.interesesCesantiasProvision)
                .add(this.vacacionesProvision);
    }

    public BigDecimal getTotalCost() {
        // Costo total para la empresa = Neto + Costos patronales + Provisiones
        return this.netPay
                .add(this.totalEmployerCosts)
                .add(this.totalProvisions);
    }

    public boolean isPaid() {
        return status == ReceiptStatus.PAID && paidAt != null;
    }

    public boolean canBePaid() {
        return status == ReceiptStatus.PENDING;
    }
}
