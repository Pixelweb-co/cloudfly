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

    // === TOTALES ===
    @Column(name = "total_perceptions", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalPerceptions = BigDecimal.ZERO;

    @Column(name = "total_deductions", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalDeductions = BigDecimal.ZERO;

    @Column(name = "net_pay", precision = 12, scale = 2, nullable = false)
    private BigDecimal netPay = BigDecimal.ZERO;

    // === DESGLOSE DE IMPUESTOS ===
    @Column(name = "isr_amount", precision = 12, scale = 2)
    private BigDecimal isrAmount = BigDecimal.ZERO;

    @Column(name = "imss_amount", precision = 12, scale = 2)
    private BigDecimal imssAmount = BigDecimal.ZERO;

    // === ESTATUS ===
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ReceiptStatus status = ReceiptStatus.CALCULATED;

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
        this.netPay = this.totalPerceptions.subtract(this.totalDeductions);
    }

    public boolean isPaid() {
        return status == ReceiptStatus.PAID && paidAt != null;
    }

    public boolean canBePaid() {
        return status == ReceiptStatus.PENDING;
    }
}
