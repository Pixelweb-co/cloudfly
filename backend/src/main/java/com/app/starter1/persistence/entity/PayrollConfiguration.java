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
    @Column(name = "minimum_wage", precision = 15, scale = 2)
    private BigDecimal minimumWage = new BigDecimal("1423500"); // SMMLV Colombia 2025

    @Column(name = "uma_value", precision = 15, scale = 2)
    private BigDecimal umaValue = new BigDecimal("47065"); // UVT Colombia 2024

    @Column(name = "transport_allowance", precision = 15, scale = 2)
    private BigDecimal transportAllowance = new BigDecimal("200000"); // Auxilio transporte 2025

    // === SEGURIDAD SOCIAL - EMPLEADO ===
    @Column(name = "health_percentage_employee", precision = 5, scale = 2)
    private BigDecimal healthPercentageEmployee = new BigDecimal("4.00"); // Salud 4%

    @Column(name = "pension_percentage_employee", precision = 5, scale = 2)
    private BigDecimal pensionPercentageEmployee = new BigDecimal("4.00"); // Pensión 4%

    // === SEGURIDAD SOCIAL - EMPLEADOR ===
    @Column(name = "health_percentage_employer", precision = 5, scale = 2)
    private BigDecimal healthPercentageEmployer = new BigDecimal("8.50"); // Salud 8.5%

    @Column(name = "pension_percentage_employer", precision = 5, scale = 2)
    private BigDecimal pensionPercentageEmployer = new BigDecimal("12.00"); // Pensión 12%

    @Column(name = "arl_percentage", precision = 5, scale = 3)
    private BigDecimal arlPercentage = new BigDecimal("0.522"); // ARL Riesgo I

    @Column(name = "solidarity_fund_percentage", precision = 5, scale = 2)
    private BigDecimal solidarityFundPercentage = new BigDecimal("1.00"); // Fondo Solidaridad (>4 SMMLV)

    // === APORTES PARAFISCALES ===
    @Column(name = "parafiscal_caja_percentage", precision = 5, scale = 2)
    private BigDecimal parafiscalCajaPercentage = new BigDecimal("4.00"); // Caja Compensación 4%

    @Column(name = "parafiscal_sena_percentage", precision = 5, scale = 2)
    private BigDecimal parafiscalSenaPercentage = new BigDecimal("2.00"); // SENA 2%

    @Column(name = "parafiscal_icbf_percentage", precision = 5, scale = 2)
    private BigDecimal parafiscalIcbfPercentage = new BigDecimal("3.00"); // ICBF 3%

    // === PROVISIONES ===
    @Column(name = "prima_percentage", precision = 5, scale = 2)
    private BigDecimal primaPercentage = new BigDecimal("8.33"); // Prima de servicios

    @Column(name = "cesantias_percentage", precision = 5, scale = 2)
    private BigDecimal cesantiasPercentage = new BigDecimal("8.33"); // Cesantías

    @Column(name = "intereses_cesantias_percentage", precision = 5, scale = 2)
    private BigDecimal interesesCesantiasPercentage = new BigDecimal("12.00"); // Intereses cesantías anual

    @Column(name = "vacaciones_percentage", precision = 5, scale = 2)
    private BigDecimal vacacionesPercentage = new BigDecimal("4.17"); // Vacaciones

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

    // Método helper para obtener configuración por defecto (Colombia 2025)
    public static PayrollConfiguration getDefault(Customer customer) {
        return PayrollConfiguration.builder()
                .customer(customer)
                // Prestaciones
                .aguinaldoDays(15)
                .vacationDaysPerYear(15)
                .vacationPremiumPercentage(new BigDecimal("4.17"))
                // Impuestos
                .applyIsr(true)
                .applyImss(true)
                .imssWorkerPercentage(new BigDecimal("8.00"))
                .imssEmployerPercentage(new BigDecimal("20.50"))
                // Salarios de referencia Colombia 2025
                .minimumWage(new BigDecimal("1423500"))
                .umaValue(new BigDecimal("47065"))
                .transportAllowance(new BigDecimal("200000"))
                // Seguridad Social - Empleado
                .healthPercentageEmployee(new BigDecimal("4.00"))
                .pensionPercentageEmployee(new BigDecimal("4.00"))
                // Seguridad Social - Empleador
                .healthPercentageEmployer(new BigDecimal("8.50"))
                .pensionPercentageEmployer(new BigDecimal("12.00"))
                .arlPercentage(new BigDecimal("0.522"))
                .solidarityFundPercentage(new BigDecimal("1.00"))
                // Parafiscales
                .parafiscalCajaPercentage(new BigDecimal("4.00"))
                .parafiscalSenaPercentage(new BigDecimal("2.00"))
                .parafiscalIcbfPercentage(new BigDecimal("3.00"))
                // Provisiones
                .primaPercentage(new BigDecimal("8.33"))
                .cesantiasPercentage(new BigDecimal("8.33"))
                .interesesCesantiasPercentage(new BigDecimal("12.00"))
                .vacacionesPercentage(new BigDecimal("4.17"))
                // Otros
                .enableCfdiTimbrado(false)
                .bankLayoutFormat("STANDARD_CLABE")
                .enableAccountingIntegration(true)
                .sendReceiptsByEmail(true)
                .sendReceiptsByWhatsapp(false)
                .build();
    }
}
