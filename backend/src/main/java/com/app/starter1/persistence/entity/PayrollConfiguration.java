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
 * Configuración de nómina por Tenant
 */
@Entity
@Table(name = "payroll_configuration")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación uno a uno con Customer
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false, unique = true)
    private Customer customer;

    // === CONFIGURACIÓN DE DÍAS Y PRESTACIONES ===
    @Column(name = "aguinaldo_days", nullable = false)
    private Integer aguinaldoDays = 15; // Días de aguinaldo (México: mínimo 15 días)

    @Column(name = "vacation_days_per_year", nullable = false)
    private Integer vacationDaysPerYear = 6; // Días de vacaciones por año

    @Column(name = "vacation_premium_percentage", precision = 5, scale = 2, nullable = false)
    private BigDecimal vacationPremiumPercentage = new BigDecimal("25.00"); // Prima vacacional (México: mínimo 25%)

    // === CONFIGURACIÓN DE IMPUESTOS ===
    @Column(name = "apply_isr", nullable = false)
    private Boolean applyIsr = true; // Aplicar ISR (Impuesto Sobre la Renta)

    @Column(name = "apply_imss", nullable = false)
    private Boolean applyImss = true; // Aplicar IMSS (Seguro Social)

    @Column(name = "imss_worker_percentage", precision = 5, scale = 2)
    private BigDecimal imssWorkerPercentage = new BigDecimal("2.375"); // Cuota obrera IMSS (aproximado)

    @Column(name = "imss_employer_percentage", precision = 5, scale = 2)
    private BigDecimal imssEmployerPercentage = new BigDecimal("20.40"); // Cuota patronal IMSS (aproximado)

    // === CONFIGURACIÓN DE SALARIO MÍNIMO ===
    @Column(name = "minimum_wage", precision = 10, scale = 2)
    private BigDecimal minimumWage = new BigDecimal("207.44"); // Salario mínimo (México 2024)

    @Column(name = "uma_value", precision = 10, scale = 2)
    private BigDecimal umaValue = new BigDecimal("103.74"); // UMA (Unidad de Medida y Actualización)

    // === CONFIGURACIÓN DE NÓMINA ===
    @Column(name = "enable_cfdi_timbrado", nullable = false)
    private Boolean enableCfdiTimbrado = false; // Habilitar timbrado de CFDI

    @Column(name = "pac_provider", length = 50)
    private String pacProvider; // Proveedor PAC para timbrado

    @Column(name = "pac_api_key", length = 255)
    private String pacApiKey;

    @Column(name = "pac_api_url", length = 255)
    private String pacApiUrl;

    // === CONFIGURACIÓN DE DISPERSIÓN BANCARIA ===
    @Column(name = "bank_layout_format", length = 50)
    private String bankLayoutFormat = "STANDARD_CLABE"; // Formato del layout bancario

    // === CONFIGURACIÓN CONTABLE ===
    @Column(name = "enable_accounting_integration", nullable = false)
    private Boolean enableAccountingIntegration = true; // Integrar con contabilidad

    @Column(name = "payroll_expense_account", length = 20)
    private String payrollExpenseAccount; // Cuenta contable de gastos de nómina

    @Column(name = "taxes_payable_account", length = 20)
    private String taxesPayableAccount; // Cuenta contable de impuestos por pagar

    @Column(name = "salaries_payable_account", length = 20)
    private String salariesPayableAccount; // Cuenta contable de sueldos por pagar

    // === NOTIFICACIONES ===
    @Column(name = "send_receipts_by_email", nullable = false)
    private Boolean sendReceiptsByEmail = true;

    @Column(name = "send_receipts_by_whatsapp", nullable = false)
    private Boolean sendReceiptsByWhatsapp = false;

    // === FECHAS ===
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Método helper para obtener configuración por defecto
    public static PayrollConfiguration getDefault(Customer customer) {
        return PayrollConfiguration.builder()
                .customer(customer)
                .aguinaldoDays(15)
                .vacationDaysPerYear(6)
                .vacationPremiumPercentage(new BigDecimal("25.00"))
                .applyIsr(true)
                .applyImss(true)
                .imssWorkerPercentage(new BigDecimal("2.375"))
                .imssEmployerPercentage(new BigDecimal("20.40"))
                .minimumWage(new BigDecimal("207.44"))
                .umaValue(new BigDecimal("103.74"))
                .enableCfdiTimbrado(false)
                .bankLayoutFormat("STANDARD_CLABE")
                .enableAccountingIntegration(true)
                .sendReceiptsByEmail(true)
                .sendReceiptsByWhatsapp(false)
                .build();
    }
}
